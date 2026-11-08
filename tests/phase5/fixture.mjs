import assert from "node:assert/strict";
import { randomUUID, createHash } from "node:crypto";
import sharp from "sharp";
export async function seedCatalog(f) {
  const { sql, as, literal: q } = f;
  const rpc = (name, args = {}, role = "admin") =>
    JSON.parse(
      sql(
        as(
          role,
          `SELECT coalesce(to_jsonb(public.${name}(${Object.entries(args)
            .map(
              ([k, v]) =>
                `${k}=>${k === "p_ids" ? `ARRAY[${v.map(q).join(",")}]::uuid[]` : q(v)}`,
            )
            .join(",")}))::text,'null');`,
        ),
      ) || "null",
    );
  const version = (table, id) =>
    Number(sql(`SELECT version FROM public.${table} WHERE id=${q(id)};`));
  const publish = (
    kind,
    id,
    { price = false, stock = false, index = false } = {},
  ) => {
    const table =
      kind === "category"
        ? "categories"
        : kind === "brand"
          ? "brands"
          : "products";
    const v = version(table, id);
    rpc("submit_catalog_review", { kind, entity_id: id, expected_version: v });
    rpc("review_catalog_entity", {
      kind,
      entity_id: id,
      expected_version: v,
      verification: { identity: true, content: true, price, stock },
    });
    rpc("publish_catalog_entity", {
      kind,
      entity_id: id,
      expected_version: v,
      approve_indexing: index,
    });
  };
  const taxonomy = (kind, slug, name, extra = {}) => {
    const table = kind === "category" ? "categories" : "brands";
    const existing =
      sql(`SELECT id FROM public.${table} WHERE slug=${q(slug)};`) || null;
    const id = rpc("save_catalog_taxonomy", {
      p_kind: kind,
      p_id: existing,
      p_version: existing ? version(table, existing) : null,
      p_input: {
        name,
        slug,
        description: `Synthetic local ${name} collection for isolated integration tests.`,
        seo_title: `${name} local collection`,
        seo_description: `Local integration fixture for ${name}, not real commercial inventory.`,
        ...extra,
      },
    });
    publish(kind, id);
    return id;
  };
  const categories = {};
  for (const [slug, name] of [
    ["sanitary", "Sanitary & Bathroom"],
    ["imported-products", "Imported Sanitary & Kitchen Products"],
    ["kitchen", "Kitchen Sinks & Faucets"],
    ["hobs", "Kitchen Hobs & Cooking Ranges"],
    ["hoods", "Kitchen Hoods"],
    ["geysers", "Electric & Gas Geysers"],
    ["pipes", "PVC/PPRC Pipes & Fittings"],
    ["tanks", "Water Tanks"],
    ["electric", "Electrical Products"],
    ["building-material", "Building Materials"],
  ])
    categories[slug] = taxonomy(
      "category",
      slug,
      name,
      slug === "building-material" ? { default_sales_mode: "quotation" } : {},
    );
  const brands = {};
  for (const [slug, name] of [
    ["porta", "Porta"],
    ["faisal-sanitary", "Faisal Sanitary"],
    ["dell-ceramics", "Dell Ceramics"],
    ["popular-pipes", "Popular"],
    ["duramax", "DuraMax"],
    ["duraflow", "DuraFlow"],
    ["nasgas", "NASGAS"],
    ["imported-china", "Imported Collection"],
  ])
    brands[slug] = taxonomy("brand", slug, name);
  const child = taxonomy("category", "local-commodes", "Local commodes", {
    parent_id: categories.sanitary,
  });
  const image = async (productId, color) => {
    const id = randomUUID();
    const original = await sharp({
      create: { width: 800, height: 500, channels: 3, background: color },
    })
      .png()
      .toBuffer();
    const derivative = await sharp(original).webp().toBuffer();
    const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
    for (const [name, bytes, type] of [
      [`media/${id}/original.png`, original, "image/png"],
      ...["320", "640", "1280"].map((v) => [
        `media/${id}/${v}.webp`,
        derivative,
        "image/webp",
      ]),
    ]) {
      sql(
        as(
          "admin",
          `INSERT INTO storage.objects(bucket_id,name) VALUES('catalog-private',${q(name)});`,
        ),
      );
      f.storedObjects.set(`catalog-private/${name}`, { bytes, type });
    }
    rpc("register_catalog_media", {
      p_id: id,
      p_manifest: {
        object_name: `media/${id}/original.png`,
        mime_type: "image/png",
        alt_text: "Synthetic local raster for storefront testing",
        width: 800,
        height: 500,
        is_placeholder: false,
        original_filename: "local-test.png",
        sha256: hash(original),
        byte_size: original.length,
        variants: ["320", "640", "1280"].map((v) => ({
          variant_key: v,
          object_name: `media/${id}/${v}.webp`,
          width: 800,
          height: 500,
          byte_size: derivative.length,
          sha256: hash(derivative),
        })),
      },
    });
    rpc("edit_catalog_gallery", {
      p_product_id: productId,
      p_version: version("products", productId),
      p_operation: "attach",
      p_input: { media_id: id },
    });
    rpc("verify_catalog_media", { media_id: id });
    return id;
  };
  const save = (input) =>
    rpc("save_product_draft", {
      product_id: null,
      expected_version: null,
      input,
    });
  const products = [];
  for (let i = 0; i < 16; i++) {
    const p = save({
      name: `Local fixture ${String(i + 1).padStart(2, "0")}`,
      slug: `local-fixture-${i + 1}`,
      sku: `LOCAL-P5-${i + 1}`,
      model: i === 0 ? "TEST-0001" : null,
      description: `Synthetic isolated product ${i + 1} for public catalog integration tests. This is not actual manufacturer inventory.`,
      category_id:
        i === 14
          ? child
          : i === 15
            ? categories["building-material"]
            : categories.sanitary,
      brand_id: i % 2 === 0 ? brands.porta : brands["faisal-sanitary"],
      price: i === 1 ? null : (i + 1) * 100,
      product_type: i % 2 === 0 ? "Commodes" : "Wash Basins",
      finish: i % 2 === 0 ? "White" : "Chrome",
      stock_status: i === 2 ? "out_of_stock" : i === 3 ? "in_stock" : "unknown",
      specifications: { "Fixture only": "Not commercial data" },
      seo_title: `Local fixture ${i + 1} integration title`,
      seo_description: `Unique test metadata for synthetic local product ${i + 1} in this isolated storefront.`,
    });
    rpc("set_catalog_product_featured", {
      p_id: p.id,
      p_version: version("products", p.id),
      p_featured: true,
    });
    let media = null;
    if (i < 6)
      media = await image(p.id, ["#cad7df", "#decea9", "#cbdace"][i % 3]);
    if (i === 0) await image(p.id, "#cbdace");
    publish("product", p.id, {
      price: i !== 1,
      stock: i === 2 || i === 3,
      index: i < 6,
    });
    products.push({ ...p, media });
  }
  const draft = save({
    name: "PRIVATE DRAFT sentinel",
    slug: "private-draft-sentinel",
    sku: "PRIVATE-P5",
    description: "Private authoring data must not escape.",
    category_id: categories.sanitary,
    price: 123456,
  });
  const draftBrand = rpc("save_catalog_taxonomy", {
    p_kind: "brand",
    p_id: null,
    p_version: null,
    p_input: {
      name: "PRIVATE brand sentinel",
      slug: "private-brand-sentinel",
      description: "Private brand",
    },
  });
  const orphan = save({
    name: "PRIVATE parent sentinel",
    slug: "private-parent-sentinel",
    sku: "PRIVATE-PARENT",
    description: "Published entity behind unpublished parent.",
    category_id: categories.sanitary,
    brand_id: draftBrand,
  });
  publish("product", orphan.id);
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
  const preview = rpc(
    "catalog_storefront",
    { p_kind: "category", p_slug: "sanitary", p_query: {} },
    null,
  );
  assert.equal(preview.total, 15);
  return {
    categories,
    brands,
    child,
    products,
    draft,
    draftBrand,
    orphan,
    rpc,
    version,
    publish,
    taxonomy,
    image,
    save,
  };
}
