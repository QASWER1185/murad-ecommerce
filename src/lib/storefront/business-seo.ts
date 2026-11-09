import type { Metadata } from "next";
import { businessSiteOrigin, emptyCatalogMode } from "./business-site";

// Only these complete business pages have been approved for search indexing.
// Empty collection directories and all product/private routes remain excluded.
export const businessPages = {
  "/": {
    title: "M Murad Sons | Building Material Store in Lahore",
    description: "Contact M Murad Sons at Adda Plot, Al Kabir Town, Raiwind Road, Lahore for sanitary, electrical, building materials and imported kitchen and bath enquiries.",
  },
  "/about": {
    title: "About M Murad Sons | Building Material Store, Lahore",
    description: "Meet M Murad Sons Building Material Store at Adda Plot, Al Kabir Town, Raiwind Road, Lahore. Contact our store on WhatsApp about your requirements.",
  },
  "/contact": {
    title: "Contact M Murad Sons | WhatsApp & Store Location, Lahore",
    description: "Contact M Murad Sons on 0321-7165000 or 0308-6235608. Find our store at Adda Plot, Al Kabir Town, Raiwind Road, Lahore, Pakistan.",
  },
} as const;

export function businessIndexingEnabled(env: Record<string, string | undefined> = process.env) {
  return emptyCatalogMode(env) && env.BUSINESS_INDEXING_ENABLED === "true" && env.VERCEL_ENV === "production";
}

export function businessPageIndexable(path: string, hasParameters = false, env: Record<string, string | undefined> = process.env) {
  return businessIndexingEnabled(env) && !hasParameters && Object.hasOwn(businessPages, path);
}

export function businessMetadata(path: keyof typeof businessPages, hasParameters = false): Metadata {
  const page = businessPages[path];
  const url = new URL(path, businessSiteOrigin()).href;
  return { ...page, alternates: { canonical: url },
    robots: { index: businessPageIndexable(path, hasParameters), follow: true },
    openGraph: { ...page, url, type: "website", locale: "en_PK", siteName: "M Murad Sons" },
  };
}
