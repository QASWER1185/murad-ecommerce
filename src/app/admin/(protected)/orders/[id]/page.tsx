import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { adminPageSession } from "@/lib/admin/data";
import { csrfCookie } from "@/lib/admin/security";
import { idSchema } from "@/lib/admin/validation";
import { PageHeading } from "@/components/admin/shared";
import { OrderStatusForm } from "@/components/orders/AdminOrders";
import type { OrderDetail } from "@/lib/orders/contracts";
import { money } from "@/lib/storefront/query";
export default async function Order({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { client, actor } = await adminPageSession();
  if (actor.role !== "admin") notFound();
  const { id } = await params;
  if (!idSchema.safeParse(id).success) notFound();
  const result = await client.rpc("admin_order_request", { p_id: id });
  if (result.error) throw Error("Order request unavailable");
  if (!result.data) notFound();
  const order = result.data as OrderDetail;
  return (
    <>
      <Link href="/admin/orders" className="admin-back">
        ← Order requests
      </Link>
      <PageHeading
        title={order.reference}
        description={`${order.request_kind} request · ${order.request_status.replaceAll("_", " ")} · No payment or stock reservation`}
      />
      <div className="admin-editor-layout">
        <div>
          <section className="admin-card admin-form-card">
            <h2>Customer contact</h2>
            <p>{order.customer_name}</p>
            <a href={`tel:${order.customer_phone}`}>{order.customer_phone}</a>
            {order.customer_note && <p>{order.customer_note}</p>}
          </section>
          <section className="admin-card admin-form-card">
            <h2>Submitted product snapshot</h2>
            <p className="admin-help">
              Versioned at submission. Current catalog changes do not rewrite
              this history.
            </p>
            {order.items.map((item) => (
              <div
                key={item.id}
                style={{ padding: "16px 0", borderBottom: "1px solid #e1e7ed" }}
              >
                <h3>
                  {item.product_snapshot.name} × {item.quantity}
                </h3>
                <p>
                  Catalog version {item.product_version} · Snapshot version{" "}
                  {item.product_snapshot.snapshot_version}
                </p>
                <p>
                  {item.pricing_mode === "quotation"
                    ? "Quotation requested — no fixed price"
                    : `${money(item.unit_price!, item.currency)} each · ${money(item.line_subtotal!, item.currency)}`}
                </p>
                <p>
                  Availability at request:{" "}
                  {item.product_snapshot.availability.replaceAll("_", " ")}
                </p>
              </div>
            ))}
            {Object.entries(order.known_subtotals).map(([currency, amount]) => (
              <p key={currency}>
                <strong>
                  Known product subtotal: {money(amount, currency)}
                </strong>
              </p>
            ))}
            <p className="admin-help">
              Quotation items, delivery, taxes and any other charges are not
              calculated. These amounts are not payment or confirmed order
              totals.
            </p>
          </section>
          <section className="admin-card admin-form-card">
            <h2>Request history</h2>
            {order.history.map((event) => (
              <div
                key={event.id}
                style={{ padding: "14px 0", borderBottom: "1px solid #e1e7ed" }}
              >
                <strong>{event.to_status.replaceAll("_", " ")}</strong>
                <p>
                  Version {event.request_version} ·{" "}
                  {new Date(event.created_at).toLocaleString()}
                </p>
                {event.note && <p>{event.note}</p>}
              </div>
            ))}
          </section>
        </div>
        <aside>
          <OrderStatusForm
            key={order.version}
            order={order}
            csrf={(await cookies()).get(csrfCookie)?.value || ""}
          />
        </aside>
      </div>
    </>
  );
}
