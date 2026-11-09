import ExcelJS from "exceljs";
import { parse } from "csv-parse/sync";
import yauzl from "yauzl";
import { SaxesParser } from "saxes";
import { StringDecoder } from "node:string_decoder";
import { importFields, type SourceRow } from "./fields";
export const importLimit = 8 * 1024 * 1024;
export const rowLimit = 10000;
export async function validateXlsxArchive(bytes: Buffer) {
  await new Promise<void>((resolve, reject) => {
    yauzl.fromBuffer(
      bytes,
      { lazyEntries: true, validateEntrySizes: true },
      (error, zip) => {
        if (error || !zip) {
          reject(new Error("Invalid XLSX ZIP container."));
          return;
        }
        let total = 0;
        let count = 0;
        let actualTotal = 0;
        let xmlTags = 0;
        let strings = 0;
        let styles = 0;
        let failed = false;
        const names = new Set<string>();
        const fail = (message: string) => {
          if (failed) return;
          failed = true;
          zip.close();
          reject(new Error(message));
        };
        zip.on("error", () => fail("Invalid XLSX archive."));
        zip.on("end", () => resolve());
        zip.on("entry", (entry: yauzl.Entry) => {
          count++;
          total += entry.uncompressedSize;
          if (
            count > 512 ||
            names.has(entry.fileName) ||
            total > 32 * 1024 * 1024 ||
            entry.uncompressedSize > 16 * 1024 * 1024 ||
            entry.uncompressedSize >
              Math.max(1024 * 1024, entry.compressedSize * 150) ||
            entry.generalPurposeBitFlag & 1 ||
            /(?:^|\/)\.\.(?:\/|$)|vbaProject|externalLinks|macrosheets|activeX|embeddings/i.test(
              entry.fileName,
            )
          ) {
            fail("Unsafe, encrypted, macro-enabled or oversized XLSX archive.");
            return;
          }
          names.add(entry.fileName);
          zip.openReadStream(entry, (streamError, stream) => {
            if (streamError || !stream) {
              fail("Invalid XLSX entry.");
              return;
            }
            const worksheet = /^xl\/worksheets\/[^/]+\.xml$/i.test(
              entry.fileName,
            );
            const xml = /\.(xml|rels)$/i.test(entry.fileName)
              ? new SaxesParser({ xmlns: false })
              : null;
            const decoder = new StringDecoder("utf8");
            let actual = 0;
            let depth = 0;
            let rowCells = 0;
            let rows = 0;
            let cells = 0;
            let textDepth = 0;
            let textSize = 0;
            const reference = (value: string) => {
              for (const ref of value.split(/[:\s]+/)) {
                const match = ref.match(/^\$?([a-z]+)\$?(\d+)$/i);
                if (!match) continue;
                let col = 0;
                for (const char of match[1].toUpperCase())
                  col = col * 26 + char.charCodeAt(0) - 64;
                if (col > 40 || Number(match[2]) > rowLimit + 1)
                  throw new Error(
                    "Spreadsheet exceeds 10,000 rows or 40 columns.",
                  );
              }
            };
            xml?.on("doctype", () => {
              throw new Error("DTD declarations are not permitted in XLSX.");
            });
            xml?.on("opentag", (tag) => {
              depth++;
              xmlTags++;
              if (depth > 64 || xmlTags > 2000000)
                throw new Error("Unsafe or oversized XLSX XML.");
              const name = tag.name.split(":").pop();
              if (name === "si") {
                strings++;
                if (strings > 400040)
                  throw new Error("Too many shared strings.");
              }
              if (name === "xf") {
                styles++;
                if (styles > 10000)
                  throw new Error("Too many spreadsheet styles.");
              }
              if (worksheet && name === "row") {
                rows++;
                rowCells = 0;
                if (
                  rows > rowLimit + 1 ||
                  Number(tag.attributes.r || 0) > rowLimit + 1
                )
                  throw new Error(
                    "Spreadsheet exceeds 10,000 rows or 40 columns.",
                  );
              }
              if (worksheet && (name === "c" || name === "dimension"))
                reference(String(tag.attributes.r || tag.attributes.ref || ""));
              if (worksheet && name === "c") {
                cells++;
                rowCells++;
                if (cells > 400040 || rowCells > 40)
                  throw new Error(
                    "Spreadsheet exceeds 10,000 rows or 40 columns.",
                  );
              }
              if (name === "si" || (worksheet && name === "c")) {
                if (textDepth === 0) textSize = 0;
                textDepth++;
              }
            });
            xml?.on("text", (text) => {
              if (textDepth && (textSize += text.length) > 22000)
                throw new Error("Spreadsheet cell is too large.");
            });
            xml?.on("closetag", (tag) => {
              depth--;
              const name = tag.name.split(":").pop();
              if (name === "si" || (worksheet && name === "c")) textDepth--;
            });
            xml?.on("error", () => {
              throw new Error("Invalid XLSX XML.");
            });
            stream.on("data", (chunk: Buffer) => {
              if (failed) {
                stream.destroy();
                return;
              }
              actual += chunk.length;
              actualTotal += chunk.length;
              if (
                actual > entry.uncompressedSize ||
                actualTotal > 32 * 1024 * 1024
              ) {
                stream.destroy();
                fail("Unsafe XLSX expansion.");
                return;
              }
              try {
                xml?.write(decoder.write(chunk));
              } catch (error) {
                stream.destroy();
                fail(
                  error instanceof Error ? error.message : "Invalid XLSX XML.",
                );
              }
            });
            stream.on("error", () => fail("Invalid XLSX entry size."));
            stream.on("end", () => {
              if (failed) return;
              try {
                xml?.write(decoder.end()).close();
                if (actual !== entry.uncompressedSize)
                  throw new Error("Invalid XLSX entry size.");
                zip.readEntry();
              } catch (error) {
                fail(
                  error instanceof Error ? error.message : "Invalid XLSX XML.",
                );
              }
            });
          });
        });
        zip.readEntry();
      },
    );
  });
}
let parsing = 0;
export async function readSpreadsheet(bytes: Buffer, name: string) {
  if (parsing >= 1)
    throw new Error("Spreadsheet parser is busy. Retry shortly.");
  parsing++;
  try {
    return await decodeSpreadsheet(bytes, name);
  } finally {
    parsing--;
  }
}
async function decodeSpreadsheet(bytes: Buffer, name: string) {
  if (bytes.length === 0 || bytes.length > importLimit)
    throw new Error("Spreadsheet size must be between 1 byte and 8 MiB.");
  const format = name.split(".").pop()?.toLowerCase();
  let matrix: string[][] = [];
  const rowErrors = new Map<number, string[]>();
  if (format === "csv") {
    const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    if (text.includes("\0")) throw new Error("CSV must contain UTF-8 text.");
    matrix = parse(text, {
      bom: true,
      skip_empty_lines: true,
      max_record_size: 100000,
      relax_column_count: false,
      to: 10002,
      on_record: (record: string[]) => {
        if (record.length > 40) throw new Error("Use at most 40 columns.");
        return record;
      },
    }) as string[][];
  } else if (format === "xlsx") {
    await validateXlsxArchive(bytes);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(bytes as unknown as ExcelJS.Buffer);
    if (workbook.worksheets.length !== 1)
      throw new Error("Use one worksheet per import file.");
    const sheet = workbook.worksheets[0];
    if (sheet.rowCount > rowLimit + 1 || sheet.columnCount > 40)
      throw new Error("Spreadsheet exceeds 10,000 rows or 40 columns.");
    const cols = sheet.getRow(1).cellCount;
    sheet.eachRow({ includeEmpty: true }, (row, n) => {
      const cells: string[] = [];
      const errors: string[] = [];
      for (let c = 1; c <= Math.max(cols, row.cellCount); c++) {
        const cell = row.getCell(c);
        if (cell.type === ExcelJS.ValueType.Formula)
          errors.push(`Formula in column ${c} is not permitted`);
        if (cell.type === ExcelJS.ValueType.Error)
          errors.push(`Spreadsheet error in column ${c}`);
        if (c > cols) {
          // Keep the mapped header width, but never silently truncate source
          // values/formulas outside it. Empty formatting-only cells are safe.
          if (cell.type !== ExcelJS.ValueType.Null)
            errors.push(`Data in column ${c} has no column header`);
        } else cells.push(cell.type === ExcelJS.ValueType.Formula ? "" : cell.text);
      }
      matrix.push(cells);
      if (errors.length) rowErrors.set(n, errors);
    });
  } else throw new Error("Upload a CSV or XLSX file.");
  if (
    matrix.length < 2 ||
    matrix.length > rowLimit + 1 ||
    matrix[0].length > 40 ||
    matrix[0].length === 0
  )
    throw new Error(
      "Use a header row and 1–10,000 data rows, with at most 40 columns.",
    );
  const headers = matrix[0].map((s) => s.trim());
  if (
    headers.some((s) => !s || s.length > 100) ||
    new Set(headers.map((s) => s.toLowerCase())).size !== headers.length
  )
    throw new Error("Column headers must be non-empty and unique.");
  const rows: SourceRow[] = matrix.slice(1).map((cells, i) => {
    if (
      cells.length !== headers.length ||
      cells.some((s) => s.length > 20000) ||
      Buffer.byteLength(JSON.stringify(cells)) > 1024 * 1024
    )
      throw new Error(
        "Inconsistent columns, a cell exceeding 20,000 characters or a row exceeding 1 MiB.",
      );
    return { cells, errors: rowErrors.get(i + 2) || [] };
  });
  return { format: format as "csv" | "xlsx", headers, rows };
}
export function safeCsvCell(value: unknown) {
  let text = String(value ?? "");
  if (/^[\s]*[=+\-@\t\r]/.test(text)) text = "'" + text;
  return '"' + text.replaceAll('"', '""') + '"';
}
export function csvDocument(rows: unknown[][]) {
  return (
    "\ufeff" +
    rows.map((row) => row.map(safeCsvCell).join(",")).join("\r\n") +
    "\r\n"
  );
}
export async function importTemplate(format: "csv" | "xlsx") {
  if (format === "csv") return Buffer.from(csvDocument([[...importFields]]));
  const book = new ExcelJS.Workbook();
  const sheet = book.addWorksheet("Products");
  sheet.addRow([...importFields]);
  sheet.getRow(1).font = { bold: true };
  sheet.columns.forEach((c) => {
    c.width = 23;
    c.numFmt = "@";
  });
  return Buffer.from(await book.xlsx.writeBuffer());
}
