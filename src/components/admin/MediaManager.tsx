/* eslint-disable @next/next/no-img-element -- Direct responsive derivatives must never enter the shared Next image cache. */
"use client";
import { useEffect, useState } from "react";
type Asset = {
  id: string;
  original_filename: string | null;
  alt_text: string | null;
  width: number;
  height: number;
  is_placeholder: boolean;
  verified_at: string | null;
  processed_at: string | null;
  previous_media_id?: string | null;
};
type Gallery = {
  id: string;
  media_id: string;
  sort_order: number;
  alt_text_override: string | null;
  archived_at: string | null;
  catalog_media: Asset;
};
type Workspace = {
  target: {
    version: number;
    publication_status?: string;
    archived_at?: string;
    logo_media_id?: string;
    hero_media_id?: string;
    media_id?: string;
    default_image_alt?: string;
    logo_alt_override?: string;
    hero_alt_override?: string;
    alt_text_override?: string;
  };
  gallery: Gallery[];
  library: Asset[];
  asset?: Asset | null;
};
export function MediaManager({
  kind,
  id,
  csrf,
  editable,
}: {
  kind: string;
  id: string;
  csrf: string;
  editable: boolean;
}) {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Workspace | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    fetch(`/admin/media/api?kind=${kind}&id=${id}&page=${page}`, {
      cache: "no-store",
    })
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error);
        if (active) setData(d);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [kind, id, page]);
  async function mutate(
    operation: string,
    extra: Record<string, unknown> = {},
  ) {
    if (!data || busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/admin/media/api", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": csrf },
        body: JSON.stringify({
          kind,
          id,
          version: data.target.version,
          operation,
          ...extra,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      window.location.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to change gallery.");
      setBusy(false);
    }
  }
  const allowed =
    editable &&
    !!data &&
    (kind === "banner" ||
      (data.target.publication_status === "draft" && !data.target.archived_at));
  const current = data?.gallery.filter((i) => !i.archived_at) || [];
  const archived = data?.gallery.filter((i) => i.archived_at) || [];
  const single =
    data?.target.logo_media_id ||
    data?.target.hero_media_id ||
    data?.target.media_id;
  const asset = (media: Asset, image?: Gallery, index = 0) => (
    <div className="admin-media-item" key={image?.id || media.id}>
      <img
        src={`/admin/media/file/${media.id}/${media.processed_at ? "640" : "original"}`}
        srcSet={
          media.processed_at
            ? [320, 640, 1280]
                .filter(
                  (w, n, all) =>
                    n === 0 ||
                    Math.min(w, media.width) !==
                      Math.min(all[n - 1], media.width),
                )
                .map(
                  (w) =>
                    `/admin/media/file/${media.id}/${w} ${Math.min(w, media.width)}w`,
                )
                .join(", ")
            : undefined
        }
        sizes="(max-width: 680px) calc(100vw - 78px), 255px"
        width={320}
        height={200}
        loading="lazy"
        alt={
          image?.alt_text_override || media.alt_text || "Private image preview"
        }
      />
      <strong>{media.original_filename || "Earlier media asset"}</strong>
      <a
        className="admin-text-link"
        download={media.original_filename || "original-image"}
        href={`/admin/media/file/${media.id}/original`}
      >
        Download private original
      </a>
      <small>
        {media.width} × {media.height} ·{" "}
        {media.is_placeholder
          ? "Placeholder"
          : !media.processed_at
            ? "Processing required"
            : media.verified_at
              ? "Genuine image verified"
              : "Authenticity unverified"}
        {image && index === 0 ? " · Primary image" : ""}
      </small>
      {allowed && image ? (
        <>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const values = new FormData(e.currentTarget);
              void mutate("alt", {
                image_id: image.id,
                alt_text: String(values.get("alt_text") || ""),
              });
            }}
          >
            <label>
              Alt text
              <input
                name="alt_text"
                maxLength={500}
                defaultValue={image.alt_text_override || media.alt_text || ""}
              />
            </label>
            <button
              disabled={busy}
              className="admin-button admin-button-secondary"
            >
              Save alt text
            </button>
          </form>
          <div className="admin-media-buttons">
            <button
              className="admin-button admin-button-secondary"
              disabled={busy || index === 0}
              onClick={() => {
                const ids = current.map((i) => i.id);
                [ids[index - 1], ids[index]] = [ids[index], ids[index - 1]];
                void mutate("reorder", { image_ids: ids });
              }}
            >
              Move up
            </button>
            <button
              className="admin-button admin-button-secondary"
              disabled={busy || index === current.length - 1}
              onClick={() => {
                const ids = current.map((i) => i.id);
                [ids[index], ids[index + 1]] = [ids[index + 1], ids[index]];
                void mutate("reorder", { image_ids: ids });
              }}
            >
              Move down
            </button>
            <button
              className="admin-button admin-button-secondary"
              disabled={busy || index === 0}
              onClick={() =>
                void mutate("reorder", {
                  image_ids: [
                    image.id,
                    ...current
                      .filter((i) => i.id !== image.id)
                      .map((i) => i.id),
                  ],
                })
              }
            >
              Make primary
            </button>
            <button
              className="admin-button admin-button-danger"
              disabled={busy}
              onClick={() => {
                if (
                  confirm(
                    "Remove this image from the Draft gallery? Its original and history will be retained.",
                  )
                )
                  void mutate("remove", { image_id: image.id });
              }}
            >
              Remove
            </button>
          </div>
        </>
      ) : null}
      {allowed && !image ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void mutate("alt", {
              alt_text: String(
                new FormData(e.currentTarget).get("alt_text") || "",
              ),
            });
          }}
        >
          <label>
            Asset alt text
            <input
              name="alt_text"
              maxLength={500}
              defaultValue={
                data?.target.logo_alt_override ||
                data?.target.hero_alt_override ||
                data?.target.alt_text_override ||
                media.alt_text ||
                ""
              }
            />
          </label>
          <button
            className="admin-button admin-button-secondary"
            disabled={busy}
          >
            Save alt text
          </button>
        </form>
      ) : null}
      {allowed && !image && media.previous_media_id ? (
        <button
          className="admin-button admin-button-secondary"
          disabled={busy}
          onClick={() =>
            void mutate("attach", { media_id: media.previous_media_id })
          }
        >
          Restore previous asset version
        </button>
      ) : null}
      {editable &&
      !media.is_placeholder &&
      !media.verified_at &&
      media.processed_at ? (
        <button
          className="admin-button admin-button-secondary"
          disabled={busy}
          onClick={() => {
            if (
              confirm(
                "I independently verified this is a genuine original image, with accurate alt text, rather than a development placeholder.",
              )
            )
              void mutate("verify", { media_id: media.id, confirm: true });
          }}
        >
          Verify genuine image
        </button>
      ) : null}
    </div>
  );
  return (
    <section className="admin-card admin-side-card admin-media-manager">
      <h2>
        {kind === "product"
          ? "Product gallery"
          : kind === "brand"
            ? "Brand logo"
            : kind === "category"
              ? "Category image"
              : "Banner image"}
      </h2>
      <p className="admin-help">
        Private originals and recoverable versions. Save product details before
        changing images; successful image changes reload this page.
      </p>
      {error ? (
        <div role="alert" className="admin-notice admin-notice-error">
          {error}
        </div>
      ) : null}
      {!data ? (
        <p role="status">Loading private media…</p>
      ) : (
        <>
          {kind === "product"
            ? current.map((i, n) => asset(i.catalog_media, i, n))
            : single
              ? asset(
                  data.asset ||
                    data.library.find((m) => m.id === single) || {
                      id: single,
                      original_filename: null,
                      alt_text: null,
                      width: 0,
                      height: 0,
                      is_placeholder: true,
                      verified_at: null,
                      processed_at: "known",
                    },
                )
              : null}
          {!current.length && !single ? (
            <p className="admin-media-empty">
              No image attached. Images remain optional for Draft products.
            </p>
          ) : null}
          {allowed ? (
            <form
              className="admin-media-upload"
              onSubmit={async (e) => {
                e.preventDefault();
                if (busy) return;
                const form = new FormData(e.currentTarget);
                const file = form.get("file");
                if (!(file instanceof File) || !file.size) {
                  setError("Choose an image.");
                  return;
                }
                setBusy(true);
                setError("");
                form.set("upload_id", crypto.randomUUID());
                form.set("kind", kind);
                form.set("target_id", id);
                form.set("version", String(data.target.version));
                form.set(
                  "genuine",
                  form.get("genuine") === "on" ? "true" : "false",
                );
                const replace = current.find(
                  (i) => i.id === form.get("replace_image_id"),
                );
                if (replace) form.set("previous_media_id", replace.media_id);
                else if (single) form.set("previous_media_id", single);
                try {
                  const response = await fetch("/admin/media/api", {
                    method: "POST",
                    headers: { "X-CSRF-Token": csrf },
                    body: form,
                  });
                  const result = await response.json();
                  if (!response.ok) throw new Error(result.error);
                  window.location.assign(result.location);
                } catch (err) {
                  setError(
                    err instanceof Error ? err.message : "Upload failed.",
                  );
                  setBusy(false);
                }
              }}
            >
              <label>
                Original image
                <input
                  type="file"
                  name="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  required
                />
              </label>
              <p className="admin-help">
                JPEG, PNG, WebP or AVIF · 10 MiB maximum · Static images only ·
                Up to 24 megapixels. Responsive WebP copies are created
                automatically.
              </p>
              <label>
                Image alt text
                <input
                  name="alt_text"
                  maxLength={500}
                  defaultValue={data.target.default_image_alt || ""}
                  placeholder="Describe the actual image"
                />
              </label>
              {kind === "product" && current.length ? (
                <label>
                  Upload action
                  <select name="replace_image_id">
                    <option value="">Add another image</option>
                    {current.map((i, n) => (
                      <option value={i.id} key={i.id}>
                        Replace image {n + 1} · retain earlier version
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
              <label className="admin-checkbox">
                <input name="genuine" type="checkbox" />
                <span>
                  This is an original image, not a development placeholder.
                  Authenticity verification is a separate action after upload.
                </span>
              </label>
              <button className="admin-button admin-full" disabled={busy}>
                {busy
                  ? "Processing private upload…"
                  : single
                    ? "Upload replacement"
                    : "Upload image"}
              </button>
            </form>
          ) : (
            <p className="admin-help">
              Only administrators can change media on an active Draft. Return
              published catalog entries to Draft first.
            </p>
          )}
          {allowed && archived.length ? (
            <details className="admin-advanced">
              <summary>
                Recover earlier gallery images ({archived.length})
              </summary>
              {archived.map((i) => (
                <div className="admin-media-history" key={i.id}>
                  <span>{i.catalog_media.original_filename || i.media_id}</span>
                  <button
                    disabled={busy}
                    className="admin-button admin-button-secondary"
                    onClick={() =>
                      void mutate("attach", { media_id: i.media_id })
                    }
                  >
                    Restore image
                  </button>
                </div>
              ))}
            </details>
          ) : null}
          {allowed ? (
            <details className="admin-advanced">
              <summary>Attach an existing private asset</summary>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void mutate("attach", {
                    media_id: String(
                      new FormData(e.currentTarget).get("media_id"),
                    ),
                  });
                }}
              >
                <label>
                  Recent processed assets
                  <select name="media_id" required>
                    <option value="">Select an asset</option>
                    {data.library
                      .filter((m) => m.processed_at)
                      .map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.original_filename || m.id} ·{" "}
                          {m.verified_at ? "verified" : "unverified"}
                        </option>
                      ))}
                  </select>
                </label>
                <button
                  disabled={busy}
                  className="admin-button admin-button-secondary"
                >
                  Attach selected asset
                </button>
              </form>
              <div className="admin-media-buttons">
                <button
                  type="button"
                  className="admin-button admin-button-secondary"
                  disabled={busy || page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  Newer assets
                </button>
                <button
                  type="button"
                  className="admin-button admin-button-secondary"
                  disabled={busy || data.library.length < 50}
                  onClick={() => setPage(page + 1)}
                >
                  Older assets
                </button>
              </div>
              <p className="admin-help">
                Original objects are never overwritten or deleted. Earlier
                brand/banner versions also remain in this private library and
                audit history.
              </p>
            </details>
          ) : null}
        </>
      )}
    </section>
  );
}
