import Link from "next/link";
import { notFound } from "next/navigation";
import { adminProduct } from "@/lib/admin/data";
import { idSchema } from "@/lib/admin/validation";
import { PageHeading, CsrfField } from "@/components/admin/shared";
import { MutationForm } from "@/components/admin/MutationForm";
export default async function Revision({
  params,
}: {
  params: Promise<{ id: string; revision: string }>;
}) {
  const { id, revision } = await params;
  const { client, actor, product } = await adminProduct(id);
  if (!idSchema.safeParse(revision).success) notFound();
  const result = await client
    .from("product_revisions")
    .select("id,revision_no,workflow_state,snapshot,created_at")
    .eq("id", revision)
    .eq("product_id", id)
    .maybeSingle();
  if (result.error) throw new Error("Revision unavailable");
  if (!result.data) notFound();
  const row = result.data;
  const snapshot = row.snapshot as Record<string, unknown>;
  return (
    <>
      <Link href={`/admin/products/${id}`} className="admin-back">
        ← Product management
      </Link>
      <PageHeading
        title={`Product revision ${row.revision_no}`}
        description="Review the saved details before recovering an earlier version into a private Draft."
      />
      <section className="admin-card admin-form-card">
        <p className="admin-help">
          {row.workflow_state.replaceAll("_", " ")} ·{" "}
          {new Date(row.created_at).toISOString()}
        </p>
        <dl className="admin-specs">
          {[
            "name",
            "sku",
            "model",
            "description",
            "price",
            "currency",
            "stock_status",
            "seo_title",
            "seo_description",
          ].map((key) => (
            <div key={key}>
              <dt>{key.replaceAll("_", " ")}</dt>
              <dd>
                {snapshot[key] === null || snapshot[key] === undefined
                  ? "Not added"
                  : String(snapshot[key])}
              </dd>
            </div>
          ))}
        </dl>
        <h2>Historical specifications</h2>
        <pre className="admin-import-payload">
          {JSON.stringify(snapshot.specifications || {}, null, 2)}
        </pre>
        <p className="admin-help">
          Historical prices and stock values need fresh verification.
          Product-detail recovery preserves the current permanent URL. Recover
          images separately using the gallery history controls.
        </p>
        {actor.role === "admin" &&
        product.publication_status === "draft" &&
        !product.archived_at ? (
          <MutationForm action="/admin/manage/restore-product">
            <CsrfField />
            <input name="id" type="hidden" value={id} />
            <input name="version" type="hidden" value={product.version} />
            <input name="revision_id" type="hidden" value={revision} />
            <label className="admin-checkbox">
              <input name="confirm" type="checkbox" required />
              <span>
                I reviewed this snapshot and approve restoring these details
                into the current Draft, clearing verification and review.
              </span>
            </label>
            <button className="admin-button">Restore details as Draft</button>
          </MutationForm>
        ) : (
          <p className="admin-help">
            An administrator must return the product to an active Draft before
            restoring details.
          </p>
        )}
      </section>
    </>
  );
}
