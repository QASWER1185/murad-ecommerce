"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { OrderRows, OrderDetail } from "@/lib/orders/contracts";
import { orderStatuses, orderKinds } from "@/lib/orders/contracts";
export function AdminOrders({
  initial,
  csrf,
}: {
  initial: OrderRows;
  csrf: string;
}) {
  const [data, setData] = useState(initial),
    [query, setQuery] = useState(""),
    [kind, setKind] = useState(""),
    [status, setStatus] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  async function load(page = 1) {
    setBusy(true);
    setMessage("");
    try {
      const r = await fetch("/admin/orders/query", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": csrf },
        body: JSON.stringify({ query, kind, status, page }),
        cache: "no-store",
      });
      if (!r.ok) throw Error();
      setData(await r.json());
    } catch {
      setMessage("Unable to load requests. Please try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="admin-stats-grid">
        {Object.entries(data.report).map(([label, value]) => (
          <div className="admin-card" style={{ padding: 20 }} key={label}>
            <p>
              {label === "received_today"
                ? "Received today (Pakistan)"
                : label.replaceAll("_", " ")}
            </p>
            <strong style={{ fontSize: 30 }}>{value}</strong>
          </div>
        ))}
      </div>
      <form
        className="admin-filters"
        onSubmit={(e) => {
          e.preventDefault();
          void load();
        }}
      >
        <label>
          Search reference or customer
          <input
            value={query}
            maxLength={100}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Private search"
            autoComplete="off"
          />
        </label>
        <label>
          Status
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All statuses</option>
            {orderStatuses.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
        <label>
          Request kind
          <select value={kind} onChange={(e) => setKind(e.target.value)}>
            <option value="">All requests</option>
            {orderKinds.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
        <button className="admin-button" disabled={busy}>
          Search requests
        </button>
      </form>
      <p className="admin-help">
        Requests are enquiries. Closed requests are not recorded sales. Customer
        searches are sent privately, never in page URLs.
      </p>
      <p role="status">{message}</p>
      <section className="admin-card">
        <div className="admin-table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Customer</th>
                <th>Kind</th>
                <th>Status</th>
                <th>Submitted</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <Link prefetch={false} href={`/admin/orders/${row.id}`}>
                      {row.reference}
                    </Link>
                  </td>
                  <td>{row.customer_name}</td>
                  <td>{row.request_kind}</td>
                  <td>{row.request_status.replaceAll("_", " ")}</td>
                  <td>{new Date(row.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!data.rows.length && (
          <p style={{ padding: 24 }}>No matching requests.</p>
        )}
        <div className="admin-card-heading">
          <button
            disabled={busy || data.page === 1}
            onClick={() => void load(data.page - 1)}
          >
            Previous
          </button>
          <span>
            {data.total} requests · Page {data.page}
          </span>
          <button
            disabled={busy || data.page * 25 >= data.total}
            onClick={() => void load(data.page + 1)}
          >
            Next
          </button>
        </div>
      </section>
    </>
  );
}
export function OrderStatusForm({
  order,
  csrf,
}: {
  order: OrderDetail;
  csrf: string;
}) {
  const router = useRouter();
  const [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    setBusy(true);
    setMessage("");
    try {
      const r = await fetch("/admin/orders/status", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": csrf },
        body: JSON.stringify({
          id: order.id,
          version: order.version,
          status: fields.get("status"),
          note: fields.get("note"),
          confirm: fields.get("confirm") === "on",
        }),
        cache: "no-store",
      });
      const data = await r.json();
      if (!r.ok) throw Error(data.error);
      setMessage("Request status updated.");
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to update request.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit} className="admin-card admin-form-card">
      <h2>Request status</h2>
      <p className="admin-help">
        Version {order.version}. Updating this request does not process a
        payment, reserve stock or record a completed purchase.
      </p>
      <fieldset
        disabled={
          busy || ["closed", "cancelled"].includes(order.request_status)
        }
      >
        <label>
          New request status
          <select name="status" required defaultValue="">
            <option value="" disabled>
              Select a status
            </option>
            {orderStatuses
              .filter(
                (v) =>
                  v !== order.request_status &&
                  (order.request_status === "received"
                    ? ["in_review", "cancelled"].includes(v)
                    : !["received"].includes(v)) &&
                  (v !== "quoted" || order.request_kind !== "order"),
              )
              .map((value) => (
                <option key={value}>{value}</option>
              ))}
          </select>
        </label>
        <label>
          Private activity note
          <textarea name="note" maxLength={500} />
        </label>
        <label className="admin-checkbox">
          <input type="checkbox" name="confirm" required />
          <span>I confirm this request status update.</span>
        </label>
        <button className="admin-button">Update request status</button>
      </fieldset>
      <p role="status">{message}</p>
    </form>
  );
}
