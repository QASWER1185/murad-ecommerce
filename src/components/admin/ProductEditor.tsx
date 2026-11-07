import { CsrfField } from "./shared";
import { MutationForm } from "./MutationForm";
import type { AdminProduct, Taxonomy } from "@/lib/admin/data";
type Props = {
  product?: AdminProduct;
  categories: Taxonomy[];
  brands: Taxonomy[];
  readOnly?: boolean;
};
export function ProductEditor({
  product,
  categories,
  brands,
  readOnly = false,
}: Props) {
  const field = (key: keyof AdminProduct) => String(product?.[key] ?? "");
  return (
    <MutationForm action="/admin/actions/save">
      <CsrfField />
      <input type="hidden" name="product_id" value={product?.id || ""} />
      <input type="hidden" name="version" value={product?.version || ""} />
      <fieldset disabled={readOnly} className="admin-editor-fields">
        <section className="admin-card admin-form-card">
          <div className="admin-section-title">
            <span>01</span>
            <div>
              <h2>Product information</h2>
              <p>Start with the essentials. Keep unknown information empty.</p>
            </div>
          </div>
          <div className="admin-form-grid">
            <label className="admin-span-two">
              Product title <span>Required</span>
              <input
                name="name"
                required
                maxLength={180}
                defaultValue={field("name")}
                placeholder="Enter the genuine product name"
              />
            </label>
            <label>
              SKU
              <input
                name="sku"
                maxLength={80}
                defaultValue={field("sku")}
                placeholder="Your unique inventory code"
              />
            </label>
            <label>
              Manufacturer model
              <input
                name="model"
                maxLength={120}
                defaultValue={field("model")}
                placeholder="Add when confirmed"
              />
            </label>
            <label>
              Brand
              <select name="brand_id" defaultValue={field("brand_id")}>
                <option value="">Unassigned</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                    {b.publication_status !== "published" ? " · Draft" : ""}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Primary category
              <select name="category_id" defaultValue={field("category_id")}>
                <option value="">Unassigned</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {c.publication_status !== "published" ? " · Draft" : ""}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Product type
              <input
                name="product_type"
                maxLength={120}
                defaultValue={field("product_type")}
                placeholder="e.g. Wash basin, when verified"
              />
            </label>
            <label>
              Finish
              <input
                name="finish"
                maxLength={120}
                defaultValue={field("finish")}
                placeholder="Add the actual finish later"
              />
            </label>
            <label className="admin-span-two">
              Main product description
              <textarea
                name="description"
                rows={5}
                maxLength={20000}
                defaultValue={field("description")}
                placeholder="Describe this specific product using genuine, useful information."
              />
            </label>
            <label className="admin-span-two">
              Specifications <span>JSON object of text values</span>
              <textarea
                name="specifications"
                className="admin-code-input"
                rows={5}
                maxLength={20000}
                defaultValue={JSON.stringify(
                  product?.specifications || {},
                  null,
                  2,
                )}
                spellCheck={false}
              />
              <small>
                Leave as {"{}"} until real specifications are available. Each
                specification must have a text value.
              </small>
            </label>
          </div>
        </section>
        <section className="admin-card admin-form-card">
          <div className="admin-section-title">
            <span>02</span>
            <div>
              <h2>Pricing & availability</h2>
              <p>Stored values remain unverified until explicitly reviewed.</p>
            </div>
          </div>
          <div className="admin-form-grid">
            <label>
              Sales mode
              <select
                name="sales_mode"
                defaultValue={field("sales_mode") || "online"}
              >
                <option value="online">Online shopping</option>
                <option value="quotation">WhatsApp quotation only</option>
              </select>
            </label>
            <label>
              Price <span>Optional</span>
              <div className="admin-input-prefix">
                <span>PKR</span>
                <input
                  name="price"
                  type="number"
                  min="0.01"
                  step="0.01"
                  max="9999999999.99"
                  defaultValue={field("price")}
                  placeholder="Not added"
                />
              </div>
              <input type="hidden" name="currency" value="PKR" />
              <small>
                Quotation-only products never expose a fixed public price.
              </small>
            </label>
            <label>
              Stock information
              <select
                name="stock_status"
                defaultValue={field("stock_status") || "unknown"}
              >
                <option value="unknown">Unknown / not confirmed</option>
                <option value="in_stock">
                  In stock — requires verification
                </option>
                <option value="out_of_stock">
                  Out of stock — requires verification
                </option>
              </select>
            </label>
            <label>
              Stock quantity <span>Optional</span>
              <input
                name="stock_quantity"
                type="number"
                min="0"
                max="9999999"
                step="1"
                defaultValue={field("stock_quantity")}
                placeholder="Not confirmed"
              />
            </label>
          </div>
        </section>
        <section className="admin-card admin-form-card">
          <div className="admin-section-title">
            <span>03</span>
            <div>
              <h2>Search engine information</h2>
              <p>Useful metadata for a future approved product page.</p>
            </div>
          </div>
          <div className="admin-form-grid">
            <label className="admin-span-two">
              Permanent URL slug <span>Required</span>
              <div className="admin-input-prefix admin-slug">
                <span>/product/</span>
                <input
                  name="slug"
                  required
                  maxLength={120}
                  pattern="[a-z0-9]+(-[a-z0-9]+)*"
                  defaultValue={field("slug")}
                  readOnly={!!product?.published_at}
                  placeholder="descriptive-product-name"
                />
              </div>
              <small>
                {product?.published_at
                  ? "This URL has been published. Use the separate rename workflow to retain redirects."
                  : "Use a stable, descriptive name. Published URL changes require a controlled rename."}
              </small>
            </label>
            <label className="admin-span-two">
              SEO title <span>Maximum 160 characters</span>
              <input
                name="seo_title"
                maxLength={160}
                defaultValue={field("seo_title")}
                placeholder="Write a unique, descriptive page title"
              />
            </label>
            <label className="admin-span-two">
              Meta description <span>Maximum 320 characters</span>
              <textarea
                name="seo_description"
                rows={3}
                maxLength={320}
                defaultValue={field("seo_description")}
                placeholder="A useful, accurate summary of this product."
              />
            </label>
            <details className="admin-span-two admin-advanced">
              <summary>Advanced canonical setting</summary>
              <label>
                Canonical path
                <input
                  name="canonical_path"
                  defaultValue={field("canonical_path")}
                  placeholder="Default: this product’s own URL"
                  maxLength={200}
                />
                <small>
                  A non-self canonical excludes this product from indexing.
                  External URLs are rejected.
                </small>
              </label>
            </details>
          </div>
        </section>
        {!readOnly ? (
          <div className="admin-save-bar">
            <span>Saved as Draft · Private until reviewed and approved</span>
            <button className="admin-button" type="submit">
              {product ? "Save Draft changes" : "Create Draft product"}
            </button>
          </div>
        ) : (
          <p className="admin-help">
            {product?.publication_status === "draft"
              ? "This account has read-only access."
              : "Return the product to Draft before editing. This withdraws its public route."}
          </p>
        )}
      </fieldset>
    </MutationForm>
  );
}
