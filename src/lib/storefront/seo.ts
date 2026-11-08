import type { Metadata } from "next";
import { storefrontConfig } from "./config";
import { catalogMetadata } from "@/lib/seo/catalog-policy";
import { canEmitOffer } from "@/lib/catalog/publication";
import type { Catalog, Product } from "./types";
export function context(searchOrFilter = false) {
  const config = storefrontConfig();
  return {
    production: config?.production || false,
    indexingEnabled: config?.indexingEnabled || false,
    searchOrFilter,
  };
}
export function metadata(catalog: Catalog, filtered = false): Metadata {
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
export function productSchema(product: Product, catalog: Catalog) {
  const config = storefrontConfig();
  if (
    !config ||
    !catalog.route ||
    !canEmitOffer(product, catalog.route, context())
  )
    return null;
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    sku: product.sku,
    ...(product.model ? { model: product.model } : {}),
    ...(product.brand
      ? { brand: { "@type": "Brand", name: product.brand.name } }
      : {}),
    ...(catalog.mediaEnabled && product.gallery.length
      ? {
          image: product.gallery.map(
            (i) =>
              new URL(`/media/catalog/${i.media_id}/1280`, config.origin).href,
          ),
        }
      : {}),
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: product.currency,
      url: new URL(`/product/${product.slug}`, config.origin).href,
      ...(product.availability !== "unknown"
        ? {
            availability: `https://schema.org/${product.availability === "in_stock" ? "InStock" : "OutOfStock"}`,
          }
        : {}),
    },
  };
}

export function businessSchema(catalog: Catalog) {
  const config = storefrontConfig(),
    settings = catalog.settings;
  if (!config || !settings) return null;
  return {
    "@context": "https://schema.org",
    "@type": "Store",
    name: settings.business_name,
    url: config.origin,
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
