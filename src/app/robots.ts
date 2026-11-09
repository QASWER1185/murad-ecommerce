import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { storefrontConfig } from "@/lib/storefront/config";
import { businessIndexingEnabled, businessPages } from "@/lib/storefront/business-seo";
import { businessSiteOrigin, emptyCatalogMode } from "@/lib/storefront/business-site";
export default async function robots(): Promise<MetadataRoute.Robots> {
  await connection();
  if (emptyCatalogMode()) return businessIndexingEnabled() ? {
    rules: { userAgent: "*", allow: [...Object.keys(businessPages).map(path => `${path}$`), "/_next/", "/homepage/", "/sanitary/", "/fonts/"],
      disallow: ["/", "/admin", "/api", "/product/", "/media/", "/search", "/*?"], },
    sitemap: `${businessSiteOrigin()}/sitemap.xml`,
  } : { rules: { userAgent: "*", disallow: "/" } };
  const config = storefrontConfig();
  return config?.indexingEnabled
    ? {
        rules: {
          userAgent: "*",
          allow: "/",
          disallow: ["/admin", "/api", "/search", "/*?"],
        },
        sitemap: `${config.origin}/sitemap.xml`,
      }
    : { rules: { userAgent: "*", disallow: "/" } };
}
