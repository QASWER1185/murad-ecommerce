import { canEmitOffer, isIndexable, type IndexContext, type PublicRoute } from "../catalog/publication";
import type { Product } from "../storefront/types";
import { canonicalUrl } from "./catalog-policy";
// Inputs must be the anonymous approved public projection, never authoring rows.
export function productStructuredData(product: Product, route: PublicRoute, context: IndexContext, origin: string, mediaEnabled: boolean) {
  if (!isIndexable(route,context) || !product.is_indexable || route.kind !== "product" || product.id !== route.id || product.slug !== route.slug || !product.description?.trim()) return null;
  const url = canonicalUrl(route,origin);
  return {
    "@context": "https://schema.org", "@type": "Product", name: product.name,
    description: product.description, url,
    ...(product.sku ? { sku: product.sku } : {}),
    ...(product.model ? { model: product.model } : {}),
    ...(product.brand ? { brand: { "@type": "Brand", name: product.brand.name } } : {}),
    ...(mediaEnabled && product.gallery.length ? { image: product.gallery.map(i=>new URL(`/media/catalog/${i.media_id}/1280`,origin).href) } : {}),
    ...(canEmitOffer(product,route,context) ? { offers: {
      "@type": "Offer", price: product.price, priceCurrency: product.currency, url,
      ...(product.availability !== "unknown" ? { availability: `https://schema.org/${product.availability === "in_stock" ? "InStock" : "OutOfStock"}` } : {}),
    }} : {}),
  };
}
// Readiness report, not a public feed or a claim of Merchant Center approval.
// Shipping/returns/tax and destination account policies require owner verification.
export function merchantReadiness(product: Product, route: PublicRoute, context: IndexContext, mediaEnabled: boolean) {
  const missing: string[] = [];
  if (!isIndexable(route,context) || !product.is_indexable) missing.push("indexing_approval");
  if (!canEmitOffer(product,route,context)) missing.push("verified_online_price");
  if (product.availability === "unknown") missing.push("verified_availability");
  if (!mediaEnabled || !product.gallery.length || product.gallery.some(i=>!i.alt_text?.trim())) missing.push("approved_image_and_alt_text");
  if (!product.sku || !product.description?.trim()) missing.push("unique_id_and_description");
  if (!product.brand || !product.model) missing.push("manufacturer_identifier_review");
  missing.push("owner_shipping_returns_tax_and_merchant_policy_review");
  return { ready: false as const, missing };
}
