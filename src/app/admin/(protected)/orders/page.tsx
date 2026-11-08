import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { adminPageSession } from "@/lib/admin/data";
import { csrfCookie } from "@/lib/admin/security";
import { PageHeading } from "@/components/admin/shared";
import { AdminOrders } from "@/components/orders/AdminOrders";
import type { OrderRows } from "@/lib/orders/contracts";
export default async function Orders() {
  const { client, actor } = await adminPageSession();
  if (actor.role !== "admin") notFound();
  const result = await client.rpc("admin_order_requests", { p_filters: {} });
  if (result.error) throw Error("Order requests unavailable");
  return (
    <>
      <PageHeading
        title="Order & quotation requests"
        description="Review customer selections, current request status and private activity history."
      />
      <AdminOrders
        initial={result.data as OrderRows}
        csrf={(await cookies()).get(csrfCookie)?.value || ""}
      />
    </>
  );
}
