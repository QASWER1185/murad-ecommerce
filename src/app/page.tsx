import { Suspense } from "react";
import { businessSchema, jsonLd } from "@/lib/storefront/seo";
import ReferenceStorefront from "@/components/home/ReferenceStorefront";
import { getCatalog } from "@/lib/storefront/server";
import { storefrontConfig } from "@/lib/storefront/config";
import { emptyCatalogMode, businessSiteOrigin } from "@/lib/storefront/business-site";
export function generateMetadata() {
  const config = storefrontConfig();
  const origin = emptyCatalogMode() ? businessSiteOrigin() : config?.origin;
  return {
    title: "M Murad Sons | Building Material Store in Lahore",
    description:
      "Explore sanitary, kitchen, electrical and building material collections at M Murad Sons, Adda Plot, Al Kabir Town, Raiwind Road, Lahore.",
    robots: { index: false, follow: true },
    ...(origin
      ? {
          alternates: { canonical: origin },
          openGraph: {
            url: origin,
            title: "M Murad Sons Building Material Store",
            description: "Sanitary, kitchen and building materials at Adda Plot, Al Kabir Town, Raiwind Road, Lahore.",
            type: "website",
            locale: "en_PK",
          },
        }
      : {}),
  };
}
async function Content() {
  const catalog = await getCatalog("home", "", "{}");
  const schema = businessSchema(catalog);
  return (
    <>
      <link rel="preload" as="image" type="image/webp" href="/homepage/hero-mobile.webp" media="(max-width: 900px)" fetchPriority="high" />
      <link rel="preload" as="image" type="image/webp" href="/homepage/hero.webp" media="(min-width: 901px)" fetchPriority="high" />
      <ReferenceStorefront catalog={catalog} />
      {schema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd(schema) }}
        />
      )}
    </>
  );
}
export default function HomePage() {
  return (
    <Suspense
      fallback={
        <p role="status" style={{ padding: 30 }}>
          Loading M Murad Sons…
        </p>
      }
    >
      <Content />
    </Suspense>
  );
}
