import Link from "next/link";
import { adminProduct } from "@/lib/admin/data";
import { ProductEditor } from "@/components/admin/ProductEditor";
import { ProductWorkflow } from "@/components/admin/ProductWorkflow";
import { PageHeading, Notice, notices } from "@/components/admin/shared";
import type { PublicRoute } from "@/lib/catalog/publication";
export default async function EditProduct({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { id } = await params;
  const data = await adminProduct(id);
  const query = await searchParams;
  return (
    <>
      <Link href="/admin/products" className="admin-back">
        ← All products
      </Link>
      <PageHeading
        title={data.product.name}
        description={`${data.actor.role === "admin" ? "Manage" : "Inspect"} product information, review history and publication decisions.`}
      />
      <Notice message={notices[query.notice || ""]} />
      <div className="admin-editor-layout">
        <div>
          <ProductEditor
            product={data.product}
            categories={data.categories}
            brands={data.brands}
            readOnly={
              data.actor.role !== "admin" ||
              data.product.publication_status !== "draft" ||
              !!data.product.archived_at
            }
          />
          <section className="admin-card admin-form-card">
            <h2>Revision history</h2>
            <p className="admin-help">
              Immutable snapshots include product information, gallery metadata
              and category membership.
            </p>
            {data.revisions.length ? (
              <ul className="admin-revision-list">
                {data.revisions.map((r) => (
                  <li key={r.id}>
                    <Link
                      className="admin-text-link"
                      href={`/admin/products/${id}/revisions/${r.id}`}
                    >
                      Version {r.revision_no} · Review / recover →
                    </Link>
                    <span>{r.workflow_state.replaceAll("_", " ")}</span>
                    <time>
                      {new Date(r.created_at).toLocaleString("en-GB", {
                        timeZone: "UTC",
                      })}{" "}
                      UTC
                    </time>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="admin-help">
                A snapshot is recorded when this Draft is submitted for review.
              </p>
            )}
          </section>
        </div>
        <ProductWorkflow
          product={data.product}
          role={data.actor.role}
          route={data.route as PublicRoute | null}
          gallery={data.gallery}
        />
      </div>
    </>
  );
}
