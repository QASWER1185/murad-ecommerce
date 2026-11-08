import { Suspense } from "react";
import { businessSchema, jsonLd } from "@/lib/storefront/seo";
import ReferenceStorefront from "@/components/home/ReferenceStorefront";
import { getCatalog } from "@/lib/storefront/server";
import { storefrontConfig } from "@/lib/storefront/config";
export function generateMetadata() {
  const config = storefrontConfig();
  return {
    title: "M Murad Sons | Building Material Store in Lahore",
    description:
      "Explore sanitary, kitchen, electrical and building material collections at M Murad Sons, Adda Plot, Al Kabir Town, Raiwind Road, Lahore.",
    robots: { index: false, follow: true },
    ...(config
      ? {
          alternates: { canonical: config.origin },
          openGraph: {
            url: config.origin,
            title: "M Murad Sons Building Material Store",
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
