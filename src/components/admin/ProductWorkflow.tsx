import { MediaPanel } from "./MediaPanel";
import { CsrfField, Status } from "./shared";
import { MutationForm } from "./MutationForm";
import { isIndexable, type PublicRoute } from "@/lib/catalog/publication";
import type { AdminProduct, GalleryImage } from "@/lib/admin/data";
import Link from "next/link";
import { ShieldCheck, ExternalLink } from "lucide-react";
function WorkflowForm({
  action,
  product,
  children,
}: {
  action: string;
  product: AdminProduct;
  children: React.ReactNode;
}) {
  return (
    <MutationForm action={`/admin/actions/${action}`}>
      <CsrfField />
      <input type="hidden" name="product_id" value={product.id} />
      <input type="hidden" name="version" value={product.version} />
      {children}
    </MutationForm>
  );
}
export function ProductWorkflow({
  product,
  role,
  route,
}: {
  product: AdminProduct;
  role: string;
  route: PublicRoute | null;
  gallery: GalleryImage[];
}) {
  const admin = role === "admin";
  const reviewed =
    product.reviewed_version === product.version &&
    product.identity_verified &&
    product.content_verified &&
    !!product.reviewed_at;
  const eligible = isIndexable(route, {
    production: true,
    indexingEnabled: true,
  });
  return (
    <aside className="admin-editor-aside">
      <section className="admin-card admin-side-card"><h2>Homepage selection</h2><p className="admin-help">Only explicitly published products can appear on the storefront.</p><MutationForm action="/admin/manage/featured"><CsrfField/><input type="hidden" name="id" value={product.id}/><input type="hidden" name="version" value={product.version}/><fieldset disabled={!admin || product.publication_status !== 'draft' || !!product.archived_at}><label className="admin-checkbox"><input type="checkbox" name="featured" defaultChecked={product.featured}/><span>Feature this product on the homepage</span></label><button className="admin-button admin-full">Save homepage selection</button></fieldset></MutationForm></section>
      <section className="admin-card admin-side-card">
        <div className="admin-side-title">
          <h2>Publication</h2>
          <Status
            value={
              product.archived_at ? "archived" : product.publication_status
            }
          />
        </div>
        <p className="admin-help">
          Version {product.version} · Every change requires a fresh review.
        </p>
        <Link
          className="admin-button admin-button-secondary admin-full"
          href={`/admin/products/${product.id}/preview`}
        >
          <ExternalLink size={15} />
          Open private preview
        </Link>
        {admin && !product.archived_at ? (
          <div className="admin-workflow-actions">
            {product.publication_status === "draft" ? (
              <WorkflowForm action="submit" product={product}>
                <p>
                  Submit this version when it is ready for a genuine product
                  review.
                </p>
                <button className="admin-button admin-full">
                  Submit for review
                </button>
              </WorkflowForm>
            ) : null}
            {product.publication_status === "ready_for_review" ? (
              <>
                <WorkflowForm action="review" product={product}>
                  <h3>Explicit product review</h3>
                  <label className="admin-checkbox">
                    <input name="identity" type="checkbox" required />
                    <span>I verified the genuine product identity.</span>
                  </label>
                  <label className="admin-checkbox">
                    <input name="content" type="checkbox" required />
                    <span>
                      I reviewed the description and specifications for accuracy
                      and usefulness.
                    </span>
                  </label>
                  <label className="admin-checkbox">
                    <input
                      name="price"
                      type="checkbox"
                      disabled={product.price === null}
                    />
                    <span>I independently verified the entered price.</span>
                  </label>
                  <label className="admin-checkbox">
                    <input
                      name="stock"
                      type="checkbox"
                      disabled={product.stock_status === "unknown"}
                    />
                    <span>I independently verified the stock information.</span>
                  </label>
                  <button className="admin-button admin-button-secondary admin-full">
                    Record review
                  </button>
                </WorkflowForm>
                <WorkflowForm action="publish" product={product}>
                  <h3>Approve publication</h3>
                  <p>
                    {reviewed
                      ? "This exact version has a recorded review."
                      : "Record a complete review before publishing."}
                  </p>
                  <label className="admin-checkbox">
                    <input
                      name="approve_indexing"
                      type="checkbox"
                      disabled={!reviewed}
                    />
                    <span>
                      Also approve Google indexing, if all eligibility
                      requirements are met.
                    </span>
                  </label>
                  <label className="admin-checkbox">
                    <input
                      name="confirm"
                      type="checkbox"
                      required
                      disabled={!reviewed}
                    />
                    <span>
                      I explicitly approve making this product publicly visible.
                    </span>
                  </label>
                  <button
                    className="admin-button admin-full"
                    disabled={!reviewed}
                  >
                    Publish approved product
                  </button>
                </WorkflowForm>
              </>
            ) : null}
            {product.publication_status !== "draft" ? (
              <WorkflowForm action="return-draft" product={product}>
                <label className="admin-checkbox">
                  <input name="confirm" type="checkbox" required />
                  <span>Withdraw this product and clear its review.</span>
                </label>
                <button className="admin-button admin-button-secondary admin-full">
                  Return to Draft
                </button>
              </WorkflowForm>
            ) : null}
            <details className="admin-advanced">
              <summary>Archive product</summary>
              <WorkflowForm action="archive" product={product}>
                <label className="admin-checkbox">
                  <input name="confirm" type="checkbox" required />
                  <span>
                    Archive this product and withdraw its public route.
                  </span>
                </label>
                <button className="admin-button admin-button-danger admin-full">
                  Archive product
                </button>
              </WorkflowForm>
            </details>
          </div>
        ) : null}
      </section>
      <section className="admin-card admin-side-card">
        <span className="admin-small-icon">
          <ShieldCheck size={21} />
        </span>
        <h2>Google indexing</h2>
        <span className={`admin-eligibility ${eligible ? "is-eligible" : ""}`}>
          {eligible ? "Catalog eligibility approved" : "Excluded from indexing"}
        </span>
        <p className="admin-help">
          {product.publication_status !== "published"
            ? "Draft and review versions have no public route."
            : eligible
              ? "The database eligibility policy passes. Website indexing still requires a separate production rollout."
              : "Indexing requires separate approval, complete SEO information, SKU, published taxonomy and a verified genuine image."}
        </p>
        <p className="admin-help">
          This admin workspace and every private preview are always noindex.
        </p>
      </section>
      {admin && product.published_at ? (
        <section className="admin-card admin-side-card">
          <h2>Permanent URL</h2>
          <p className="admin-help">
            Renaming preserves history and prepares a redirect. The storefront
            redirect handler is a release blocker.
          </p>
          <WorkflowForm action="rename" product={product}>
            <label>
              New slug
              <input
                name="new_slug"
                required
                maxLength={120}
                pattern="[a-z0-9]+(-[a-z0-9]+)*"
                placeholder="new-permanent-slug"
              />
            </label>
            <label className="admin-checkbox">
              <input name="confirm" type="checkbox" required />
              <span>I approve this permanent URL change.</span>
            </label>
            <button className="admin-button admin-button-secondary admin-full">
              Rename with history
            </button>
          </WorkflowForm>
        </section>
      ) : null}
      <MediaPanel kind="product" id={product.id} role={role} />
    </aside>
  );
}
