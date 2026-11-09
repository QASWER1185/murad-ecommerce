import { orderConfig } from "@/lib/orders/security";
import "server-only";
import { cache } from "react";
import { connection } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { storefrontConfig } from "./config";
import type { Catalog, Query } from "./types";
export function publicCatalogClient() {
  const config = storefrontConfig();
  if (!config) return null;
  return createClient(config.url, config.key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }),
    },
  });
}
export const getCatalog = cache(
  async (kind: string, slug: string, serialized: string): Promise<Catalog> => {
    await connection();
    const client = publicCatalogClient();
    if (!client)
      return {
        entity: null,
        route: null,
        products: [],
        total: 0,
        page: 1,
        pages: 1,
        brands: [],
        categories: [],
        types: [],
        finishes: [],
        settings: null,
        banners: [],
        generation: "disabled",
        mediaEnabled: false,
      };
    const result = await client.rpc("catalog_storefront", {
      p_kind: kind,
      p_slug: slug,
      p_query: JSON.parse(serialized) as Query,
    });
    if (result.error)
      throw new Error("The published catalog is temporarily unavailable.");
    let ordersEnabled = false;
    try {
      ordersEnabled = !!orderConfig();
    } catch {}
    return {
      ...result.data,
      siteOrigin: storefrontConfig()!.origin,
      mediaEnabled: storefrontConfig()!.mediaEnabled,
      ordersEnabled,
    };
  },
);
