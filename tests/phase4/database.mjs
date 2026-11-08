import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { normalizeImportRow } from "../../work/phase4-tests/src/lib/imports/normalize.js";
export async function runDatabaseTests(f) {
  const { sql, as, literal: q } = f;
  let checks = 0;
  const ok = (query, value) => {
    assert.equal(sql(query), String(value), query);
    checks++;
  };
  const denied = (query, pattern) => {
    assert.throws(() => sql(query), pattern);
    checks++;
  };
  const rpc = (name, args = {}, role = "admin") =>
    JSON.parse(
      sql(
        as(
          role,
          `SELECT coalesce(to_jsonb(public.${name}(${Object.entries(args)
            .map(([k, v]) => `${k}=>${q(v)}`)
            .join(",")}))::text,'null');`,
        ),
      ) || "null",
    );
  const version = (table, id) =>
    Number(sql(`SELECT version FROM public.${table} WHERE id=${q(id)};`));
  const save = (input, id = null, v = null) =>
    rpc("save_product_draft", { product_id: id, expected_version: v, input });
  function publish(kind, table, id, index = false) {
    const v = version(table, id);
    rpc("submit_catalog_review", { kind, entity_id: id, expected_version: v });
    rpc("review_catalog_entity", {
      kind,
      entity_id: id,
      expected_version: v,
      verification: { identity: true, content: true },
    });
    rpc("publish_catalog_entity", {
      kind,
      entity_id: id,
      expected_version: v,
      approve_indexing: index,
    });
  }
  function register(previous = null, placeholder = false) {
    const id = randomUUID();
    const original = `media/${id}/original.png`;
    const variants = ["320", "640", "1280"].map((key) => ({
      variant_key: key,
      object_name: `media/${id}/${key}.webp`,
      width: 100,
      height: 100,
      byte_size: 100,
      sha256: "b".repeat(64),
    }));
    for (const name of [original, ...variants.map((v) => v.object_name)])
      sql(
        as(
          "admin",
          `INSERT INTO storage.objects(bucket_id,name) VALUES('catalog-private',${q(name)});`,
        ),
      );
    const manifest = {
      object_name: original,
      mime_type: "image/png",
      alt_text: "Synthetic local privacy-test image",
      width: 100,
      height: 100,
      is_placeholder: placeholder,
      original_filename: "local-fixture.png",
      sha256: "a".repeat(64),
      byte_size: 100,
      previous_media_id: previous,
      variants,
    };
    rpc("register_catalog_media", { p_id: id, p_manifest: manifest });
    return { id, original, variants };
  }
  const p = save({
    name: "Local Phase 4 product",
    slug: "local-phase4-product",
    sku: "P4-LOCAL",
    description: "Synthetic local content used only for authorization testing.",
    seo_title: "Local Phase 4 test",
    seo_description: "Synthetic local metadata.",
    specifications: {},
  });
  denied(
    as(
      "ordinary",
      `SELECT public.register_catalog_media(gen_random_uuid(),'{}');`,
    ),
    /administrator required/,
  );
  denied(
    as(
      "editor",
      `SELECT public.edit_catalog_gallery(${q(p.id)},${version("products", p.id)},'remove','{}');`,
    ),
    /administrator required/,
  );
  denied(
    as(
      "admin",
      `INSERT INTO public.catalog_media(object_name,mime_type) VALUES('bypass.png','image/png');`,
    ),
    /permission denied/,
  );
  const first = register();
  const second = register(first.id);
  const placeholder = register(null, true);
  denied(
    as("admin", `SELECT public.verify_catalog_media(${q(placeholder.id)});`),
    /genuine/,
  );
  rpc("verify_catalog_media", { media_id: first.id });
  rpc("verify_catalog_media", { media_id: second.id });
  rpc("edit_catalog_gallery", {
    p_product_id: p.id,
    p_version: version("products", p.id),
    p_operation: "attach",
    p_input: { media_id: first.id },
  });
  rpc("edit_catalog_gallery", {
    p_product_id: p.id,
    p_version: version("products", p.id),
    p_operation: "attach",
    p_input: { media_id: second.id },
  });
  const images = JSON.parse(
    sql(
      `SELECT jsonb_agg(t ORDER BY sort_order) FROM public.product_images t WHERE product_id=${q(p.id)} AND archived_at IS NULL;`,
    ),
  );
  denied(
    as(
      "admin",
      `SELECT public.edit_catalog_gallery(${q(p.id)},0,'reorder',${q({ image_ids: images.map((i) => i.id) })});`,
    ),
    /Stale/,
  );
  denied(
    as(
      "admin",
      `SELECT public.edit_catalog_gallery(${q(p.id)},${version("products", p.id)},'reorder',${q({ image_ids: [images[0].id, images[0].id] })});`,
    ),
    /exact permutation/,
  );
  rpc("edit_catalog_gallery", {
    p_product_id: p.id,
    p_version: version("products", p.id),
    p_operation: "reorder",
    p_input: { image_ids: [images[1].id, images[0].id] },
  });
  ok(
    `SELECT media_id FROM public.product_images WHERE product_id=${q(p.id)} AND sort_order=0;`,
    second.id,
  );
  rpc("edit_catalog_gallery", {
    p_product_id: p.id,
    p_version: version("products", p.id),
    p_operation: "remove",
    p_input: { image_id: images[0].id },
  });
  ok(
    `SELECT archived_at IS NOT NULL FROM public.product_images WHERE id=${q(images[0].id)};`,
    "t",
  );
  rpc("edit_catalog_gallery", {
    p_product_id: p.id,
    p_version: version("products", p.id),
    p_operation: "attach",
    p_input: { media_id: first.id },
  });
  ok(
    `SELECT count(*) FROM public.product_images WHERE product_id=${q(p.id)} AND archived_at IS NULL;`,
    2,
  );
  ok(
    `SET ROLE anon; SELECT count(*) FROM storage.objects WHERE bucket_id='catalog-private' AND name=${q(first.original)};`,
    0,
  );
  assert.equal(
    rpc("catalog_public_media", { p_id: first.id, p_variant: "640" }, null),
    null,
  );
  checks++;
  const category = rpc("save_catalog_taxonomy", {
    p_kind: "category",
    p_id: null,
    p_version: null,
    p_input: {
      name: "Local Phase 4 category",
      slug: "local-phase4-category",
      description: "Synthetic local category information.",
      seo_title: "Local test category",
      seo_description: "Local test category metadata.",
    },
  });
  publish("category", "categories", category, true);
  save(
    {
      name: "Local Phase 4 product",
      slug: "local-phase4-product",
      sku: "P4-LOCAL",
      description: "Synthetic local test content.",
      category_id: category,
      seo_title: "Local test product",
      seo_description: "Local test product metadata.",
      specifications: {},
    },
    p.id,
    version("products", p.id),
  );
  publish("product", "products", p.id, true);
  ok(
    `SET ROLE anon; SELECT is_indexable FROM public.catalog_products_public WHERE id=${q(p.id)};`,
    "t",
  );
  ok(
    `SET ROLE anon; SELECT count(*) FROM storage.objects WHERE bucket_id='catalog-private' AND name=${q(first.variants[1].object_name)};`,
    1,
  );
  ok(
    `SET ROLE anon; SELECT count(*) FROM storage.objects WHERE bucket_id='catalog-private' AND name=${q(first.original)};`,
    0,
  );
  assert(
    rpc("catalog_public_media", { p_id: first.id, p_variant: "640" }, null),
  );
  checks++;
  rpc("return_catalog_to_draft", {
    kind: "product",
    entity_id: p.id,
    expected_version: version("products", p.id),
  });
  assert.equal(
    rpc("catalog_public_media", { p_id: first.id, p_variant: "640" }, null),
    null,
  );
  checks++;
  ok(
    `SET ROLE anon; SELECT count(*) FROM storage.objects WHERE bucket_id='catalog-private' AND name=${q(first.variants[1].object_name)};`,
    0,
  );
  ok(
    `SELECT count(*)>0 FROM app_private.audit_log WHERE entity_id=${q(p.id)} AND action='gallery_reorder';`,
    "t",
  );
  const brand = rpc("save_catalog_taxonomy", {
    p_kind: "brand",
    p_id: null,
    p_version: null,
    p_input: {
      name: "Local Phase 4 brand",
      slug: "local-phase4-brand",
      description: "Synthetic manufacturer information.",
    },
  });
  denied(
    as(
      "editor",
      `SELECT public.save_catalog_taxonomy('brand',NULL,NULL,'{}');`,
    ),
    /administrator required/,
  );
  rpc("attach_catalog_asset", {
    p_kind: "brand",
    p_id: brand,
    p_version: version("brands", brand),
    p_media_id: first.id,
  });
  rpc("save_catalog_asset_alt", {
    p_kind: "brand",
    p_id: brand,
    p_version: version("brands", brand),
    p_alt: "Accurate local logo alt override",
  });
  ok(
    `SELECT logo_alt_override FROM public.brands WHERE id=${q(brand)};`,
    "Accurate local logo alt override",
  );
  publish("brand", "brands", brand);
  assert(
    rpc("catalog_public_media", { p_id: first.id, p_variant: "320" }, null),
  );
  checks++;
  rpc("return_catalog_to_draft", {
    kind: "brand",
    entity_id: brand,
    expected_version: version("brands", brand),
  });
  const banner = rpc("save_catalog_banner", {
    p_id: null,
    p_version: null,
    p_input: { title: "Local banner fixture", cta_path: "/category/sanitary" },
  });
  denied(
    as(
      "admin",
      `SELECT public.set_catalog_banner_active(${q(banner)},1,true);`,
    ),
    /verified genuine/,
  );
  rpc("attach_catalog_asset", {
    p_kind: "banner",
    p_id: banner,
    p_version: version("homepage_banners", banner),
    p_media_id: first.id,
  });
  rpc("set_catalog_banner_active", {
    p_id: banner,
    p_version: version("homepage_banners", banner),
    p_active: true,
  });
  ok("SET ROLE anon; SELECT count(*) FROM public.catalog_banners_public;", 1);
  rpc("save_catalog_banner", {
    p_id: banner,
    p_version: version("homepage_banners", banner),
    p_input: { title: "Revised local banner fixture" },
  });
  ok("SET ROLE anon; SELECT count(*) FROM public.catalog_banners_public;", 0);
  assert.equal(
    rpc("catalog_public_media", { p_id: first.id, p_variant: "320" }, null),
    null,
  );
  checks++;
  rpc("save_catalog_settings", {
    p_version: null,
    p_input: {
      business_name: "M Murad Sons Building Material Store",
      street_address: "Adda Plot, Al Kabir Town, Raiwind Road",
      city: "Lahore",
      country_code: "PK",
      main_whatsapp: "+923217165000",
      secondary_whatsapp: "+923086235608",
    },
    p_approve_public: true,
  });
  ok(
    "SET ROLE anon; SELECT main_whatsapp FROM public.catalog_settings_public;",
    "+923217165000",
  );
  denied(
    as(
      "admin",
      `UPDATE public.site_settings SET main_whatsapp='+923000000000';`,
    ),
    /permission denied/,
  );
  denied(
    as("admin", `SELECT public.save_catalog_settings(0,'{}',true);`),
    /Verified business|Stale/,
  );

  function stage(rows, headers, mapping, mode = "draft_import", clear = false) {
    const id = randomUUID();
    sql(
      as(
        "admin",
        `INSERT INTO storage.objects(bucket_id,name) VALUES('catalog-imports',${q(`imports/${id}/source.csv`)});`,
      ),
    );
    let j = rpc("begin_catalog_import", {
      p_id: id,
      p_name: "synthetic-local.csv",
      p_sha: "c".repeat(64),
      p_format: "csv",
      p_headers: headers,
      p_total: rows.length,
    });
    for (let n = 0; n < rows.length; n += 250)
      j = rpc("stage_catalog_import_source", {
        p_id: id,
        p_start: n + 1,
        p_rows: rows.slice(n, n + 250).map((cells) => ({ cells, errors: [] })),
      });
    j = rpc("configure_catalog_import", {
      p_id: id,
      p_version: j.version,
      p_mapping: mapping,
      p_mode: mode,
      p_clear_blanks: clear,
    });
    return prepare(j);
  }
  function prepare(j) {
    while (j.status === "validating") {
      const b = rpc("catalog_import_source_batch", { p_id: j.id });
      j = rpc("stage_catalog_import_preview", {
        p_id: j.id,
        p_version: b.job.version,
        p_start: b.job.prepared_rows + 1,
        p_rows: b.rows.map((row) =>
          normalizeImportRow(row, b.job.column_mapping, b.job.clear_blanks),
        ),
      });
    }
    return j;
  }
  function start(j, prices = false, skip = false) {
    return rpc("start_catalog_import", {
      p_id: j.id,
      p_version: j.version,
      p_confirm: true,
      p_confirm_prices: prices,
      p_skip_errors: skip,
    });
  }
  function finish(j) {
    while (j.status === "processing")
      j = rpc("process_catalog_import_batch", { p_id: j.id, p_limit: 50 });
    return j;
  }
  const duplicate = stage(
    [
      ["dup-1", "First"],
      ["ＤＵＰ-1", "Second"],
    ],
    ["sku", "name"],
    { sku: 0, name: 1 },
  );
  assert.equal(duplicate.summary.errors, 2);
  checks++;
  denied(
    as(
      "admin",
      `SELECT public.start_catalog_import(${q(duplicate.id)},${duplicate.version},true,false,false);`,
    ),
    /confirmation/,
  );
  const duplicateDone = finish(start(duplicate, false, true));
  assert.equal(duplicateDone.summary.applied, 0);
  checks++;
  const existing = save({
    name: "Blank preservation fixture",
    slug: "blank-preservation-fixture",
    sku: "BLANK-1",
    model: "KEEP-EXACT",
    description: "Keep the existing description.",
    price: 1250,
    specifications: {},
  });
  const preserve = stage([["blank-1", "", ""]], ["sku", "model", "price"], {
    sku: 0,
    model: 1,
    price: 2,
  });
  finish(start(preserve));
  ok(
    `SELECT model||':'||price::text FROM public.products WHERE id=${q(existing.id)};`,
    "KEEP-EXACT:1250.00",
  );
  const prices = stage(
    [["blank-1", "1500"]],
    ["sku", "price"],
    { sku: 0, price: 1 },
    "price_update",
  );
  denied(
    as(
      "admin",
      `SELECT public.start_catalog_import(${q(prices.id)},${prices.version},true,false,false);`,
    ),
    /confirmation/,
  );
  finish(start(prices, true));
  ok(
    `SELECT price::text||':'||(price_verified_at IS NULL)::text FROM public.products WHERE id=${q(existing.id)};`,
    "1500.00:true",
  );
  const cleared = stage(
    [["blank-1", ""]],
    ["sku", "price"],
    { sku: 0, price: 1 },
    "price_update",
    true,
  );
  finish(start(cleared, true));
  ok(
    `SELECT price IS NULL FROM public.products WHERE id=${q(existing.id)};`,
    "t",
  );
  const skipped = stage(
    [["blank-1", ""]],
    ["sku", "price"],
    { sku: 0, price: 1 },
    "price_update",
  );
  assert.equal(finish(start(skipped, true)).summary.skipped, 1);
  checks++;
  const unknown = stage(
    [["UNKNOWN-BRAND-1", "Local fixture", "No such brand"]],
    ["sku", "name", "brand"],
    { sku: 0, name: 1, brand: 2 },
  );
  assert.equal(unknown.summary.errors, 1);
  checks++;
  const matched = stage(
    [
      [
        "MATCH-1",
        "Matched local fixture",
        " LOCAL-PHASE4-BRAND ",
        "local-phase4-category",
      ],
    ],
    ["sku", "name", "brand", "category"],
    { sku: 0, name: 1, brand: 2, category: 3 },
  );
  assert.equal(matched.summary.errors, 0);
  checks++;
  finish(start(matched));
  ok(
    `SELECT brand_id=${q(brand)} AND category_id=${q(category)} FROM public.products WHERE sku='MATCH-1';`,
    "t",
  );
  const locked = save({
    name: "Locked import fixture",
    slug: "locked-import-fixture",
    sku: "LOCKED-1",
    description: "Local fixture with public review.",
  });
  publish("product", "products", locked.id);
  const blocked = stage([["LOCKED-1", "Replacement"]], ["sku", "name"], {
    sku: 0,
    name: 1,
  });
  assert.equal(blocked.summary.errors, 1);
  checks++;
  denied(
    as(
      "editor",
      `SELECT public.process_catalog_import_batch(${q(preserve.id)},50);`,
    ),
    /administrator required/,
  );
  denied(
    as(
      "admin",
      `SELECT public.process_catalog_import_batch(${q(preserve.id)},NULL);`,
    ),
    /bounded/,
  );
  ok(
    "SET ROLE anon; SELECT count(*) FROM storage.objects WHERE bucket_id='catalog-imports';",
    0,
  );
  const bulkRows = Array.from({ length: 600 }, (_, i) => [
    `P4-BULK-${String(i + 1).padStart(4, "0")}`,
    `Local bulk fixture ${i + 1}`,
  ]);
  let bulk = stage(bulkRows, ["sku", "name"], { sku: 0, name: 1 });
  bulk = start(bulk);
  bulk = rpc("process_catalog_import_batch", { p_id: bulk.id, p_limit: 50 });
  assert.equal(bulk.summary.applied, 50);
  checks++;
  // Simulate a response lost after commit, then a concurrent creation. Ledger
  // retries continue at pending rows; a unique conflict is retained per row.
  save({
    name: "Concurrent local fixture",
    slug: "concurrent-local-fixture",
    sku: "P4-BULK-0051",
  });
  bulk = finish(bulk);
  assert.equal(bulk.summary.applied, 599);
  assert.equal(bulk.summary.errors, 1);
  checks += 2;
  ok(`SELECT count(*) FROM public.products WHERE sku LIKE 'P4-BULK-%';`, 600);
  bulk = rpc("retry_catalog_import", {
    p_id: bulk.id,
    p_version: bulk.version,
  });
  bulk = prepare(bulk);
  bulk = finish(start(bulk));
  assert.equal(bulk.summary.applied, 600);
  assert.equal(bulk.summary.errors, 0);
  checks += 2;
  ok(
    `SELECT count(DISTINCT sku) FROM public.products WHERE sku LIKE 'P4-BULK-%';`,
    600,
  );
  ok(
    `SELECT count(*)>0 FROM public.product_revisions WHERE workflow_state='before_import';`,
    "t",
  );
  const prior = sql(
    `SELECT id FROM public.product_revisions WHERE product_id=${q(existing.id)} AND workflow_state='before_import' ORDER BY created_at LIMIT 1;`,
  );
  denied(
    as(
      "editor",
      `SELECT public.restore_product_revision(${q(existing.id)},${version("products", existing.id)},${q(prior)});`,
    ),
    /administrator required/,
  );
  denied(
    as(
      "admin",
      `SELECT public.restore_product_revision(${q(existing.id)},0,${q(prior)});`,
    ),
    /Stale/,
  );
  rpc("restore_product_revision", {
    p_id: existing.id,
    p_version: version("products", existing.id),
    p_revision: prior,
  });
  ok(
    `SELECT price::text||':'||publication_status||':'||(price_verified_at IS NULL)::text FROM public.products WHERE id=${q(existing.id)};`,
    "1250.00:draft:true",
  );
  ok(
    `SELECT count(*) FROM public.products WHERE sku LIKE 'P4-BULK-%' AND (publication_status<>'draft' OR identity_verified OR indexing_approved);`,
    0,
  );
  ok(
    `SELECT count(*) FROM public.products WHERE name IN ('Porta Fancy Commode','Faisal Sanitary Wash Basin') AND publication_status='draft' AND NOT identity_verified;`,
    2,
  );
  console.log(
    `Phase 4 PostgreSQL: ${checks} assertions passed, including 600-row interruption/conflict/retry recovery.`,
  );
  return {
    checks,
    rpc,
    save,
    version,
    register,
    stage,
    prepare,
    start,
    finish,
  };
}
