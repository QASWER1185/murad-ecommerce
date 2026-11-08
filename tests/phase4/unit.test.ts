import { test } from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import ExcelJS from "exceljs";
import {
  processImage,
  inspectImage,
  sha256,
  imageLimit,
} from "../../src/lib/media/images";
import {
  readSpreadsheet,
  importTemplate,
  validateXlsxArchive,
  csvDocument,
  safeCsvCell,
} from "../../src/lib/imports/spreadsheets";
import {
  normalizeImportRow,
  normalizeSku,
} from "../../src/lib/imports/normalize";
test("real raster validation rejects spoofed formats, SVG, bad sizes and extension mismatches", async () => {
  const png = await sharp({
    create: { width: 800, height: 500, channels: 3, background: "#123456" },
  })
    .png()
    .toBuffer();
  assert.equal(
    (await inspectImage(png, "image/png", "original.png")).width,
    800,
  );
  await assert.rejects(inspectImage(png, "image/jpeg", "fake.jpg"));
  await assert.rejects(inspectImage(png, "image/png", "fake.svg"));
  await assert.rejects(
    inspectImage(
      Buffer.from("<svg><script>alert(1)</script></svg>"),
      "image/png",
      "fake.png",
    ),
  );
  await assert.rejects(
    inspectImage(Buffer.alloc(imageLimit + 1), "image/png", "large.png"),
  );
  const tiny = await sharp({
    create: { width: 15, height: 15, channels: 3, background: "white" },
  })
    .png()
    .toBuffer();
  await assert.rejects(inspectImage(tiny, "image/png", "tiny.png"));
});
test("responsive WebP derivatives preserve original bytes and bounded dimensions", async () => {
  const bytes = await sharp({
    create: { width: 1600, height: 1000, channels: 3, background: "#abcdef" },
  })
    .jpeg()
    .toBuffer();
  const image = await processImage(
    bytes,
    "image/jpeg",
    "manufacturer-original.jpg",
  );
  assert.equal(image.sha256, sha256(bytes));
  assert.deepEqual(image.bytes, bytes);
  assert.equal(image.variants.length, 3);
  for (const v of image.variants) {
    const meta = await sharp(v.bytes).metadata();
    assert.equal(meta.format, "webp");
    assert(meta.width! <= Number(v.variant_key));
    assert.equal(meta.exif, undefined);
    assert.equal(v.sha256, sha256(v.bytes));
  }
});
test("CSV parsing preserves identifiers, quoting, UTF-8, and rejects malformed/bounded input", async () => {
  const file = await readSpreadsheet(
    Buffer.from('\ufeffsku,name,model\r\n0001,"Local, fixture",001-A\r\n'),
    "local.csv",
  );
  assert.equal(file.rows[0].cells[0], "0001");
  assert.equal(file.rows[0].cells[1], "Local, fixture");
  for (const bytes of [
    Buffer.from("sku,sku\n1,2"),
    Buffer.from("sku,name\n1"),
    Buffer.from("sku,name\n1,\0bad"),
    Buffer.from([0xff, 0xfe]),
  ])
    await assert.rejects(readSpreadsheet(bytes, "bad.csv"));
  await assert.rejects(
    readSpreadsheet(
      Buffer.from(
        "sku,name\n" +
          Array.from({ length: 10001 }, (_, i) => `${i},test`).join("\n"),
      ),
      "too-many.csv",
    ),
  );
});
test("XLSX parsing detects formulas and error cells without evaluation", async () => {
  const book = new ExcelJS.Workbook();
  const sheet = book.addWorksheet("Products");
  sheet.addRow(["sku", "name", "price"]);
  sheet.addRow(["0002", "Local XLSX fixture", { formula: "1+1", result: 2 }]);
  const file = await readSpreadsheet(
    Buffer.from(await book.xlsx.writeBuffer()),
    "catalog.xlsx",
  );
  assert.equal(file.rows[0].cells[0], "0002");
  assert.match(file.rows[0].errors[0], /Formula/);
  assert.equal(file.rows[0].cells[2], "");
  book.addWorksheet("Another");
  await assert.rejects(
    readSpreadsheet(
      Buffer.from(await book.xlsx.writeBuffer()),
      "multiple.xlsx",
    ),
    /one worksheet/,
  );
});
test("XLSX archive limits reject invalid ZIPs, high expansion and excessive row dimensions", async () => {
  await assert.rejects(validateXlsxArchive(Buffer.from("not a zip")));
  const bomb = new ExcelJS.Workbook();
  const sheet = bomb.addWorksheet("Products");
  sheet.addRow(["sku", "name"]);
  sheet.addRow(["1", "x".repeat(2 * 1024 * 1024)]);
  await assert.rejects(
    readSpreadsheet(Buffer.from(await bomb.xlsx.writeBuffer()), "large.xlsx"),
    /Unsafe|oversized/,
  );
  const sparse = new ExcelJS.Workbook();
  const s = sparse.addWorksheet("Products");
  s.addRow(["sku", "name"]);
  s.getRow(10002).values = ["1", "too many"];
  await assert.rejects(
    readSpreadsheet(Buffer.from(await sparse.xlsx.writeBuffer()), "rows.xlsx"),
    /10,000/,
  );
});
test("blank cells preserve values by default; explicit optional clears and SKU normalization are distinct", () => {
  const source = {
    cells: [" ａｂｃ-001 ", "", "", "  Model  A  "],
    errors: [],
  };
  const mapping = { sku: 0, price: 1, description: 2, model: 3 };
  const kept = normalizeImportRow(source, mapping, false);
  assert.deepEqual(kept.payload, { sku: "ABC-001", model: "Model A" });
  const cleared = normalizeImportRow(source, mapping, true);
  assert.equal(cleared.payload.price, null);
  assert.equal(cleared.payload.description, null);
  assert.equal(normalizeSku("  a\t b "), "A B");
  const real = normalizeImportRow(
    { cells: ["ABC", "1,200.50", '{"width":"verified later"}'], errors: [] },
    { sku: 0, price: 1, specifications: 2 },
    false,
  );
  assert.equal(real.payload.price, 1200.5);
  assert.equal(real.errors.length, 0);
  assert(
    normalizeImportRow(
      { cells: ["A", "NaN"], errors: [] },
      { sku: 0, price: 1 },
      false,
    ).errors.length > 0,
  );
});
test("templates contain headers only; exports neutralize spreadsheet formula injection", async () => {
  const csv = (await importTemplate("csv")).toString();
  assert.match(csv, /sku/);
  assert.equal(csv.trim().split(/\r?\n/).length, 1);
  const book = new ExcelJS.Workbook();
  await book.xlsx.load(
    (await importTemplate("xlsx")) as unknown as ExcelJS.Buffer,
  );
  assert.equal(book.worksheets[0].rowCount, 1);
  for (const cell of [
    '=HYPERLINK("https://evil")',
    "+SUM(1,2)",
    "-1+2",
    "@SUM(1,2)",
    "\t=bad",
    "  =bad",
  ])
    assert(safeCsvCell(cell).startsWith("\"'"));
  assert(csvDocument([["normal", '"quoted"']]).includes('""quoted""'));
});
