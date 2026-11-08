import test from "node:test";
import assert from "node:assert/strict";
import {
  storefrontConfig,
  productionReleaseApproved,
} from "../../src/lib/storefront/config";
import {
  parseQuery,
  queryString,
  canOrder,
} from "../../src/lib/storefront/query";
import {
  catalogMetadata,
  catalogSitemap,
} from "../../src/lib/seo/catalog-policy";
import {
  isIndexable,
  type PublicRoute,
} from "../../src/lib/catalog/publication";
const env = {
  CATALOG_ENABLED: "true",
  CATALOG_ENVIRONMENT: "local",
  CATALOG_SUPABASE_URL: "http://127.0.0.1:54321",
  CATALOG_SITE_ORIGIN: "http://127.0.0.1:3100",
  CATALOG_SUPABASE_PUBLISHABLE_KEY: "local-only",
  CATALOG_MEDIA_ENABLED: "true",
};
test("public configuration is independent of Admin and legacy production settings", () => {
  assert.equal(
    storefrontConfig({
      ADMIN_ENABLED: "true",
      NEXT_PUBLIC_SUPABASE_URL: "https://production.invalid",
    }),
    null,
  );
  assert.equal(storefrontConfig(env)?.mediaEnabled, true);
  assert.throws(
    () =>
      storefrontConfig({
        ...env,
        CATALOG_SUPABASE_URL: "https://production.invalid",
      }),
    /loopback|transport/,
  );
});
test("production media and indexing remain hard disabled despite environment opt-ins", () => {
  assert.equal(productionReleaseApproved, false);
  const config = storefrontConfig({
    ...env,
    CATALOG_ENVIRONMENT: "production",
    CATALOG_SUPABASE_URL: "https://example.supabase.co",
    CATALOG_SITE_ORIGIN: "https://example.test",
    CATALOG_INDEXING_ENABLED: "true",
  });
  assert.equal(config?.mediaEnabled, false);
  assert.equal(config?.indexingEnabled, false);
});
test("privileged and malformed keys/origins fail closed", () => {
  assert.throws(() =>
    storefrontConfig({
      ...env,
      CATALOG_SUPABASE_PUBLISHABLE_KEY: "sb_secret_fixture",
    }),
  );
  const role = Buffer.from(JSON.stringify({ role: "service_role" })).toString(
    "base64url",
  );
  assert.throws(() =>
    storefrontConfig({
      ...env,
      CATALOG_SUPABASE_PUBLISHABLE_KEY: `header.${role}.signature`,
    }),
  );
  assert.throws(() =>
    storefrontConfig({
      ...env,
      CATALOG_SITE_ORIGIN: "http://127.0.0.1:3100/private",
    }),
  );
});
test("bounded query parsing and reversible encoded pagination preserve filter values", () => {
  const q = parseQuery({
    brand: ["porta", "porta"],
    type: ["Wash Basins"],
    q: " test ",
    min: "0",
    max: "1e99",
    sort: "injection",
    page: "99999",
  });
  assert.deepEqual(q.brand, ["porta"]);
  assert.equal(q.max, "");
  assert.equal(q.sort, "name");
  assert.equal(q.page, 10000);
  const round = parseQuery(
    Object.fromEntries(new URLSearchParams(queryString(q, { page: 2 }))),
  );
  assert.equal(round.q, "test");
  assert.equal(round.page, 2);
  assert.equal(round.type[0], "Wash Basins");
});
test("price optional, unknown availability and quotation commerce decisions are explicit", () => {
  assert.equal(
    canOrder({ price: null, sales_mode: "online", availability: "unknown" }),
    false,
  );
  assert.equal(
    canOrder({ price: 100, sales_mode: "quotation", availability: "in_stock" }),
    false,
  );
  assert.equal(
    canOrder({
      price: 100,
      sales_mode: "online",
      availability: "out_of_stock",
    }),
    false,
  );
  assert.equal(
    canOrder({ price: 100, sales_mode: "online", availability: "unknown" }),
    true,
  );
});
test("metadata and sitemap share eligibility, canonical and environment restrictions", () => {
  const route: PublicRoute = {
    id: "test",
    kind: "product",
    name: "Fixture",
    slug: "fixture",
    canonical_path: "/product/fixture",
    seo_title: "Fixture title",
    seo_description: "Fixture useful description",
    is_indexable: true,
    updated_at: "2026-11-08",
  };
  const disabled = { production: false, indexingEnabled: false };
  assert.equal(isIndexable(route, disabled), false);
  assert.equal(
    catalogSitemap([route], "https://example.test", disabled).length,
    0,
  );
  assert.equal(
    catalogMetadata(route, "https://example.test", disabled).robots.index,
    false,
  );
  assert.equal(
    catalogSitemap([route], "https://example.test", {
      production: true,
      indexingEnabled: true,
    }).length,
    1,
  );
  assert.equal(
    isIndexable(route, {
      production: true,
      indexingEnabled: true,
      searchOrFilter: true,
    }),
    false,
  );
  assert.equal(
    catalogMetadata(route, "https://example.test").alternates.canonical,
    "https://example.test/product/fixture",
  );
});
