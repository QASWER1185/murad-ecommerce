import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getCatalog } from "./server";
import { parseQuery, filteredQuery, type SearchValues } from "./query";
import { metadata } from "./seo";
import { CatalogPage, ProductPage } from "@/components/catalog/CatalogPage";
export type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SearchValues>;
};
export async function pageMetadata(kind: string, props: PageProps) {
  const { slug } = await props.params;
  const values = await props.searchParams;
  const catalog = await getCatalog(
    kind,
    slug,
    JSON.stringify(parseQuery(values)),
  );
  return metadata(catalog, filteredQuery(values));
}
async function Content({ kind, props }: { kind: string; props: PageProps }) {
  const { slug } = await props.params;
  const values = await props.searchParams;
  const query = parseQuery(values);
  const catalog = await getCatalog(kind, slug, JSON.stringify(query));
  if (kind !== "search" && !catalog.entity) notFound();
  if (query.page > catalog.pages) notFound();
  return kind === "product" ? (
    <ProductPage catalog={catalog} filtered={filteredQuery(values)} />
  ) : (
    <CatalogPage
      key={JSON.stringify(query)}
      catalog={catalog}
      query={query}
      kind={kind}
    />
  );
}
export function StorePage({ kind, props }: { kind: string; props: PageProps }) {
  return (
    <Suspense
      fallback={
        <p role="status" style={{ padding: 30 }}>
          Loading published catalog…
        </p>
      }
    >
      <Content kind={kind} props={props} />
    </Suspense>
  );
}
