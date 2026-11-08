import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { connection } from "next/server";
import { readAdminConfig } from "@/lib/admin/config";
import { idSchema } from "@/lib/admin/validation";
const headers = {
  "Cache-Control": "no-store, max-age=0",
  Pragma: "no-cache",
  Expires: "0",
  "X-Content-Type-Options": "nosniff",
  "X-Robots-Tag": "noindex",
};
// No signed URLs, originals, service keys or shared image-optimizer caching.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; variant: string }> },
) {
  await connection();
  const config = readAdminConfig();
  if (!config) return new NextResponse(null, { status: 404, headers });
  const { id, variant } = await params;
  if (
    !idSchema.safeParse(id).success ||
    !["320", "640", "1280"].includes(variant)
  )
    return new NextResponse(null, { status: 404, headers });
  const client = createClient(config.url, config.key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }),
    },
  });
  const eligible = await client.rpc("catalog_public_media", {
    p_id: id,
    p_variant: variant,
  });
  if (eligible.error || !eligible.data)
    return new NextResponse(null, { status: 404, headers });
  const object = await client.storage
    .from("catalog-private")
    .download(eligible.data.object_name);
  if (object.error || !object.data)
    return new NextResponse(null, { status: 404, headers });
  const recheck = await client.rpc("catalog_public_media", {
    p_id: id,
    p_variant: variant,
  });
  if (
    recheck.error ||
    !recheck.data ||
    recheck.data.sha256 !== eligible.data.sha256
  )
    return new NextResponse(null, { status: 404, headers });
  return new NextResponse(new Uint8Array(await object.data.arrayBuffer()), {
    headers: {
      ...headers,
      "Content-Type": "image/webp",
      "Content-Disposition": "inline",
    },
  });
}
