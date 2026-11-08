import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { adminPageSession, taxonomies } from "@/lib/admin/data";
import { idSchema } from "@/lib/admin/validation";
import { PageHeading, CsrfField, Status } from "@/components/admin/shared";
import { MutationForm } from "@/components/admin/MutationForm";
import { MediaPanel } from "@/components/admin/MediaPanel";
type TaxonomyRecord = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  seo_title: string | null;
  seo_description: string | null;
  canonical_path: string | null;
  parent_id: string | null;
  default_sales_mode: string;
  kind: string;
  version: number;
  publication_status: string;
  published_at: string | null;
  archived_at: string | null;
  reviewed_version: number | null;
  identity_verified: boolean;
  content_verified: boolean;
};
export default async function TaxonomyEditor({
  params,
}: {
  params: Promise<{ kind: string; id: string }>;
}) {
  const { kind, id } = await params;
  const { client, actor } = await adminPageSession();
  if (!["brand", "category"].includes(kind)) notFound();
  const fresh = id === "new";
  if (fresh && actor.role !== "admin") redirect("/admin/catalog");
  if (!fresh && !idSchema.safeParse(id).success) notFound();
  const query = fresh
    ? null
    : await client
        .from(kind === "brand" ? "brands" : "categories")
        .select("*")
        .eq("id", id)
        .maybeSingle();
  if (query?.error) throw new Error("Catalog entry unavailable");
  if (!fresh && !query?.data) notFound();
  const item = query?.data as TaxonomyRecord | null;
  const options = await taxonomies(client);
  const editable =
    actor.role === "admin" &&
    (!item || (item.publication_status === "draft" && !item.archived_at));
  const v = (key: keyof TaxonomyRecord) => String(item?.[key] ?? "");
  const workflow = (operation: string, children: React.ReactNode) => (
    <MutationForm action="/admin/manage/workflow">
      <CsrfField />
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="version" value={item?.version || ""} />
      <input type="hidden" name="operation" value={operation} />
      {children}
    </MutationForm>
  );
  return (
    <>
      <Link className="admin-back" href="/admin/catalog">
        ← Brands & categories
      </Link>
      <PageHeading
        title={item?.name || `Add ${kind}`}
        description="Genuine information and useful page metadata. Draft entries stay private."
      />
      <div className="admin-editor-layout">
        <MutationForm action="/admin/manage/taxonomy">
          <CsrfField />
          <input name="kind" type="hidden" value={kind} />
          <input name="id" type="hidden" value={item?.id || ""} />
          <input name="version" type="hidden" value={item?.version || ""} />
          <fieldset disabled={!editable} className="admin-editor-fields">
            <section className="admin-card admin-form-card">
              <div className="admin-form-grid">
                <label>
                  Name
                  <input
                    name="name"
                    required
                    maxLength={180}
                    defaultValue={v("name")}
                  />
                </label>
                <label>
                  Permanent slug
                  <input
                    name="slug"
                    required
                    pattern="[a-z0-9]+(-[a-z0-9]+)*"
                    maxLength={120}
                    defaultValue={v("slug")}
                    readOnly={!!item?.published_at}
                  />
                </label>
                <label className="admin-span-two">
                  Description
                  <textarea
                    name="description"
                    rows={5}
                    maxLength={20000}
                    defaultValue={v("description")}
                  />
                </label>
                {kind === "category" ? (
                  <>
                    <label>
                      Parent category
                      <select name="parent_id" defaultValue={v("parent_id")}>
                        <option value="">No parent</option>
                        {options.categories
                          .filter((c) => c.id !== id)
                          .map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                      </select>
                    </label>
                    <label>
                      Default sales mode
                      <select
                        name="default_sales_mode"
                        defaultValue={v("default_sales_mode") || "online"}
                      >
                        <option value="online">Online shopping</option>
                        <option value="quotation">
                          WhatsApp quotation only
                        </option>
                      </select>
                    </label>
                  </>
                ) : (
                  <label>
                    Brand type
                    <select
                      name="brand_kind"
                      defaultValue={v("kind") || "manufacturer"}
                    >
                      <option value="manufacturer">Manufacturer</option>
                      <option value="collection">Collection</option>
                    </select>
                  </label>
                )}
                <label className="admin-span-two">
                  SEO title
                  <input
                    name="seo_title"
                    maxLength={160}
                    defaultValue={v("seo_title")}
                  />
                </label>
                <label className="admin-span-two">
                  Meta description
                  <textarea
                    name="seo_description"
                    maxLength={320}
                    rows={3}
                    defaultValue={v("seo_description")}
                  />
                </label>
                <label className="admin-span-two">
                  Canonical path
                  <input
                    name="canonical_path"
                    maxLength={200}
                    defaultValue={v("canonical_path")}
                    placeholder={`Default: /${kind}/your-slug`}
                  />
                  <small>Non-self canonicals are excluded from indexing.</small>
                </label>
              </div>
            </section>
            {editable ? (
              <button className="admin-button">
                {fresh ? "Create Draft entry" : "Save Draft entry"}
              </button>
            ) : (
              <p className="admin-help">
                Editors are read-only. Published or review entries must return
                to Draft before editing.
              </p>
            )}
          </fieldset>
        </MutationForm>
        <aside>
          {item ? (
            <>
              <section className="admin-card admin-side-card">
                <div className="admin-side-title">
                  <h2>Publication</h2>
                  <Status value={item.publication_status} />
                </div>
                <p className="admin-help">
                  Version {item.version}. Every edit clears review.
                </p>
                {actor.role === "admin" && !item.archived_at ? (
                  <div className="admin-workflow-actions">
                    {item.publication_status === "draft"
                      ? workflow(
                          "submit",
                          <button className="admin-button admin-full">
                            Submit for review
                          </button>,
                        )
                      : null}
                    {item.publication_status === "ready_for_review" ? (
                      <>
                        {workflow(
                          "review",
                          <>
                            <label className="admin-checkbox">
                              <input name="identity" type="checkbox" required />
                              <span>I verified the genuine identity.</span>
                            </label>
                            <label className="admin-checkbox">
                              <input name="content" type="checkbox" required />
                              <span>I verified useful, accurate content.</span>
                            </label>
                            <button className="admin-button admin-button-secondary admin-full">
                              Record review
                            </button>
                          </>,
                        )}
                        {workflow(
                          "publish",
                          <>
                            <label className="admin-checkbox">
                              <input name="approve_indexing" type="checkbox" />
                              <span>Approve indexing if eligible.</span>
                            </label>
                            <label className="admin-checkbox">
                              <input name="confirm" type="checkbox" required />
                              <span>
                                I explicitly approve public visibility.
                              </span>
                            </label>
                            <button
                              className="admin-button admin-full"
                              disabled={
                                item.reviewed_version !== item.version ||
                                !item.identity_verified ||
                                !item.content_verified
                              }
                            >
                              Publish approved entry
                            </button>
                          </>,
                        )}
                      </>
                    ) : null}
                    {item.publication_status !== "draft"
                      ? workflow(
                          "return-draft",
                          <>
                            <label className="admin-checkbox">
                              <input name="confirm" type="checkbox" required />
                              <span>
                                Withdraw this entry and clear approval.
                              </span>
                            </label>
                            <button className="admin-button admin-button-secondary admin-full">
                              Return to Draft
                            </button>
                          </>,
                        )
                      : null}
                    {item.published_at ? (
                      <details className="admin-advanced">
                        <summary>Permanent URL rename</summary>
                        {workflow(
                          "rename",
                          <>
                            <label>
                              New slug
                              <input
                                name="new_slug"
                                pattern="[a-z0-9]+(-[a-z0-9]+)*"
                                maxLength={120}
                                required
                              />
                            </label>
                            <label className="admin-checkbox">
                              <input name="confirm" type="checkbox" required />
                              <span>I approve the permanent URL change.</span>
                            </label>
                            <button className="admin-button admin-button-secondary">
                              Rename with history
                            </button>
                          </>,
                        )}
                      </details>
                    ) : null}
                  </div>
                ) : null}
              </section>
              <MediaPanel
                kind={kind as "brand" | "category"}
                id={id}
                role={actor.role}
              />
            </>
          ) : (
            <section className="admin-card admin-side-card">
              <h2>Private by default</h2>
              <p className="admin-help">
                Save this entry first, then add an original logo/image and
                complete its separate publication review.
              </p>
            </section>
          )}
        </aside>
      </div>
    </>
  );
}
