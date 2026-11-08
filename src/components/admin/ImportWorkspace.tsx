"use client";
import { useRef, useState, useEffect } from "react";
import { importFields } from "@/lib/imports/fields";
type Job = {
  id: string;
  version: number;
  file_name: string;
  format: string;
  headers: string[];
  column_mapping: Record<string, number>;
  mode: string;
  clear_blanks: boolean;
  status: string;
  total_rows: number;
  uploaded_rows: number;
  prepared_rows: number;
  processed_rows: number;
  requires_price_confirmation: boolean;
  summary: {
    applied: number;
    errors: number;
    pending: number;
    skipped?: number;
  };
};
type Row = {
  row_number: number;
  sku: string | null;
  payload: Record<string, unknown>;
  errors: string[];
  intended_action: string;
  processing_status: string;
};
export function ImportWorkspace({
  initial,
  csrf,
  editable,
}: {
  initial: { job: Job; rows: Row[] };
  csrf: string;
  editable: boolean;
}) {
  const [job, setJob] = useState(initial.job);
  const [rows, setRows] = useState(initial.rows);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const stop = useRef(false);
  const [mode, setMode] = useState(job.mode);
  const [confirm, setConfirm] = useState(false);
  const [prices, setPrices] = useState(false);
  const [skip, setSkip] = useState(false);
  useEffect(
    () => () => {
      stop.current = true;
    },
    [],
  );
  async function refresh() {
    const response = await fetch(`/admin/imports/api?id=${job.id}`, {
      cache: "no-store",
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    setJob(data.job);
    setRows(data.rows);
    return data.job as Job;
  }
  async function call(operation: string, extra: Record<string, unknown> = {}) {
    const response = await fetch("/admin/imports/api", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "X-CSRF-Token": csrf },
      body: JSON.stringify({
        id: job.id,
        version: job.version,
        operation,
        ...extra,
      }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error);
    setJob(result.job);
    return result.job as Job;
  }
  async function work(operation: "prepare" | "process", current: Job) {
    while (
      !stop.current &&
      current.status === (operation === "prepare" ? "validating" : "processing")
    ) {
      current = await call(operation);
      await new Promise((r) => setTimeout(r, 30));
    }
    await refresh();
  }
  async function run(task: () => Promise<void>) {
    if (busy) return;
    stop.current = false;
    setError("");
    setBusy(true);
    try {
      await task();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "The batch stopped. Saved progress is retained.",
      );
      try {
        await refresh();
      } catch {}
    } finally {
      setBusy(false);
    }
  }
  const canMap =
    editable &&
    ["pending", "validating", "ready_for_review"].includes(job.status) &&
    job.uploaded_rows === job.total_rows &&
    job.summary.applied === 0;
  return (
    <>
      <section className="admin-card admin-form-card">
        <div className="admin-side-title">
          <h2>{job.file_name}</h2>
          <span className="admin-status">
            {job.status.replaceAll("_", " ")}
          </span>
        </div>
        <div className="admin-import-stats">
          <span>
            <strong>{job.total_rows}</strong> source rows
          </span>
          <span>
            <strong>{job.prepared_rows}</strong> validated
          </span>
          <span>
            <strong>{job.summary.applied}</strong> applied
          </span>
          <span>
            <strong>{job.summary.errors}</strong> errors
          </span>
        </div>
        <progress
          value={
            job.status === "processing" || job.status === "completed"
              ? job.processed_rows
              : job.prepared_rows
          }
          max={job.total_rows}
          aria-label="Import progress"
        />
        <p className="admin-help">
          Batches run while this page is open. Pausing or closing the page
          retains saved progress. Resume safely; committed rows are not applied
          twice.
        </p>
        {busy ? (
          <button
            className="admin-button admin-button-secondary"
            onClick={() => {
              stop.current = true;
            }}
          >
            Pause after current batch
          </button>
        ) : null}
        {error ? (
          <div role="alert" className="admin-notice admin-notice-error">
            {error}
          </div>
        ) : null}
        <div className="admin-media-buttons">
          <a
            href={`/admin/imports/${job.id}/report`}
            className="admin-button admin-button-secondary"
          >
            Download row-level report
          </a>
          {editable &&
          job.status === "pending" &&
          job.uploaded_rows < job.total_rows ? (
            <button
              className="admin-button"
              disabled={busy}
              onClick={() =>
                void run(async () => {
                  await call("resume-source");
                  await refresh();
                })
              }
            >
              Resume original source staging
            </button>
          ) : null}
          {editable && job.status === "validating" ? (
            <button
              className="admin-button"
              disabled={busy}
              onClick={() => void run(() => work("prepare", job))}
            >
              Resume validation
            </button>
          ) : null}
          {editable && job.status === "processing" ? (
            <button
              className="admin-button"
              disabled={busy}
              onClick={() => void run(() => work("process", job))}
            >
              Resume processing
            </button>
          ) : null}
          {editable && job.status === "completed" && job.summary.errors > 0 ? (
            <button
              className="admin-button"
              disabled={busy}
              onClick={() =>
                void run(async () => {
                  setConfirm(false);
                  setPrices(false);
                  setSkip(false);
                  const next = await call("retry");
                  await work("prepare", next);
                })
              }
            >
              Revalidate failed rows
            </button>
          ) : null}
        </div>
      </section>
      {canMap ? (
        <section className="admin-card admin-form-card">
          <h2>1. Map columns & validate</h2>
          <p className="admin-help">
            Match the spreadsheet columns to catalog fields. Unknown
            brands/categories need to be created explicitly. Duplicate
            normalized SKUs are rejected. Existing published products must be
            returned to Draft before import.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const values = new FormData(e.currentTarget);
              const mapping: Record<string, number> = {};
              for (const field of importFields) {
                const value = values.get(`map_${field}`);
                if (typeof value === "string" && value !== "")
                  mapping[field] = Number(value);
              }
              void run(async () => {
                setConfirm(false);
                setPrices(false);
                setSkip(false);
                const next = await call("configure", {
                  mapping,
                  mode,
                  clear_blanks: values.get("clear_blanks") === "on",
                });
                await work("prepare", next);
              });
            }}
          >
            <label>
              Import mode
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value)}
                disabled={busy}
              >
                <option value="draft_import">
                  Create / update Draft products
                </option>
                <option value="price_update">
                  Bulk price update · existing Draft SKUs only
                </option>
              </select>
            </label>
            <div className="admin-mapping-grid">
              {importFields
                .filter(
                  (f) =>
                    mode !== "price_update" || ["sku", "price"].includes(f),
                )
                .map((field) => {
                  const suggested = job.headers.findIndex(
                    (h) =>
                      h.trim().toLowerCase().replace(/[ -]+/g, "_") === field,
                  );
                  return (
                    <label key={field}>
                      {field.replaceAll("_", " ")}
                      {field === "sku" ? " · required" : ""}
                      <select
                        name={`map_${field}`}
                        defaultValue={
                          job.column_mapping[field] ??
                          (suggested >= 0 ? suggested : "")
                        }
                        disabled={busy}
                        required={
                          field === "sku" ||
                          (mode === "price_update" && field === "price")
                        }
                      >
                        <option value="">Do not import this field</option>
                        {job.headers.map((h, i) => (
                          <option key={i} value={i}>
                            {h}
                          </option>
                        ))}
                      </select>
                    </label>
                  );
                })}
            </div>
            <label className="admin-checkbox">
              <input
                name="clear_blanks"
                type="checkbox"
                defaultChecked={job.clear_blanks}
                disabled={busy}
              />
              <span>
                I explicitly allow mapped blank cells to clear existing optional
                values. Leave unchecked to preserve existing data.
              </span>
            </label>
            <button className="admin-button" disabled={busy}>
              Build validation preview
            </button>
          </form>
        </section>
      ) : null}
      <section className="admin-card">
        <div className="admin-card-heading">
          <div>
            <h2>2. Review mapped data</h2>
            <p>First 50 rows. Download the report for every row and error.</p>
          </div>
        </div>
        {rows.length ? (
          <div className="admin-table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Row / SKU</th>
                  <th>Mapped values</th>
                  <th>Planned action</th>
                  <th>Validation</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.row_number}>
                    <td>
                      {row.row_number}
                      <small>{row.sku || "SKU missing"}</small>
                    </td>
                    <td>
                      <strong>
                        {String(row.payload.name || "Existing product")}
                      </strong>
                      <small>
                        {row.payload.model
                          ? `Model: ${String(row.payload.model)}`
                          : ""}
                      </small>
                      <small>
                        {Object.hasOwn(row.payload, "price")
                          ? `Price: ${row.payload.price === null ? "clear value" : String(row.payload.price)} (unverified)`
                          : "Existing price preserved"}
                      </small>
                      <details>
                        <summary>All mapped values</summary>
                        <pre className="admin-import-payload">
                          {JSON.stringify(row.payload, null, 2)}
                        </pre>
                      </details>
                    </td>
                    <td>
                      {row.intended_action?.replaceAll("_", " ") ||
                        "Not applied"}
                      <small>{row.processing_status}</small>
                    </td>
                    <td>
                      {row.errors.length ? (
                        <ul className="admin-import-errors">
                          {row.errors.map((error, n) => (
                            <li key={n}>{error}</li>
                          ))}
                        </ul>
                      ) : (
                        "Valid / no recorded errors"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="admin-empty">
            Configure mapping to build a preview. No product changes have been
            made.
          </p>
        )}
      </section>
      {editable && job.status === "ready_for_review" ? (
        <section className="admin-card admin-form-card">
          <h2>3. Explicit import approval</h2>
          <label className="admin-checkbox">
            <input
              type="checkbox"
              checked={confirm}
              onChange={(e) => setConfirm(e.target.checked)}
            />
            <span>
              I reviewed the mapped values and approve applying the valid rows
              to Draft products. This does not approve publication or indexing.
            </span>
          </label>
          {job.requires_price_confirmation ? (
            <label className="admin-checkbox">
              <input
                type="checkbox"
                checked={prices}
                onChange={(e) => setPrices(e.target.checked)}
              />
              <span>
                I explicitly approve the displayed bulk price changes, including
                any approved blank-price clears.
              </span>
            </label>
          ) : null}
          {job.summary.errors > 0 ? (
            <label className="admin-checkbox">
              <input
                type="checkbox"
                checked={skip}
                onChange={(e) => setSkip(e.target.checked)}
              />
              <span>
                Skip invalid rows and retain their error reports. Apply only
                valid rows.
              </span>
            </label>
          ) : null}
          <button
            className="admin-button"
            disabled={
              busy ||
              !confirm ||
              (job.requires_price_confirmation && !prices) ||
              (job.summary.errors > 0 && !skip)
            }
            onClick={() =>
              void run(async () => {
                const next = await call("start", {
                  confirm,
                  confirm_prices: prices,
                  skip_errors: skip,
                });
                await work("process", next);
              })
            }
          >
            Apply approved Draft changes
          </button>
        </section>
      ) : null}
      {job.status === "completed" ? (
        <div className="admin-notice">
          Import finished: {job.summary.applied} rows applied,{" "}
          {job.summary.errors} errors retained, {job.summary.skipped || 0}{" "}
          unchanged rows skipped. Products remain Draft and unverified. Failed
          rows can be revalidated; successfully applied rows will be skipped.
        </div>
      ) : null}
    </>
  );
}
