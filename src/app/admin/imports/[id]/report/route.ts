import { NextResponse } from "next/server";
import { requestAdminClient } from "@/lib/admin/supabase-server";
import { requireCatalogActor } from "@/lib/catalog/server-access";
import { idSchema } from "@/lib/admin/validation";
import { csvDocument } from "@/lib/imports/spreadsheets";
import { privateHeaders } from "@/lib/admin/security";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const id = idSchema.parse((await params).id);
    const client = await requestAdminClient();
    await requireCatalogActor(client, "preview");
    const rows: unknown[][] = [["Row", "SKU", "Action", "Status", "Errors"]];
    for (let offset = 0; offset < 10000; offset += 500) {
      const result = await client
        .from("import_rows")
        .select("row_number,sku,intended_action,processing_status,errors")
        .eq("job_id", id)
        .order("row_number")
        .range(offset, offset + 499);
      if (result.error) throw result.error;
      for (const row of result.data)
        rows.push([
          row.row_number,
          row.sku,
          row.intended_action,
          row.processing_status,
          JSON.stringify(row.errors),
        ]);
      if (result.data.length < 500) break;
    }
    return new NextResponse(csvDocument(rows), {
      headers: {
        ...privateHeaders,
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="import-${id}-report.csv"`,
      },
    });
  } catch {
    return new NextResponse(null, { status: 403, headers: privateHeaders });
  }
}
