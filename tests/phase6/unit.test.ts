import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { requestSchema, normalizePhone } from "../../src/lib/orders/contracts";
import {
  createGuest,
  validGuest,
  challengeFor,
  validChallenge,
  csrfFor,
  orderConfig,
  signedEnvelope,
  trustedClientIp,
} from "../../src/lib/orders/security";
import { sanitizeEvent, analyticsPath } from "../../src/lib/analytics/events";
import { analyticsConfig } from "../../src/lib/analytics/config";
import { safeRoute, operationalEvent } from "../../src/lib/monitoring/events";
const secret = "a".repeat(64),
  env = {
    CATALOG_ENABLED: "true",
    CATALOG_ENVIRONMENT: "local",
    CATALOG_SUPABASE_URL: "http://127.0.0.1:54321",
    CATALOG_SUPABASE_PUBLISHABLE_KEY: "local-only",
    CATALOG_SITE_ORIGIN: "http://127.0.0.1:3100",
    ORDER_REQUESTS_ENABLED: "true",
    ORDER_GATEWAY_SECRET: secret,
    ORDER_GATEWAY_KEY_ID: "local-orders",
  };
const input = {
  idempotency_key: randomUUID(),
  customer_name: "Local guest",
  customer_phone: "0321-7165000",
  consent: true,
  intent: "order",
  items: [
    { product_id: randomUUID(), quantity: 2, order_token: "b".repeat(64) },
  ],
};
test("customer selection validates strictly and never accepts client prices/totals", () => {
  assert(requestSchema.safeParse(input).success);
  assert(!requestSchema.safeParse({ ...input, total: 1 }).success);
  assert(
    !requestSchema.safeParse({
      ...input,
      items: [{ ...input.items[0], price: 1 }],
    }).success,
  );
  assert(!requestSchema.safeParse({ ...input, consent: false }).success);
  assert(
    !requestSchema.safeParse({
      ...input,
      items: [{ ...input.items[0], quantity: 0 }],
    }).success,
  );
  assert.equal(normalizePhone("0321-7165000"), "+923217165000");
});
test("signed guest capabilities expire and cannot be forged", () => {
  const cookie = createGuest(secret, 1800000000);
  assert(validGuest(cookie, secret, 1800000100));
  assert(!validGuest(cookie + "x", secret, 1800000100));
  assert(!validGuest(cookie, secret, 1800090000));
  assert(!validGuest(cookie, "b".repeat(64), 1800000100));
  assert.notEqual(csrfFor(cookie, secret), secret);
});
test("form challenges enforce session binding and minimum/maximum elapsed time", () => {
  const a = createGuest(secret, 1800000000),
    b = createGuest(secret, 1800000000),
    challenge = challengeFor(a, secret, 1800000000);
  assert(!validChallenge(challenge, a, secret, 1800000001));
  assert(validChallenge(challenge, a, secret, 1800000003));
  assert(!validChallenge(challenge, b, secret, 1800000003));
  assert(!validChallenge(challenge, a, secret, 1800002000));
});
test("order integration requires explicit local config and never enables production", () => {
  assert.equal(orderConfig({}), null);
  assert(orderConfig(env));
  assert.throws(() => orderConfig({ ...env, ORDER_GATEWAY_SECRET: "weak" }));
  assert.equal(
    orderConfig({
      ...env,
      CATALOG_ENVIRONMENT: "production",
      CATALOG_SUPABASE_URL: "https://example.supabase.co",
      CATALOG_SITE_ORIGIN: "https://example.test",
    }),
    null,
  );
  const proof = signedEnvelope(
    orderConfig(env)!,
    createGuest(secret),
    "submit",
    input,
    input.customer_phone,
  );
  assert.equal(proof.p_signature.length, 64);
  assert(!proof.p_envelope.includes(secret));
});
test("untrusted forwarded IP headers are not used", () => {
  const headers = new Headers({
    "x-forwarded-for": "1.2.3.4",
    "x-vercel-forwarded-for": "1.2.3.4",
  });
  assert.equal(trustedClientIp(headers, {}), "");
  assert.equal(
    trustedClientIp(headers, {
      ORDER_TRUSTED_IP_SOURCE: "vercel",
      VERCEL: "1",
    }),
    "1.2.3.4",
  );
});
test("analytics accepts a closed event/parameter whitelist and cannot fire purchase", () => {
  assert.equal(sanitizeEvent("purchase", { phone: "+12025550123" }), null);
  const event = sanitizeEvent("order_request_submitted", {
    customer_phone: "+12025550123",
    customer_name: "PRIVATE",
    address: "PRIVATE",
    search_term: "PRIVATE",
    reference: "PRIVATE",
    item_count: 2,
    product_id: input.items[0].product_id,
  });
  assert.equal(event!.params.item_count, 2);
  assert(!JSON.stringify(event).includes("PRIVATE"));
  assert(!JSON.stringify(event).includes("12025550123"));
  assert.equal(analyticsPath("/admin/orders/private"), null);
  assert.equal(analyticsPath("/product/some-public-slug"), "/product/[slug]");
});
test("analytics defaults off and requires owner-supplied measurement ID", () => {
  assert.equal(analyticsConfig(env), null);
  assert.equal(analyticsConfig({ ...env, ANALYTICS_ENABLED: "true" }), null);
  assert(
    analyticsConfig({
      ...env,
      ANALYTICS_ENABLED: "true",
      GA4_MANUAL_EVENTS_ONLY_CONFIRMED: "true",
      GA4_MEASUREMENT_ID: "G-LOCALTEST6",
    }),
  );
  assert.equal(
    analyticsConfig({
      ...env,
      CATALOG_ENVIRONMENT: "production",
      CATALOG_SUPABASE_URL: "https://example.supabase.co",
      CATALOG_SITE_ORIGIN: "https://example.test",
      ANALYTICS_ENABLED: "true",
      GA4_MANUAL_EVENTS_ONLY_CONFIRMED: "true",
      GA4_MEASUREMENT_ID: "G-LOCALTEST6",
    }),
    null,
  );
});
test("operational logging redacts path IDs, queries and all error/customer payloads", () => {
  assert.equal(
    safeRoute("/admin/orders/reference?phone=PRIVATE"),
    "/admin/orders/[id]",
  );
  const previous = console.error;
  let logged = "";
  console.error = (value: string) => {
    logged = value;
  };
  try {
    operationalEvent("server_request_failure", {
      route: "/admin/orders/id?customer=PRIVATE",
      status: 500,
    });
    assert(!logged.includes("PRIVATE"));
    assert(!logged.includes("reference"));
  } finally {
    console.error = previous;
  }
});
