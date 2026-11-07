import { test } from "node:test";
import assert from "node:assert/strict";
import { readAdminConfig } from "../../src/lib/admin/config";
import { validCsrf, validOrigin } from "../../src/lib/admin/security";
import { productSchema } from "../../src/lib/admin/validation";
const env = {
  ADMIN_ENABLED: "true",
  ADMIN_ENVIRONMENT: "local",
  ADMIN_SUPABASE_URL: "http://127.0.0.1:54321",
  ADMIN_SITE_ORIGIN: "http://127.0.0.1:3100",
  ADMIN_SUPABASE_PUBLISHABLE_KEY: "test-publishable",
  ADMIN_RATE_LIMIT_SECRET: "x".repeat(32),
};
test("admin defaults disabled and never falls back to storefront production credentials", () => {
  assert.equal(
    readAdminConfig({ NEXT_PUBLIC_SUPABASE_URL: "https://production.example" }),
    null,
  );
  assert.equal(readAdminConfig(env)?.secure, false);
  assert.throws(() =>
    readAdminConfig({
      ...env,
      ADMIN_SUPABASE_URL: "https://production.example",
    }),
  );
  assert.throws(() =>
    readAdminConfig({
      ...env,
      ADMIN_SUPABASE_PUBLISHABLE_KEY: "sb_secret_privileged",
    }),
  );
  const jwt = `e30.${Buffer.from(JSON.stringify({ role: "service_role" })).toString("base64url")}.test`;
  assert.throws(() =>
    readAdminConfig({ ...env, ADMIN_SUPABASE_PUBLISHABLE_KEY: jwt }),
  );
  assert.throws(() =>
    readAdminConfig({ ...env, ADMIN_ENVIRONMENT: "production" }),
  );
  assert.throws(() =>
    readAdminConfig({
      ...env,
      ADMIN_SITE_ORIGIN: "http://127.0.0.1:3100/path",
    }),
  );
});
test("mutations require exact configured origin and a matching unpredictable CSRF token", () => {
  const origin = "https://admin.example";
  assert(
    validOrigin(
      new Headers({ origin, "sec-fetch-site": "same-origin" }),
      origin,
    ),
  );
  for (const value of [
    "",
    "https://evil.example",
    "https://admin.example.evil",
  ])
    assert(!validOrigin(new Headers({ origin: value }), origin));
  assert(
    !validOrigin(
      new Headers({ origin, "sec-fetch-site": "cross-site" }),
      origin,
    ),
  );
  assert(validCsrf("a".repeat(64), "a".repeat(64)));
  for (const v of [null, "", "a", "b".repeat(64), []])
    assert(!validCsrf("a".repeat(64), v));
});
const draft = {
  name: "Local draft",
  slug: "local-draft",
  sku: "",
  model: "",
  description: "",
  category_id: "",
  brand_id: "",
  price: "",
  currency: "PKR",
  sales_mode: "online",
  stock_status: "unknown",
  stock_quantity: "",
  specifications: "{}",
  seo_title: "",
  seo_description: "",
  canonical_path: "",
  product_type: "",
  finish: "",
};
test("a Draft needs neither prices, media, descriptions nor fabricated stock", () => {
  const result = productSchema.parse(draft);
  assert.equal(result.price, null);
  assert.equal(result.stock_status, "unknown");
  assert.equal(result.description, null);
  assert.equal(result.sku, null);
});
test("server product validation rejects malformed, misleading and oversized values", () => {
  for (const patch of [
    { name: "" },
    { slug: "Unstable / slug" },
    { price: "0" },
    { price: "-1" },
    { price: "NaN" },
    { price: "1.001" },
    { price: "1e4" },
    { category_id: "invalid" },
    { stock_quantity: "-1" },
    { specifications: "[]" },
    { specifications: '{"fake":123}' },
    { seo_title: "x".repeat(161) },
    { canonical_path: "https://evil.test" },
  ])
    assert(!productSchema.safeParse({ ...draft, ...patch }).success);
  const real = productSchema.parse({
    ...draft,
    price: "1200.50",
    stock_quantity: "0",
    specifications: '{"model":"verified later"}',
  });
  assert.equal(real.price, 1200.5);
  assert.equal(real.stock_quantity, 0);
});
