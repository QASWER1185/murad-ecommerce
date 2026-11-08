import { NextResponse } from "next/server";
import { connection } from "next/server";
import { publicCatalogClient } from "@/lib/storefront/server";
import { publicHeaders } from "@/lib/storefront/config";
export async function GET() {
  await connection();
  const client = publicCatalogClient();
  const result = client ? await client.rpc("catalog_public_generation") : null;
  return NextResponse.json(
    { generation: result?.data || "disabled" },
    { status: result?.error ? 503 : 200, headers: publicHeaders },
  );
}
