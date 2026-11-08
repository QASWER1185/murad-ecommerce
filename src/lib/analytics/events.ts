export const eventNames = [
  "view_item",
  "select_item",
  "add_to_cart",
  "remove_from_cart",
  "begin_order_request",
  "order_request_submitted",
  "whatsapp_click",
  "quotation_request",
  "search",
] as const;
export type AnalyticsEvent = (typeof eventNames)[number];
export type AnalyticsParams = {
  product_id?: string;
  quantity?: number;
  item_count?: number;
  result_count?: number;
  query_length_bucket?: "empty" | "short" | "medium" | "long";
  contact?: "main" | "secondary" | "other";
};
declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    __muradAnalyticsAllowed?: boolean;
  }
  interface Navigator {
    globalPrivacyControl?: boolean;
  }
}
export function privateSignal() {
  return (
    typeof navigator !== "undefined" &&
    (navigator.globalPrivacyControl === true || navigator.doNotTrack === "1")
  );
}
export function analyticsPath(path: string) {
  if (path === "/") return "/";
  if (/^\/(category|brand|product)\/[a-z0-9-]+$/.test(path))
    return "/" + path.split("/")[1] + "/[slug]";
  return ["/search", "/categories", "/brands", "/privacy"].includes(path)
    ? path
    : null;
}
export function sanitizeEvent(name: string, raw: Record<string, unknown> = {}) {
  if (!(eventNames as readonly string[]).includes(name)) return null;
  const params: Record<string, string | number> = {};
  if (
    typeof raw.product_id === "string" &&
    /^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(raw.product_id)
  )
    params.product_id = raw.product_id;
  for (const key of ["quantity", "item_count", "result_count"]) {
    const value = raw[key];
    if (
      typeof value === "number" &&
      Number.isInteger(value) &&
      value >= 0 &&
      value <= 100000
    )
      params[key] = value;
  }
  if (
    ["empty", "short", "medium", "long"].includes(
      String(raw.query_length_bucket),
    )
  )
    params.query_length_bucket = String(raw.query_length_bucket);
  if (["main", "secondary", "other"].includes(String(raw.contact)))
    params.contact = String(raw.contact);
  return { name, params };
}
export function track(name: AnalyticsEvent, raw: AnalyticsParams = {}) {
  if (
    typeof window === "undefined" ||
    !window.__muradAnalyticsAllowed ||
    privateSignal() ||
    !window.gtag
  )
    return false;
  const path = analyticsPath(window.location.pathname),
    event = sanitizeEvent(name, raw);
  if (!path || !event) return false;
  window.gtag("event", event.name, {
    ...event.params,
    page_location: window.location.origin + path,
    page_title: "M Murad Sons Storefront",
    page_referrer: "",
  });
  return true;
}
export function trackSubmitted(key: string, count: number, kind: string) {
  try {
    const storageKey = "murad-request-event-" + key;
    if (sessionStorage.getItem(storageKey)) return;
    sessionStorage.setItem(storageKey, "1");
    track("order_request_submitted", { item_count: count });
    if (kind !== "order") track("quotation_request", { item_count: count });
  } catch {
    /* No analytics persistence is required to submit a request. */
  }
}
