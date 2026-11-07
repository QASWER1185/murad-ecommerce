import { timingSafeEqual } from "node:crypto";
export const csrfCookie = "murad-admin-csrf";
export function validOrigin(headers: Headers, origin: string): boolean {
  return (
    headers.get("origin") === origin &&
    !["cross-site", "none"].includes(headers.get("sec-fetch-site") || "")
  );
}
export function validCsrf(cookie: string | undefined, field: unknown): boolean {
  return (
    typeof field === "string" &&
    !!cookie &&
    /^[a-f0-9]{64}$/.test(cookie) &&
    /^[a-f0-9]{64}$/.test(field) &&
    timingSafeEqual(Buffer.from(cookie), Buffer.from(field))
  );
}
export const privateHeaders = {
  "Cache-Control": "private, no-store, max-age=0",
  Pragma: "no-cache",
  Expires: "0",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
  "Referrer-Policy": "same-origin",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Content-Security-Policy":
    "frame-ancestors 'none'; form-action 'self'; base-uri 'self'; object-src 'none'",
};
