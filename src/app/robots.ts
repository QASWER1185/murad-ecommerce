import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { storefrontConfig } from "@/lib/storefront/config";
export default async function robots(): Promise<MetadataRoute.Robots> {
  await connection();
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
