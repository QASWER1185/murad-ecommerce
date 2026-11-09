import type { Metadata } from "next";
import { storefrontConfig } from "./config";
import { catalogMetadata } from "@/lib/seo/catalog-policy";
import { productStructuredData } from "../seo/structured";
import type { Catalog, Product } from "./types";
import { businessSiteOrigin } from "./business-site";
export function context(searchOrFilter = false) {
  const config = storefrontConfig();
  return {
    production: config?.production || false,
    indexingEnabled: config?.indexingEnabled || false,
    searchOrFilter,
  };
}
export function metadata(catalog: Catalog, filtered = false): Metadata {
  if (catalog.emptyCatalog && catalog.route)
    return catalogMetadata(catalog.route, businessSiteOrigin());
  const config = storefrontConfig();
  if (!catalog.route || !config)
    return {
      title: "Page not found | M Murad Sons",
      robots: { index: false, follow: true },
    };
  return catalogMetadata(catalog.route, config.origin, context(filtered));
}
export function jsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
export function productSchema(product: Product, catalog: Catalog, filtered = false) {
  const config = storefrontConfig();
  if (!config || !catalog.route) return null;
  return productStructuredData(product, catalog.route, context(filtered), config.origin, catalog.mediaEnabled);
}

export function businessSchema(catalog: Catalog) {
  const config = storefrontConfig(),
    settings = catalog.settings;
  if ((!config && !catalog.emptyCatalog) || !settings) return null;
  return {
    "@context": "https://schema.org",
    "@type": "Store",
    name: settings.business_name,
    url: catalog.emptyCatalog ? businessSiteOrigin() : config!.origin,
    telephone: settings.main_whatsapp,
    address: {
      "@type": "PostalAddress",
      streetAddress: settings.street_address,
      addressLocality: settings.city,
      addressCountry: settings.country_code,
    },
    contactPoint: [settings.main_whatsapp, settings.secondary_whatsapp].map(
      (telephone) => ({
        "@type": "ContactPoint",
        telephone,
        contactType: "customer service",
      }),
    ),
  };
}
