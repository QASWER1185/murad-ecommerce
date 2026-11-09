import { NextResponse } from "next/server";
import { requestAdminClient } from "@/lib/admin/supabase-server";
import { requireCatalogActor } from "@/lib/catalog/server-access";
import { idSchema } from "@/lib/admin/validation";
import { privateHeaders } from "@/lib/admin/security";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; variant: string }> },
) {
  try {
    const { id, variant } = await params;
    if (
      !idSchema.safeParse(id).success ||
      !["original", "320", "640", "1280"].includes(variant)
    )
      return new NextResponse(null, { status: 404, headers: privateHeaders });
    const client = await requestAdminClient();
    await requireCatalogActor(client, "preview");
    const original = await client
      .from("catalog_media")
      .select("object_name,mime_type")
      .eq("id", id)
      .maybeSingle();
    if (original.error || !original.data)
      return new NextResponse(null, { status: 404, headers: privateHeaders });
    let path = original.data.object_name;
    let type = original.data.mime_type;
    if (variant !== "original") {
      const derived = await client
        .from("catalog_media_variants")
        .select("object_name")
        .eq("media_id", id)
        .eq("variant_key", variant)
        .maybeSingle();
      if (!derived.data)
        return new NextResponse(null, { status: 404, headers: privateHeaders });
      path = derived.data.object_name;
      type = "image/webp";
    }
    const object = await client.storage.from("catalog-private").download(path);
    if (object.error || !object.data)
      return new NextResponse(null, { status: 404, headers: privateHeaders });
    return new NextResponse(new Uint8Array(await object.data.arrayBuffer()), {
      headers: {
        ...privateHeaders,
        "Content-Type": type,
        "Content-Disposition": "inline",
      },
    });
  } catch {
    return new NextResponse(null, { status: 403, headers: privateHeaders });
  }
}
