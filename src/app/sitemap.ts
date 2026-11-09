import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { publicCatalogClient } from "@/lib/storefront/server";
import { storefrontConfig } from "@/lib/storefront/config";
import { catalogSitemap } from "@/lib/seo/catalog-policy";
import type { PublicRoute } from "@/lib/catalog/publication";
import { context } from "@/lib/storefront/seo";
import { businessIndexingEnabled, businessPages } from "@/lib/storefront/business-seo";
import { businessSiteOrigin, emptyCatalogMode } from "@/lib/storefront/business-site";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connection();
  if (emptyCatalogMode()) return businessIndexingEnabled()
    ? Object.keys(businessPages).map(path => ({ url: new URL(path, businessSiteOrigin()).href })) : [];
  const config = storefrontConfig();
  if (!config?.indexingEnabled) return [];
  const client = publicCatalogClient()!;
  const result: PublicRoute[] = [];
  for (let page = 0; page < 50; page++) {
    const rows = await client
      .from("catalog_routes_public")
      .select("*")
      .eq("is_indexable", true)
      .order("kind")
      .order("id")
      .range(page * 1000, page * 1000 + 999);
    if (rows.error) throw new Error("Sitemap unavailable");
    result.push(...rows.data);
    if (rows.data.length < 1000) break;
  }
  return catalogSitemap(result, config.origin, context());
}
