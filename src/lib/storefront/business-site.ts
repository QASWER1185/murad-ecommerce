import { brands, categories } from "@/components/home/reference-catalog";
import { MAIN_WHATSAPP, SECONDARY_WHATSAPP } from "./whatsapp";
import type { Catalog, Taxonomy } from "./types";

// Approved business/navigation information only. This mode never supplies a
// product record and never reads or changes the legacy production catalog.
export const emptyCatalogMode = (env: Record<string, string | undefined> = process.env) =>
  env.BUSINESS_SITE_MODE === "empty-catalog";

export const primaryCategorySlugs = ["sanitary", "electric", "building-material"] as const;
export const importedCollection = { slug: "imported-products", name: "Imported Kitchen & Bath" };

export function businessSiteOrigin(env: Record<string, string | undefined> = process.env) {
  const url = new URL(env.BUSINESS_SITE_ORIGIN || "https://murad-ecommerce.vercel.app");
  const loopback = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  if ((url.protocol !== "https:" && !(loopback && url.protocol === "http:")) ||
    url.username || url.password || url.pathname !== "/" || url.search || url.hash)
    throw Error("A trusted business site origin is required");
  return url.origin;
}

function taxonomy(kind: "category" | "brand", slug: string, name: string): Taxonomy {
  const description = slug === "building-material"
    ? "Ask M Murad Sons in Lahore for today's rates for cement, sand, gravel (bajri) and bricks on WhatsApp."
    : `Contact M Murad Sons, Adda Plot, Al Kabir Town, Raiwind Road, Lahore, for ${name} information and WhatsApp enquiries.`;
  return { id: `business-${kind}-${slug}`, slug, name, description, parent_id: null,
    is_indexable: false, seo_title: `${name} | M Murad Sons Lahore`,
    seo_description: description, canonical_path: `/${kind}/${slug}`, updated_at: "" };
}

const collectionRecords = [
  ...categories.map(c => taxonomy("category", c.id, c.id === "building-material" ? "Building Materials" : c.label)),
  taxonomy("category", importedCollection.slug, importedCollection.name),
];
const brandRecords = [...new Map(brands.map(b => [b.slug, taxonomy("brand", b.slug, b.id)])).values()];

export function approvedBusinessAsset(kind: string, slug: string): string | undefined {
  if (kind === "brand") {
    const brand = brands.find(b => b.slug === slug);
    return brand ? `/homepage/${brand.asset}.png` : undefined;
  }
  if (slug === "building-material") return "/homepage/banner-building.png";
  const category = categories.find(c => c.id === (slug === importedCollection.slug ? "kitchen" : slug));
  return category ? `/homepage/${category.asset}.png` : undefined;
}

export function businessCatalog(kind: string, slug: string): Catalog {
  const all = kind === "brand" ? brandRecords : collectionRecords;
  const entity = ["category", "brand"].includes(kind) ? all.find(item => item.slug === slug) || null : null;
  const visibleCategories = [...primaryCategorySlugs, importedCollection.slug]
    .map(id => collectionRecords.find(c => c.slug === id)!);
  return {
    emptyCatalog: true, siteOrigin: businessSiteOrigin(), entity,
    route: entity ? { ...entity, kind: kind as "category" | "brand", canonical_path: entity.canonical_path! } : null,
    products: [], total: 0, page: 1, pages: 1, brands: brandRecords,
    categories: visibleCategories, types: [], finishes: [], banners: [],
    generation: "disabled", mediaEnabled: false, shoppingEnabled: false, ordersEnabled: false,
    settings: { business_name: "M Murad Sons Building Material Store", street_address: "Adda Plot, Al Kabir Town, Raiwind Road", city: "Lahore", country_code: "PK", main_whatsapp: MAIN_WHATSAPP, secondary_whatsapp: SECONDARY_WHATSAPP },
  };
}
