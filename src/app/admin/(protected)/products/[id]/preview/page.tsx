import Link from "next/link";
import { adminProduct } from "@/lib/admin/data";
import { Status, PageHeading } from "@/components/admin/shared";
import { Image as ImageIcon } from "lucide-react";
export default async function Preview({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { product, categories, brands } = await adminProduct(id);
  const quotation =
    product.sales_mode === "quotation" ||
    categories.find((c) => c.id === product.category_id)?.default_sales_mode ===
      "quotation";
  return (
    <>
      <Link href={`/admin/products/${id}`} className="admin-back">
        ← Back to product management
      </Link>
      <PageHeading
        eyebrow="AUTHENTICATED PREVIEW"
        title="Private product preview"
        description="For authorized review only. This page is private, uncached and excluded from indexing."
      />
      <section className="admin-card admin-preview">
        <div className="admin-preview-media">
          <ImageIcon size={54} />
          <p>Product imagery not displayed</p>
          <small>Private media delivery is prepared for Phase 4.</small>
        </div>
        <div>
          <Status value={product.publication_status} />
          <p className="admin-eyebrow">
            {brands.find((b) => b.id === product.brand_id)?.name ||
              "BRAND NOT ASSIGNED"}
          </p>
          <h2>{product.name}</h2>
          <p className="admin-help">
            {product.sku ? `SKU: ${product.sku}` : "SKU not added"}
            {product.model ? ` · Model: ${product.model}` : ""}
          </p>
          <p className="admin-preview-price">
            {quotation
              ? "WhatsApp quotation only"
              : product.price_verified_at && product.price !== null
                ? `PKR ${Number(product.price).toLocaleString("en-PK")}`
                : "Price not verified"}
          </p>
          <p>
            {product.stock_verified_at
              ? `Verified stock: ${product.stock_status.replaceAll("_", " ")}`
              : "Availability not verified"}
          </p>
          <p className="admin-preview-description">
            {product.description || "Description will be added later."}
          </p>
          <dl className="admin-specs">
            <div>
              <dt>Category</dt>
              <dd>
                {categories.find((c) => c.id === product.category_id)?.name ||
                  "Unassigned"}
              </dd>
            </div>
            {Object.entries(product.specifications).map(([key, value]) => (
              <div key={key}>
                <dt>{key}</dt>
                <dd>{String(value)}</dd>
              </div>
            ))}
          </dl>
          <p className="admin-help">
            No checkout or public product URL is created by this preview.
          </p>
        </div>
      </section>
    </>
  );
}
