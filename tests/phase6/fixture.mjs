import { createHmac, randomBytes, randomUUID } from "node:crypto";
export function orderFixture(f, s) {
  const keyId = "local-orders",
    secret = randomBytes(32).toString("hex"),
    origin = "http://127.0.0.1:3100",
    q = f.literal;
  f.sql(
    `INSERT INTO app_private.order_gateway_keys(key_id,signing_secret,origin) VALUES('${keyId}','${secret}','${origin}');`,
  );
  const hash = (text) =>
    createHmac("sha256", secret).update(text).digest("hex");
  const envelope = (
    request,
    {
      guest = "local-guest",
      action = "submit",
      issued = Math.floor(Date.now() / 1000),
      ip = "",
    } = {},
  ) => {
    const text = JSON.stringify({
      key_id: keyId,
      origin,
      issued_at: issued,
      guest_hash: hash(guest),
      contact_hash: hash(request.customer_phone || ""),
      ip_hash: ip ? hash(ip) : "",
      action,
      request,
    });
    return { p_envelope: text, p_signature: hash(text) };
  };
  const preview = (ids) => s.rpc("catalog_order_preview", { p_ids: ids }, null);
  const body = (products = [s.products[0]], extra = {}) => ({
    idempotency_key: randomUUID(),
    customer_name: "Local guest fixture",
    customer_phone: "+12025550123",
    customer_note: "Synthetic isolated request",
    consent: true,
    intent: "order",
    items: preview(products.map((p) => p.id)).map((p) => ({
      product_id: p.id,
      quantity: 2,
      order_token: p.order_token,
    })),
    ...extra,
  });
  const sqlGateway = (args) =>
    `SELECT public.order_request_gateway(${q(args.p_envelope)},${q(args.p_signature)});`;
  const submit = (input, options = {}) =>
    s.rpc("order_request_gateway", envelope(input, options), null);
  const resetLimits = () => f.sql("TRUNCATE app_private.order_rate_windows;");
  return {
    secret,
    keyId,
    origin,
    hash,
    envelope,
    preview,
    body,
    sqlGateway,
    submit,
    resetLimits,
  };
}
