import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { storefrontConfig } from "../storefront/config";
export const guestCookie = "murad-order-guest";
export const orderHeaders = {
  "Cache-Control": "private, no-store, max-age=0",
  "CDN-Cache-Control": "no-store",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
};
export function orderConfig(
  env: Record<string, string | undefined> = process.env,
) {
  const catalog = storefrontConfig(env);
  if (env.ORDER_REQUESTS_ENABLED !== "true" || !catalog || catalog.production || !catalog.shoppingEnabled)
    return null;
  const secret = env.ORDER_GATEWAY_SECRET || "",
    keyId = env.ORDER_GATEWAY_KEY_ID || "";
  if (!/^[a-f0-9]{64,128}$/.test(secret) || !/^[a-z0-9-]{1,40}$/.test(keyId))
    throw Error("Order gateway configuration unavailable");
  return {
    ...catalog,
    secret,
    keyId,
    secure: catalog.origin.startsWith("https:"),
  };
}
export const hmac = (message: string, secret: string) =>
  createHmac("sha256", secret).update(message).digest("hex");
function equal(a: string, b: string) {
  return (
    a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b))
  );
}
export function createGuest(
  secret: string,
  now = Math.floor(Date.now() / 1000),
) {
  const value = `${randomBytes(32).toString("hex")}.${now}`;
  return `${value}.${hmac("guest:" + value, secret)}`;
}
export function validGuest(
  cookie: string | undefined,
  secret: string,
  now = Math.floor(Date.now() / 1000),
) {
  if (!cookie || !/^[a-f0-9]{64}\.\d{10}\.[a-f0-9]{64}$/.test(cookie))
    return false;
  const [nonce, time, signature] = cookie.split(".");
  return (
    Number(time) <= now + 30 &&
    now - Number(time) <= 86400 &&
    equal(signature, hmac(`guest:${nonce}.${time}`, secret))
  );
}
export const guestHash = (cookie: string, secret: string) =>
  hmac("session:" + cookie, secret);
export const csrfFor = (cookie: string, secret: string) =>
  hmac("csrf:" + cookie, secret);
export function challengeFor(
  cookie: string,
  secret: string,
  now = Math.floor(Date.now() / 1000),
) {
  return `${now}.${hmac(`challenge:${guestHash(cookie, secret)}:${now}`, secret)}`;
}
export function validChallenge(
  challenge: string,
  cookie: string,
  secret: string,
  now = Math.floor(Date.now() / 1000),
) {
  const [time, signature] = challenge.split(".");
  return (
    /^\d{10}$/.test(time || "") &&
    /^[a-f0-9]{64}$/.test(signature || "") &&
    now - Number(time) >= 2 &&
    now - Number(time) <= 1800 &&
    equal(
      signature,
      hmac(`challenge:${guestHash(cookie, secret)}:${time}`, secret),
    )
  );
}
export function signedEnvelope(
  config: NonNullable<ReturnType<typeof orderConfig>>,
  cookie: string,
  action: "submit" | "receipt",
  request: unknown,
  phone = "",
  ip = "",
) {
  const envelope = JSON.stringify({
    key_id: config.keyId,
    origin: config.origin,
    issued_at: Math.floor(Date.now() / 1000),
    guest_hash: guestHash(cookie, config.secret),
    contact_hash: phone ? hmac("contact:" + phone, config.secret) : "",
    ip_hash: ip ? hmac("ip:" + ip, config.secret) : "",
    action,
    request,
  });
  return { p_envelope: envelope, p_signature: hmac(envelope, config.secret) };
}
export function trustedClientIp(
  headers: Headers,
  env: Record<string, string | undefined> = process.env,
) {
  if (env.ORDER_TRUSTED_IP_SOURCE === "vercel" && env.VERCEL === "1") {
    const value =
      headers.get("x-vercel-forwarded-for")?.split(",")[0].trim() || "";
    return /^[a-f0-9:.]{3,45}$/i.test(value) ? value : "";
  }
  return "";
}
