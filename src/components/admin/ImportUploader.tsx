"use client";
import { useState } from "react";
export function ImportUploader({ csrf }: { csrf: string }) {
  const [id, setId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <section className="admin-card admin-form-card">
      <span className="admin-phase">CSV / XLSX · DRAFT BY DEFAULT</span>
      <h2>Upload a product spreadsheet</h2>
      <p className="admin-help">
        Choose one worksheet, with a header row and up to 10,000 products.
        Maximum file size: 8 MiB. Keep SKUs and model numbers as text in Excel.
        Formulas are never executed.
      </p>
      <div className="admin-media-buttons">
        <a
          download
          className="admin-button admin-button-secondary"
          href="/admin/imports/template?format=csv"
        >
          Download CSV template
        </a>
        <a
          download
          className="admin-button admin-button-secondary"
          href="/admin/imports/template?format=xlsx"
        >
          Download XLSX template
        </a>
      </div>
      {error ? (
        <div className="admin-notice admin-notice-error" role="alert">
          {error}
          {id ? (
            <a href={`/admin/imports/${id}`}> Open saved import progress →</a>
          ) : null}
        </div>
      ) : null}
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (busy) return;
          const form = new FormData(e.currentTarget);
          const requestId = id || crypto.randomUUID();
          setId(requestId);
          form.set("request_id", requestId);
          setBusy(true);
          setError("");
          try {
            const response = await fetch("/admin/imports/api", {
              method: "POST",
              headers: { "X-CSRF-Token": csrf },
              body: form,
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error);
            window.location.assign(result.location);
          } catch (err) {
            setError(
              err instanceof Error
                ? err.message
                : "Upload was interrupted. Retry the same file to resume.",
            );
            setBusy(false);
          }
        }}
      >
        <label>
          Spreadsheet file
          <input
            name="file"
            type="file"
            accept=".csv,.xlsx"
            required
            disabled={busy}
            onChange={() => {
              if (!busy) setId("");
            }}
          />
        </label>
        <button className="admin-button" disabled={busy}>
          {busy ? "Validating and saving original…" : "Upload for mapping"}
        </button>
      </form>
      <p className="admin-help">
        Uploading saves a private original and source rows. It does not create,
        update, publish or index products.
      </p>
    </section>
  );
}
