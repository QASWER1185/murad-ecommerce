export type OperationalCode =
  | "order_gateway_failure"
  | "order_submit_rejected"
  | "order_status_failure"
  | "server_request_failure"
  | "catalog_worker_failure"
  | "catalog_worker_partial"
  | "catalog_queue_alert"
  | "admin_mfa_rejected"
  | "admin_mfa_verified";
export function safeRoute(path: string) {
  const route = path.split("?")[0];
  if (route === "/api/internal/catalog-invalidations") return route;
  if (route.startsWith("/admin/mfa")) return "/admin/mfa";
  if (route.startsWith("/admin/orders")) return "/admin/orders/[id]";
  if (route.startsWith("/api/order-requests")) return "/api/order-requests";
  if (/^\/(product|category|brand)\//.test(route)) return "/catalog/[slug]";
  return "other";
}
// No Error.message/stack, request body, headers, URL parameters, phone, name or IP.
export function operationalEvent(
  code: OperationalCode,
  context: { route?: string; status?: number } = {},
) {
  console.error(
    JSON.stringify({
      event: code,
      route: safeRoute(context.route || ""),
      status: context.status || 500,
    }),
  );
}
