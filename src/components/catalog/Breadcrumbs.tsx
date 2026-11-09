import Link from "next/link";
import { storefrontConfig } from "@/lib/storefront/config";
import { jsonLd } from "@/lib/storefront/seo";
import styles from "@/components/sanitary/SanitaryShop.module.css";
export function Breadcrumbs({
  items,
}: {
  items: { name: string; path: string }[];
}) {
  const origin = storefrontConfig()?.origin;
  return (
    <>
      <nav aria-label="Breadcrumb" className={styles.breadcrumb}>
        {[{ name: "Home", path: "/" }, ...items].map((item, index) => (
          <span key={item.path}>
            {index > 0 ? " / " : ""}
            <Link
              prefetch={false}
              href={item.path}
              aria-current={index === items.length ? "page" : undefined}
            >
              {item.name}
            </Link>
          </span>
        ))}
      </nav>
      {origin && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: jsonLd({
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              itemListElement: [{ name: "Home", path: "/" }, ...items].map(
                (item, index) => ({
                  "@type": "ListItem",
                  position: index + 1,
                  name: item.name,
                  item: new URL(item.path, origin).href,
                }),
              ),
            }),
          }}
        />
      )}
    </>
  );
}
