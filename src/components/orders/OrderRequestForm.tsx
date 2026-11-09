"use client";
import { useEffect, useRef, useState } from "react";
import type { Product } from "@/lib/storefront/types";
import type { Receipt } from "@/lib/orders/contracts";
import { track, trackSubmitted } from "@/lib/analytics/events";
import { money, enquiry } from "@/lib/storefront/query";
import styles from "@/components/sanitary/SanitaryShop.module.css";
import "./orders.css";
type Preview = Product & { order_token: string };
type Session = { enabled: boolean; csrf?: string; challenge?: string };
const intentStorage = "murad-order-pending-v1";
export function OrderRequestForm({
  selection,
  main,
  defaultIntent = "order",
}: {
  selection: Record<string, number>;
  main: string;
  defaultIntent?: "order" | "quotation";
}) {
  const [session, setSession] = useState<Session | null>(null),
    [items, setItems] = useState<Preview[]>([]),
    [reviewedSelection, setReviewedSelection] = useState(""),
    [open, setOpen] = useState(false),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [receipt, setReceipt] = useState<Receipt | null>(null),
    [ready, setReady] = useState(false),
    [intent, setIntent] = useState<"order" | "quotation">(defaultIntent);
  const attempt = useRef<{ key: string; fingerprint: string } | null>(null);
  const signature = JSON.stringify(Object.entries(selection).sort());
  useEffect(() => {
    let active = true;
    fetch("/api/order-requests/session", { cache: "no-store" })
      .then((r) => r.json())
      .then((value) => {
        if (active) setSession(value);
      })
      .catch(() => {
        if (active) setSession({ enabled: false });
      });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    const timer = setTimeout(() => setReady(true), 2100);
    return () => clearTimeout(timer);
  }, [session?.challenge]);
  async function prepare() {
    setReady(false);
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/order-requests/session", {
        cache: "no-store",
      });
      const next: Session = await response.json();
      if (!next.enabled || !next.csrf)
        throw Error(
          "The request service is unavailable. WhatsApp contact remains available.",
        );
      setSession(next);
      const result = await fetch("/api/order-requests/preview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": next.csrf,
        },
        body: JSON.stringify({ ids: Object.keys(selection) }),
        cache: "no-store",
      });
      const data = await result.json();
      if (!result.ok) throw Error(data.error || "Unable to review selection.");
      setItems(data.items);
      setReviewedSelection(signature);
      const pending = sessionStorage.getItem(intentStorage);
      if (pending && /^[a-f0-9-]{36}$/i.test(pending)) {
        const found = await fetch(
          `/api/order-requests/receipt?key=${pending}`,
          { cache: "no-store" },
        );
        if (found.ok) {
          const recovered = await found.json();
          if (recovered.receipt) {
            setReceipt(recovered.receipt);
            sessionStorage.removeItem(intentStorage);
            attempt.current = null;
            return;
          }
        }
      }
      setReceipt(null);
      setOpen(true);
      track("begin_order_request", { item_count: data.items.length });
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to review selection.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session?.csrf || !session.challenge) return;
    setBusy(true);
    setMessage("");
    try {
      const data = new FormData(event.currentTarget);
      const body = {
        customer_name: String(data.get("customer_name") || ""),
        customer_phone: String(data.get("customer_phone") || ""),
        customer_note: String(data.get("customer_note") || ""),
        consent: data.get("consent") === "on",
        intent,
        items: items
          .map((p) => ({
            product_id: p.id,
            quantity: selection[p.id],
            order_token: p.order_token,
          }))
          .sort((a, b) => a.product_id.localeCompare(b.product_id)),
      };
      const fingerprint = JSON.stringify(body);
      if (!attempt.current || attempt.current.fingerprint !== fingerprint) {
        const pending = sessionStorage.getItem(intentStorage);
        attempt.current = { key: pending || crypto.randomUUID(), fingerprint };
        sessionStorage.setItem(intentStorage, attempt.current.key);
      }
      const response = await fetch("/api/order-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": session.csrf,
        },
        body: JSON.stringify({
          challenge: session.challenge,
          website: String(data.get("website") || ""),
          request: { ...body, idempotency_key: attempt.current.key },
        }),
        cache: "no-store",
      });
      const result = await response.json();
      if (!response.ok) throw Error(result.error || "Unable to save request.");
      setReceipt(result);
      sessionStorage.removeItem(intentStorage);
      trackSubmitted(attempt.current.key, items.length, result.kind);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to save request. Retry with the same details.",
      );
    } finally {
      setBusy(false);
    }
  }
  const complete =
    reviewedSelection === signature &&
    items.length === Object.keys(selection).length &&
    items.every((i) => i.availability !== "out_of_stock") &&
    items.length > 0;
  return (
    <section className="order-request-panel">
      {receipt ? (
        <div role="status">
          <h3>Request received</h3>
          <p>
            <strong>{receipt.reference}</strong>
          </p>
          <p>
            This is a request, not an accepted order, payment or reservation.
            Our team will confirm current rates and availability.
          </p>
          <a
            href={`${enquiry(undefined, main)}?text=${encodeURIComponent(`Please follow up on my ${receipt.kind === "order" ? "order" : "quotation"} request ${receipt.reference}.`)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Discuss this reference on WhatsApp
          </a>
          <p>
            <button
              type="button"
              onClick={() => {
                setReceipt(null);
                setOpen(false);
                attempt.current = null;
              }}
            >
              Start another request
            </button>
          </p>
        </div>
      ) : session?.enabled ? (
        <>
          <button
            type="button"
            className={styles.primary}
            disabled={busy}
            onClick={prepare}
          >
            Review &amp; save a request
          </button>
          {open && (
            <form
              onSubmit={submit}
              key={signature}
              className="order-request-form"
            >
              <h3>Order / quotation request</h3>
              <p>
                Review the current product information. Prices exclude any
                delivery or other charges; these have not been calculated. No
                payment or stock reservation takes place.
              </p>
              <ul>
                {items.map((p) => (
                  <li key={p.id}>
                    {p.name} × {selection[p.id]} —{" "}
                    {intent === "quotation" ||
                    p.sales_mode === "quotation" ||
                    p.price === null
                      ? "Request today’s rate"
                      : money(p.price, p.currency)}
                    {p.availability === "out_of_stock" ? " · Unavailable" : ""}
                  </li>
                ))}
              </ul>
              {!complete && (
                <p role="alert">
                  Remove unavailable products and refresh this review before
                  submitting.
                </p>
              )}
              <label>
                Request type
                <select
                  value={intent}
                  onChange={(e) =>
                    setIntent(e.target.value as "order" | "quotation")
                  }
                >
                  <option value="order">
                    Product selection / order request
                  </option>
                  <option value="quotation">
                    Request today’s rate / quotation
                  </option>
                </select>
              </label>
              <label>
                Your name
                <input
                  name="customer_name"
                  autoComplete="name"
                  required
                  minLength={2}
                  maxLength={100}
                />
              </label>
              <label>
                Contact / WhatsApp number
                <input
                  name="customer_phone"
                  type="tel"
                  autoComplete="tel"
                  required
                  maxLength={30}
                />
              </label>
              <label>
                Optional request note
                <textarea name="customer_note" maxLength={500} />
              </label>
              <label className="order-honeypot" aria-hidden="true">
                Website
                <input name="website" tabIndex={-1} autoComplete="off" />
              </label>
              <label className="order-contact-consent">
                <input name="consent" type="checkbox" required />I agree that M
                Murad Sons may use these contact details to respond to this
                request.
              </label>
              <p>
                Customer details are not sent to Google Analytics.{" "}
                <a href="/privacy" target="_blank" rel="noopener noreferrer">
                  Privacy &amp; analytics choices
                </a>
              </p>
              <div className="order-request-controls">
                <button type="button" onClick={prepare} disabled={busy}>
                  Refresh review
                </button>
                <button
                  type="submit"
                  className={styles.primary}
                  disabled={busy || !complete || !ready}
                >
                  {busy ? "Saving…" : "Submit request"}
                </button>
              </div>
            </form>
          )}
        </>
      ) : null}
      <p role="status">{message}</p>
    </section>
  );
}
