import assert from "node:assert/strict";
export async function databaseTests(f, s) {
  let count = 0;
  const check = (v, message) => {
    assert(v, message);
    count++;
  };
  const snapshot = (kind = "category", slug = "sanitary", query = {}) =>
    s.rpc(
      "catalog_storefront",
      { p_kind: kind, p_slug: slug, p_query: query },
      null,
    );
  check(snapshot().total === 15, "child categories included");
  check(snapshot().products.length === 12, "bounded pagination");
  check(
    snapshot("category", "sanitary", { page: 2 }).products.length === 3,
    "second page",
  );
  check(
    snapshot("category", "sanitary", { q: "TEST-0001" }).total === 1,
    "model search",
  );
  check(
    snapshot("category", "sanitary", {
      brand: ["porta"],
      type: ["Commodes"],
      finish: "White",
    }).total === 8,
    "combined matching",
  );
  check(
    snapshot("category", "sanitary", { availability: "in_stock" }).total === 1,
    "verified stock filter",
  );
  const low = snapshot("category", "sanitary", { sort: "price-low" }).products;
  check(Number(low[0].price) === 100, "numeric price ordering");
  check(
    snapshot("category", "sanitary", { min: "500", max: "900" }).total === 5,
    "price range",
  );
  const unpriced = snapshot("product", "local-fixture-2").entity;
  check(
    unpriced.price === null && unpriced.availability === "unknown",
    "no inferred price or stock",
  );
  const quote = snapshot("product", "local-fixture-16").entity;
  check(
    quote.price === null && quote.sales_mode === "quotation",
    "category quotation overrides fixed price",
  );
  check(
    !JSON.stringify(snapshot("search", "")).includes("PRIVATE"),
    "no private authoring sentinels",
  );
  check(
    snapshot("product", "private-draft-sentinel").entity === null,
    "draft detail hidden",
  );
  check(
    snapshot("product", "private-parent-sentinel").entity === null,
    "unpublished brand hides product",
  );
  for (const table of [
    "products",
    "brands",
    "categories",
    "product_revisions",
    "catalog_media",
  ]) {
    assert.throws(
      () => f.sql(f.as(null, `SELECT * FROM public.${table};`)),
      /permission denied/,
    );
    count++;
  }
  for (const role of [null, "ordinary", "editor"]) {
    assert.throws(
      () => s.rpc("claim_catalog_invalidations", { p_limit: 1 }, role),
      /permission denied|administrator required/,
    );
    count++;
  }
  assert.throws(
    () => s.rpc("claim_catalog_invalidations", { p_limit: null }),
    /Bounded/,
  );
  count++;
  const first = s.rpc("claim_catalog_invalidations", { p_limit: 3 });
  const next = s.rpc("claim_catalog_invalidations", { p_limit: 3 });
  check(
    !first.some((a) => next.some((b) => a.id === b.id)),
    "concurrent workers receive separate leases",
  );
  check(
    s.rpc("finish_catalog_invalidation", {
      p_id: first[0].id,
      p_token: next[0].token,
    }) === false,
    "wrong token cannot ack",
  );
  const before = snapshot().generation;
  const concurrent = s.save({
    name: "New concurrent Draft",
    slug: "new-concurrent-draft",
    sku: "CONCURRENT-P5",
  });
  check(
    !!concurrent.id && snapshot().generation !== before,
    "new event advances generation",
  );
  check(
    s.rpc("finish_catalog_invalidation", {
      p_id: first[0].id,
      p_token: first[0].token,
    }) === true,
    "matching ack",
  );
  check(
    s.rpc("finish_catalog_invalidation", {
      p_id: first[0].id,
      p_token: first[0].token,
    }) === false,
    "duplicate ack safe",
  );
  const pending = f.sql(
    `SELECT count(*) FROM app_private.invalidation_events WHERE processed_at IS NULL;`,
  );
  check(Number(pending) > 0, "ack does not erase later events");
  s.rpc("finish_catalog_invalidation", {
    p_id: next[0].id,
    p_token: next[0].token,
    p_error: "Synthetic failure",
  });
  check(
    f.sql(
      `SELECT processed_at IS NULL AND last_error='Synthetic failure' FROM app_private.invalidation_events WHERE id=${next[0].id};`,
    ) === "t",
    "failure remains pending",
  );
  f.sql(
    `UPDATE app_private.invalidation_events SET lease_until=now()-interval '1 second' WHERE id=${next[0].id};`,
  );
  check(
    s
      .rpc("claim_catalog_invalidations", { p_limit: 50 })
      .some((e) => e.id === next[0].id),
    "failure recovers after lease",
  );
  const product = s.products[0],
    media = product.media;
  check(
    s.rpc("catalog_public_media", { p_id: media, p_variant: "640" }, null) !==
      null,
    "published derivative",
  );
  check(
    s.rpc(
      "catalog_public_media",
      { p_id: media, p_variant: "original" },
      null,
    ) === null,
    "private original",
  );
  s.rpc("return_catalog_to_draft", {
    kind: "brand",
    entity_id: s.brands.porta,
    expected_version: s.version("brands", s.brands.porta),
  });
  check(
    snapshot("product", "local-fixture-1").entity === null,
    "brand withdrawal hides product",
  );
  check(
    s.rpc("catalog_public_media", { p_id: media, p_variant: "640" }, null) ===
      null,
    "brand withdrawal closes media",
  );
  s.publish("brand", s.brands.porta);
  s.rpc("return_catalog_to_draft", {
    kind: "category",
    entity_id: s.categories.sanitary,
    expected_version: s.version("categories", s.categories.sanitary),
  });
  check(
    snapshot("product", "local-fixture-1").entity === null,
    "category withdrawal hides product",
  );
  check(snapshot().entity === null, "category route withdrawn");
  check(
    snapshot("category", "local-commodes").entity === null,
    "withdrawn ancestor hides child category",
  );
  check(
    snapshot("product", "local-fixture-15").entity === null,
    "withdrawn ancestor hides child product",
  );
  s.publish("category", s.categories.sanitary);
  s.rpc("rename_catalog_slug", {
    kind: "product",
    entity_id: product.id,
    expected_version: s.version("products", product.id),
    new_slug: "renamed-local-fixture",
  });
  check(
    snapshot("product", "local-fixture-1").entity === null,
    "old product slug gone",
  );
  check(
    snapshot("product", "renamed-local-fixture").entity !== null,
    "new permanent slug visible",
  );
  check(
    f.sql(
      "SET ROLE anon; SELECT destination_path FROM public.catalog_redirects_public WHERE source_path='/product/local-fixture-1';",
    ) === "/product/renamed-local-fixture",
    "redirect points only to public target",
  );
  s.rpc("return_catalog_to_draft", {
    kind: "product",
    entity_id: product.id,
    expected_version: s.version("products", product.id),
  });
  check(
    f.sql(
      "SET ROLE anon; SELECT count(*) FROM public.catalog_redirects_public WHERE source_path='/product/local-fixture-1';",
    ) === "0",
    "withdrawal removes redirect",
  );
  s.publish("product", product.id, { price: true });
  check(
    Number(
      f.sql(
        "SELECT count(*) FROM public.products WHERE sku IS NULL AND publication_status='published';",
      ),
    ) === 0,
    "legacy samples never published",
  );
  const quoteChild = s.taxonomy(
    "category",
    "local-materials",
    "Local materials",
    { parent_id: s.categories["building-material"] },
  );
  const qp = s.save({
    name: "Local quotation child fixture",
    slug: "local-quotation-child",
    sku: "LOCAL-QUOTE-CHILD",
    description: "Synthetic isolated inherited quotation fixture.",
    category_id: quoteChild,
    price: 999,
  });
  s.publish("product", qp.id, { price: true });
  check(
    snapshot("product", "local-quotation-child").entity.price === null,
    "quotation inherited from ancestor",
  );
  check(
    snapshot("product", "local-quotation-child").entity.sales_mode ===
      "quotation",
    "inherited quotation sales mode",
  );
  for (const role of [null, "ordinary", "editor"]) {
    assert.throws(
      () =>
        s.rpc(
          "set_catalog_product_featured",
          {
            p_id: s.draft.id,
            p_version: s.version("products", s.draft.id),
            p_featured: true,
          },
          role,
        ),
      /permission denied|administrator required/,
    );
    count++;
  }
  assert.throws(
    () =>
      s.rpc("set_catalog_product_featured", {
        p_id: s.products[1].id,
        p_version: s.version("products", s.products[1].id),
        p_featured: true,
      }),
    /active Draft/,
  );
  count++;
  console.log(
    `Phase 5 PostgreSQL: ${count} public-view, publication, filtering, lease and withdrawal assertions passed.`,
  );
  return count;
}
