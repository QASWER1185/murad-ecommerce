import Link from "next/link";
import { Plus, Search, SlidersHorizontal } from "lucide-react";
import {
  adminPageSession,
  taxonomies,
  type AdminProduct,
} from "@/lib/admin/data";
import { idSchema } from "@/lib/admin/validation";
import {
  PageHeading,
  ProductIdentity,
  Status,
  EmptyState,
} from "@/components/admin/shared";
export default async function Products({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const { client, actor } = await adminPageSession();
  const options = await taxonomies(client);
  const q = (params.q || "")
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .trim()
    .slice(0, 80);
  const status = ["draft", "ready_for_review", "published"].includes(
    params.status || "",
  )
    ? params.status!
    : "";
  const brand = idSchema.safeParse(params.brand).success ? params.brand! : "";
  const category = idSchema.safeParse(params.category).success
    ? params.category!
    : "";
  const page = Math.min(
    100000,
    Math.max(1, Number.parseInt(params.page || "1", 10) || 1),
  );
  let query = client
    .from("products")
    .select(
      "id,name,sku,model,publication_status,price,price_verified_at,stock_status,stock_verified_at,brand_id,updated_at",
      { count: "exact" },
    )
    .is("archived_at", null)
    .order("updated_at", { ascending: false })
    .order("id")
    .range((page - 1) * 20, page * 20 - 1);
  if (q)
    query = query.or(`name.ilike.*${q}*,sku.ilike.*${q}*,model.ilike.*${q}*`);
  if (status) query = query.eq("publication_status", status);
  if (brand) query = query.eq("brand_id", brand);
  if (category) query = query.eq("category_id", category);
  const result = await query;
  if (result.error) throw new Error("Product list unavailable");
  const pagination = (next: number) => {
    const p = new URLSearchParams({
      q,
      status,
      brand,
      category,
      page: String(next),
    });
    return `/admin/products?${p}`;
  };
  return (
    <>
      <PageHeading
        title="Products"
        description="One central catalog. Genuine information, carefully published."
      >
        {actor.role === "admin" ? (
          <Link className="admin-button" href="/admin/products/new">
            <Plus size={17} />
            Add product
          </Link>
        ) : null}
      </PageHeading>
      <section className="admin-card">
        <form className="admin-filters" action="/admin/products">
          <label className="admin-search">
            <Search size={18} />
            <span className="admin-sr-only">Search products</span>
            <input
              name="q"
              placeholder="Search name, SKU or model…"
              defaultValue={q}
              maxLength={80}
            />
          </label>
          <label>
            <span className="admin-sr-only">Publication status</span>
            <select name="status" defaultValue={status}>
              <option value="">All statuses</option>
              <option value="draft">Draft</option>
              <option value="ready_for_review">Ready for review</option>
              <option value="published">Published</option>
            </select>
          </label>
          <label>
            <span className="admin-sr-only">Brand</span>
            <select name="brand" defaultValue={brand}>
              <option value="">All brands</option>
              {options.brands.map((b) => (
                <option value={b.id} key={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="admin-sr-only">Category</span>
            <select name="category" defaultValue={category}>
              <option value="">All categories</option>
              {options.categories.map((c) => (
                <option value={c.id} key={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <button className="admin-button admin-button-secondary">
            <SlidersHorizontal size={16} />
            Apply
          </button>
          {q || status || brand || category ? (
            <Link href="/admin/products" className="admin-text-link">
              Clear
            </Link>
          ) : null}
        </form>
        <div className="admin-table-caption">
          <span>
            <strong>{result.count ?? 0}</strong> products
          </span>
          <span>Most recently updated first</span>
        </div>
        {result.data.length ? (
          <div className="admin-table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Brand</th>
                  <th>Status</th>
                  <th>Price</th>
                  <th>Stock verification</th>
                  <th>
                    <span className="admin-sr-only">Open</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {result.data.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <Link href={`/admin/products/${row.id}`}>
                        <ProductIdentity product={row as AdminProduct} />
                      </Link>
                    </td>
                    <td>
                      {options.brands.find((b) => b.id === row.brand_id)
                        ?.name || "Unassigned"}
                    </td>
                    <td>
                      <Status value={row.publication_status} />
                    </td>
                    <td>
                      {row.price === null
                        ? "Not added"
                        : `PKR ${Number(row.price).toLocaleString("en-PK")}`}
                      <small>
                        {row.price_verified_at ? "Verified" : "Unverified"}
                      </small>
                    </td>
                    <td>
                      {row.stock_verified_at
                        ? row.stock_status.replaceAll("_", " ")
                        : "Not verified"}
                    </td>
                    <td>
                      <Link
                        className="admin-text-link"
                        href={`/admin/products/${row.id}`}
                      >
                        {actor.role === "admin" ? "Manage" : "View"} →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title={
              q || status || brand || category
                ? "No matching products"
                : "No products yet"
            }
            description={
              q || status || brand || category
                ? "Adjust your search or filters."
                : "Start with a Draft. Images, prices and specifications can follow later."
            }
            create={
              actor.role === "admin" && !q && !status && !brand && !category
            }
          />
        )}
        <div className="admin-pagination">
          <span>
            Page {page} of {Math.max(1, Math.ceil((result.count ?? 0) / 20))}
          </span>
          <div>
            {page > 1 ? (
              <Link
                href={pagination(page - 1)}
                className="admin-button admin-button-secondary"
              >
                Previous
              </Link>
            ) : null}
            {page * 20 < (result.count ?? 0) ? (
              <Link
                href={pagination(page + 1)}
                className="admin-button admin-button-secondary"
              >
                Next
              </Link>
            ) : null}
          </div>
        </div>
      </section>
    </>
  );
}
