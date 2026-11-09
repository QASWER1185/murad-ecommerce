import Link from "next/link";
import { Suspense } from "react";
import { getCatalog } from "@/lib/storefront/server";
import { Header, Footer } from "./Chrome";
import { Breadcrumbs } from "./Breadcrumbs";
import styles from "@/components/sanitary/SanitaryShop.module.css";
import "./catalog.css";
import { approvedBusinessAsset } from "@/lib/storefront/business-site";
async function Content({ kind }: { kind: "category" | "brand" }) {
  const catalog = await getCatalog("search", "", "{}");
  const records = kind === "brand" ? catalog.brands : catalog.categories;
  const title = kind === "brand" ? "Shop by brand" : "Shop by category";
  return (
    <div className={styles.shop}>
      <Header catalog={catalog} />
      <main className={styles.main}>
        <Breadcrumbs
          items={[
            { name: title, path: kind === "brand" ? "/brands" : "/categories" },
          ]}
        />
        <h1 style={{ fontSize: 28, fontWeight: 700 }}>{title}</h1>
        <div className="catalog-directory">
          {records.map((item) => (
            <Link prefetch={false} key={item.id} href={`/${kind}/${item.slug}`}>
              {catalog.emptyCatalog && kind === "brand" && <span className="business-brand-logo" role="img" aria-label={`${item.name} logo`} style={{ backgroundImage: `url('${approvedBusinessAsset(kind, item.slug)}')` }} />}
              <h2>{item.name}</h2>
              <p>{item.description}</p>
            </Link>
          ))}
        </div>
        {!records.length && (
          <p>Published collections will appear here when available.</p>
        )}
      </main>
      <Footer catalog={catalog} />
    </div>
  );
}
export function Directory({ kind }: { kind: "category" | "brand" }) {
  return (
    <Suspense fallback={<p>Loading collections…</p>}>
      <Content kind={kind} />
    </Suspense>
  );
}
