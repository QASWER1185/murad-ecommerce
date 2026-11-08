import { NextRequest, NextResponse } from "next/server";
import { requestAdminClient } from "@/lib/admin/supabase-server";
import { requireCatalogActor } from "@/lib/catalog/server-access";
import { importTemplate } from "@/lib/imports/spreadsheets";
import { privateHeaders } from "@/lib/admin/security";
export async function GET(request: NextRequest) {
  try {
    const client = await requestAdminClient();
    await requireCatalogActor(client, "preview");
    const format =
      request.nextUrl.searchParams.get("format") === "xlsx" ? "xlsx" : "csv";
    const bytes = await importTemplate(format);
    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        ...privateHeaders,
        "Content-Type":
          format === "csv"
            ? "text/csv; charset=utf-8"
            : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="product-import-template.${format}"`,
      },
    });
  } catch {
    return new NextResponse(null, { status: 403, headers: privateHeaders });
  }
}
