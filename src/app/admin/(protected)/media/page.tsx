import Link from "next/link";
import { adminPageSession } from "@/lib/admin/data";
import { PageHeading, CsrfField, Status } from "@/components/admin/shared";
import { MutationForm } from "@/components/admin/MutationForm";
import { MediaPanel } from "@/components/admin/MediaPanel";
import { idSchema } from "@/lib/admin/validation";
export default async function Media({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { client, actor } = await adminPageSession();
  const query = await searchParams;
  const banners = await client
    .from("homepage_banners")
    .select("*")
    .order("sort_order")
    .limit(200);
  if (banners.error) throw new Error("Banner management unavailable");
  const selected = idSchema.safeParse(query.banner).success
    ? banners.data.find((b) => b.id === query.banner)
    : undefined;
  const editable = actor.role === "admin";
  return (
    <>
      <PageHeading
        title="Media & banners"
        description="Manage original product images, brand assets and banner versions without changing source code."
      />
      <div className="admin-media-buttons">
        <Link
          className="admin-button admin-button-secondary"
          href="/admin/products"
        >
          Product galleries →
        </Link>
        <Link
          className="admin-button admin-button-secondary"
          href="/admin/catalog"
        >
          Brand logos & category images →
        </Link>
      </div>
      <div className="admin-editor-layout">
        <div>
          <section className="admin-card admin-form-card">
            <h2>Homepage banners</h2>
            <p className="admin-help">
              Editing or replacing a banner disables it until explicitly
              approved again. Storefront display will be integrated in Phase 5
              while preserving the approved design.
            </p>
            <div className="admin-taxonomy-list">
              {banners.data.map((b) => (
                <div key={b.id}>
                  <Link href={`/admin/media?banner=${b.id}`}>{b.title}</Link>
                  <Status value={b.active ? "published" : "draft"} />
                </div>
              ))}
            </div>
            <Link className="admin-text-link" href="/admin/media">
              Add a new banner ＋
            </Link>
          </section>
          <MutationForm action="/admin/manage/banner">
            <CsrfField />
            <input name="id" type="hidden" value={selected?.id || ""} />
            <input
              name="version"
              type="hidden"
              value={selected?.version || ""}
            />
            <fieldset disabled={!editable} className="admin-editor-fields">
              <section className="admin-card admin-form-card">
                <h2>{selected ? "Edit banner" : "Add banner"}</h2>
                <div className="admin-form-grid">
                  <label className="admin-span-two">
                    Banner title
                    <input
                      name="title"
                      required
                      maxLength={180}
                      defaultValue={selected?.title || ""}
                    />
                  </label>
                  <label className="admin-span-two">
                    Subtitle
                    <textarea
                      name="subtitle"
                      rows={3}
                      maxLength={1000}
                      defaultValue={selected?.subtitle || ""}
                    />
                  </label>
                  <label>
                    Button label
                    <input
                      name="cta_label"
                      maxLength={100}
                      defaultValue={selected?.cta_label || ""}
                    />
                  </label>
                  <label>
                    Button path
                    <input
                      name="cta_path"
                      defaultValue={selected?.cta_path || ""}
                      placeholder="/category/sanitary"
                    />
                  </label>
                  <label>
                    Display order
                    <input
                      name="sort_order"
                      type="number"
                      min="0"
                      max="10000"
                      defaultValue={selected?.sort_order || 0}
                    />
                  </label>
                </div>
                {editable ? (
                  <button className="admin-button">Save inactive banner</button>
                ) : null}
              </section>
            </fieldset>
          </MutationForm>
        </div>
        <aside>
          {selected ? (
            <>
              <MediaPanel kind="banner" id={selected.id} role={actor.role} />
              {editable ? (
                <section className="admin-card admin-side-card">
                  <h2>Explicit banner approval</h2>
                  <MutationForm action="/admin/manage/banner-active">
                    <CsrfField />
                    <input name="id" type="hidden" value={selected.id} />
                    <input
                      name="version"
                      type="hidden"
                      value={selected.version}
                    />
                    <input
                      name="active"
                      type="hidden"
                      value={selected.active ? "false" : "true"}
                    />
                    <label className="admin-checkbox">
                      <input name="confirm" type="checkbox" required />
                      <span>
                        {selected.active
                          ? "Withdraw this banner immediately."
                          : "I reviewed the text and genuine image and approve public display."}
                      </span>
                    </label>
                    <button
                      className="admin-button admin-full"
                      disabled={!selected.media_id}
                    >
                      {selected.active
                        ? "Disable banner"
                        : "Approve & activate banner"}
                    </button>
                  </MutationForm>
                </section>
              ) : null}
            </>
          ) : (
            <section className="admin-card admin-side-card">
              <h2>Recoverable media</h2>
              <p className="admin-help">
                Create a banner first, then upload its private original.
                Replacements retain previous assets and audit history.
                Unverified placeholders cannot be activated.
              </p>
            </section>
          )}
        </aside>
      </div>
    </>
  );
}
