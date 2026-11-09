import { NextRequest, NextResponse } from "next/server";
import { publicCatalogClient } from "@/lib/storefront/server";
import { publicHeaders, storefrontConfig } from "@/lib/storefront/config";
export async function GET(request: NextRequest) {
  if (!storefrontConfig()?.shoppingEnabled)
    return NextResponse.json({ error: "Shopping is disabled. Please enquire on WhatsApp." }, { status: 404, headers: publicHeaders });
  const ids = (request.nextUrl.searchParams.get("ids") || "")
    .split(",")
    .filter(Boolean);
  if (
    ids.length > 100 ||
    ids.some((id) => !/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(id))
  )
    return NextResponse.json(
      { error: "Invalid selection" },
      { status: 400, headers: publicHeaders },
    );
  const client = publicCatalogClient();
  if (!client) return NextResponse.json([], { headers: publicHeaders });
  const result = await client.rpc("catalog_cart", { p_ids: ids });
  return NextResponse.json(
    result.error ? { error: "Selection unavailable" } : result.data,
    { status: result.error ? 503 : 200, headers: publicHeaders },
  );
}
