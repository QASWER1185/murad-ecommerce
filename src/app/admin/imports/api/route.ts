import { NextRequest, NextResponse } from "next/server";
import {
  multipartMutation,
  jsonMutation,
  checked,
  requestError,
  AdminRequestError,
} from "@/lib/admin/request";
import { requestAdminClient } from "@/lib/admin/supabase-server";
import { requireCatalogActor } from "@/lib/catalog/server-access";
import { readSpreadsheet, importLimit } from "@/lib/imports/spreadsheets";
import { normalizeImportRow } from "@/lib/imports/normalize";
import { sha256, descriptiveFilename } from "@/lib/media/images";
import { idSchema, versionSchema } from "@/lib/admin/validation";
import { privateHeaders } from "@/lib/admin/security";
import type { SourceRow } from "@/lib/imports/fields";
export const maxDuration = 120;
async function stageSource(
  client: Awaited<ReturnType<typeof requestAdminClient>>,
  job: Record<string, unknown>,
  rows: SourceRow[],
) {
  let start = Number(job.uploaded_rows);
  while (start < rows.length) {
    const batch: SourceRow[] = [];
    let size = 0;
    while (start + batch.length < rows.length && batch.length < 250) {
      const row = rows[start + batch.length];
      const bytes = Buffer.byteLength(JSON.stringify(row));
      if (size + bytes > 1024 * 1024 && batch.length) break;
      batch.push(row);
      size += bytes;
    }
    job = checked(
      await client.rpc("stage_catalog_import_source", {
        p_id: job.id,
        p_start: start + 1,
        p_rows: batch,
      }),
    );
    start = Number(job.uploaded_rows);
  }
  return job;
}
export async function POST(request: NextRequest) {
  try {
    const { client, form } = await multipartMutation(
      request,
      importLimit + 65536,
    );
    const file = form.get("file");
    const id = idSchema.parse(form.get("request_id"));
    if (!(file instanceof File))
      throw new AdminRequestError("Choose a CSV or XLSX file.");
    const bytes = Buffer.from(await file.arrayBuffer());
    let source;
    try {
      source = await readSpreadsheet(bytes, file.name);
    } catch (error) {
      throw new AdminRequestError(
        error instanceof Error ? error.message : "Invalid spreadsheet.",
      );
    }
    const path = `imports/${id}/source.${source.format}`;
    const upload = await client.storage
      .from("catalog-imports")
      .upload(path, bytes, {
        contentType:
          source.format === "csv"
            ? "text/csv"
            : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        cacheControl: "0",
        upsert: false,
      });
    if (upload.error) {
      const old = await client.storage.from("catalog-imports").download(path);
      if (
        old.error ||
        !old.data ||
        sha256(Buffer.from(await old.data.arrayBuffer())) !== sha256(bytes)
      )
        throw new AdminRequestError(
          "Upload ID conflict. Select the original file or start a new import.",
          409,
        );
    }
    let job = checked(
      await client.rpc("begin_catalog_import", {
        p_id: id,
        p_name: descriptiveFilename(file.name),
        p_sha: sha256(bytes),
        p_format: source.format,
        p_headers: source.headers,
        p_total: source.rows.length,
      }),
    );
    if (job.status === "pending")
      job = await stageSource(client, job, source.rows);
    return NextResponse.json(
      { job, location: `/admin/imports/${id}` },
      { headers: privateHeaders },
    );
  } catch (error) {
    return requestError(error);
  }
}
export async function GET(request: NextRequest) {
  try {
    const client = await requestAdminClient();
    await requireCatalogActor(client, "preview");
    const id = idSchema.parse(request.nextUrl.searchParams.get("id"));
    const data = checked(
      await client.rpc("catalog_import_workspace", { p_id: id }),
    );
    if (!data.job) throw new AdminRequestError("Import not found.", 404);
    return NextResponse.json(data, { headers: privateHeaders });
  } catch (error) {
    return requestError(error);
  }
}
export async function PATCH(request: NextRequest) {
  try {
    const { client, input } = await jsonMutation(request);
    const id = idSchema.parse(input.id);
    let job;
    if (input.operation === "configure")
      job = checked(
        await client.rpc("configure_catalog_import", {
          p_id: id,
          p_version: versionSchema.parse(input.version),
          p_mapping: input.mapping,
          p_mode: input.mode,
          p_clear_blanks: input.clear_blanks === true,
        }),
      );
    else if (input.operation === "prepare") {
      const batch = checked(
        await client.rpc("catalog_import_source_batch", { p_id: id }),
      );
      if (!batch.job) throw new AdminRequestError("Import not found.", 404);
      if (batch.job.status !== "validating") job = batch.job;
      else {
        const rows = batch.rows.map(
          (row: { cells: string[]; errors: string[] }) => {
            const normalized = normalizeImportRow(
              row,
              batch.job.column_mapping,
              batch.job.clear_blanks,
            );
            return { payload: normalized.payload, errors: normalized.errors };
          },
        );
        job = checked(
          await client.rpc("stage_catalog_import_preview", {
            p_id: id,
            p_version: batch.job.version,
            p_start: batch.job.prepared_rows + 1,
            p_rows: rows,
          }),
        );
      }
    } else if (input.operation === "start")
      job = checked(
        await client.rpc("start_catalog_import", {
          p_id: id,
          p_version: versionSchema.parse(input.version),
          p_confirm: input.confirm === true,
          p_confirm_prices: input.confirm_prices === true,
          p_skip_errors: input.skip_errors === true,
        }),
      );
    else if (input.operation === "process")
      job = checked(
        await client.rpc("process_catalog_import_batch", {
          p_id: id,
          p_limit: 50,
        }),
      );
    else if (input.operation === "retry")
      job = checked(
        await client.rpc("retry_catalog_import", {
          p_id: id,
          p_version: versionSchema.parse(input.version),
        }),
      );
    else if (input.operation === "resume-source") {
      const workspace = checked(
        await client.rpc("catalog_import_workspace", { p_id: id }),
      );
      job = workspace.job;
      if (!job || job.status !== "pending")
        throw new AdminRequestError("No incomplete source upload exists.");
      const original = await client.storage
        .from("catalog-imports")
        .download(job.source_object_name);
      if (original.error || !original.data)
        throw new AdminRequestError(
          "Original spreadsheet is unavailable. Re-upload the same file with this import ID.",
        );
      const bytes = Buffer.from(await original.data.arrayBuffer());
      if (sha256(bytes) !== job.file_sha256)
        throw new AdminRequestError("Original file checksum mismatch.");
      const source = await readSpreadsheet(bytes, `source.${job.format}`);
      job = await stageSource(client, job, source.rows);
    } else throw new AdminRequestError("Unknown import operation.");
    return NextResponse.json({ job }, { headers: privateHeaders });
  } catch (error) {
    return requestError(error);
  }
}
