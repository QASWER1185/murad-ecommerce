import { chromium, expect } from "@playwright/test";
import assert from "node:assert/strict";
import sharp from "sharp";
import ExcelJS from "exceljs";
import { randomUUID, createHash } from "node:crypto";
import { fixturePassword } from "../../scripts/phase3/local-fixture.mjs";
const base = "http://127.0.0.1:3100";
export async function runBrowserTests(f) {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    headless: true,
    args: ["--no-sandbox"],
  });
  const admin = await browser.newContext({
    baseURL: base,
    viewport: { width: 1440, height: 1000 },
  });
  const page = await admin.newPage();
  const capture = async (target, path) => {
    await target.evaluate(async () => {
      window.scrollTo(0, 0);
      await document.fonts.ready;
      await Promise.all(Array.from(document.images, async (image) => {
        image.loading = "eager";
        await image.decode();
      }));
    });
    await target.screenshot({ path, fullPage: true });
  };
  let groups = 0;
  const test = async (name, fn) => {
    await fn();
    groups++;
    console.log(`✓ ${name}`);
  };
  const csrf = async (ctx) =>
    (await ctx.cookies(base + "/admin")).find(
      (c) => c.name === "murad-admin-csrf",
    )?.value;
  const json = async (ctx, path, body, method = "PATCH") =>
    ctx.request.fetch(path, {
      method,
      headers: {
        Origin: base,
        "X-CSRF-Token": await csrf(ctx),
        "Content-Type": "application/json",
      },
      data: body,
    });
  const login = async (p, role) => {
    await p.goto("/admin/login");
    await p.getByLabel("Email address").fill(`${role}@murad.test`);
    await p.getByLabel("Password", { exact: true }).fill(fixturePassword);
    await p.getByRole("button", { name: "Sign in securely" }).click();
    await p.waitForURL(/\/admin$/);
    await expect(
      p.getByRole("heading", { name: "Store overview" }),
    ).toBeVisible();
  };
  const workspace = async () => {
    const r = await admin.request.get(
      `/admin/media/api?kind=product&id=${product}`,
    );
    assert.equal(r.status(), 200, await r.text());
    return r.json();
  };
  const postUpload = async (ctx, bytes, name, type = "image/png") =>
    ctx.request.post("/admin/media/api", {
      headers: { Origin: base, "X-CSRF-Token": await csrf(ctx) },
      multipart: {
        upload_id: randomUUID(),
        target_id: product,
        kind: "product",
        version: String(
          f.sql(`SELECT version FROM public.products WHERE id='${product}';`),
        ),
        alt_text: "Local test-only raster",
        file: { name, mimeType: type, buffer: bytes },
      },
    });
  const raster = async (color) =>
    sharp({
      create: { width: 800, height: 500, channels: 3, background: color },
    })
      .png()
      .toBuffer();
  const firstBytes = await raster("#c6d7e0");
  const secondBytes = await raster("#d9c6a1");
  const thirdBytes = await raster("#d2dfd3");
  let product, firstMedia, category;
  try {
    await test("administrator login and image-free Draft creation use existing secure contracts", async () => {
      await login(page, "admin");
      await page.goto("/admin/products/new");
      await page
        .getByLabel("Product title")
        .fill("Local media and import fixture");
      await page.locator("input[name=slug]").fill("local-media-import-fixture");
      await page.getByLabel("SKU", { exact: true }).fill("P4-BROWSER");
      await page
        .getByLabel("Main product description")
        .fill("Synthetic local fixture used to verify publication boundaries.");
      await page.getByRole("button", { name: "Create Draft product" }).click();
      await page.waitForURL(/notice=saved/);
      product = page.url().match(/products\/([a-f0-9-]+)/)[1];
      await expect(
        page.getByLabel("Original image", { exact: true }),
      ).toBeVisible();
    });
    await test("anonymous, ordinary and Editor uploads/imports are rejected", async () => {
      for (const role of [null, "ordinary", "editor"]) {
        const ctx = await browser.newContext({ baseURL: base });
        if (role) {
          const session = f.issue(role);
          await ctx.addCookies([
            {
              name: "murad-admin-session",
              value:
                "base64-" +
                Buffer.from(JSON.stringify(session)).toString("base64url"),
              domain: "127.0.0.1",
              path: "/admin",
              httpOnly: true,
              sameSite: "Strict",
            },
          ]);
        }
        await ctx.request.get("/admin/login");
        assert.equal(
          (await postUpload(ctx, firstBytes, "test.png")).status(),
          403,
        );
        assert.equal(
          (
            await ctx.request.post("/admin/imports/api", {
              headers: { Origin: base, "X-CSRF-Token": await csrf(ctx) },
              multipart: {
                request_id: randomUUID(),
                file: {
                  name: "catalog.csv",
                  mimeType: "text/csv",
                  buffer: Buffer.from("sku,name\n1,Local fixture"),
                },
              },
            })
          ).status(),
          403,
        );
        await ctx.close();
      }
    });
    await test("content validation, MIME checks and CSRF reject invalid image uploads", async () => {
      assert.equal(
        (
          await postUpload(
            admin,
            Buffer.from("<svg><script>bad()</script></svg>"),
            "fake.png",
          )
        ).status(),
        400,
      );
      assert.equal(
        (
          await postUpload(admin, firstBytes, "fake.jpg", "image/jpeg")
        ).status(),
        400,
      );
      const r = await admin.request.post("/admin/media/api", {
        headers: { Origin: base, "X-CSRF-Token": "a".repeat(64) },
        multipart: {
          file: {
            name: "original.png",
            mimeType: "image/png",
            buffer: firstBytes,
          },
        },
      });
      assert.equal(r.status(), 403);
    });
    async function upload(bytes, name, { replace = "", genuine = false } = {}) {
      await page
        .getByLabel("Original image", { exact: true })
        .setInputFiles({ name, mimeType: "image/png", buffer: bytes });
      await page
        .locator("input[name=alt_text]")
        .last()
        .fill("Synthetic raster fixture for local tests");
      await page.locator("input[name=genuine]").setChecked(genuine);
      if (replace)
        await page
          .locator("select[name=replace_image_id]")
          .selectOption(replace);
      const response = page.waitForResponse(
        (r) =>
          r.url().endsWith("/admin/media/api") &&
          r.request().method() === "POST",
      );
      await page
        .getByRole("button", { name: /^Upload (image|replacement)$/ })
        .click();
      const saved = await response;
      if (saved.status() !== 200) throw new Error(await saved.text());
      await expect(
        page.getByLabel("Original image", { exact: true }),
      ).toBeVisible();
      await page.waitForLoadState("load");
    }
    await test("real binary upload creates private immutable originals and responsive previews", async () => {
      await upload(firstBytes, "local-original.png", { genuine: true });
      await expect(page.locator(".admin-media-item")).toHaveCount(1);
      const data = await workspace();
      firstMedia = data.gallery[0].media_id;
      const original = f.sql(
        `SELECT object_name FROM public.catalog_media WHERE id='${firstMedia}';`,
      );
      assert.deepEqual(
        f.storedObjects.get("catalog-private/" + original).bytes,
        firstBytes,
      );
      const recovered = await admin.request.get(
        `/admin/media/file/${firstMedia}/original`,
      );
      assert.equal(recovered.status(), 200);
      assert.deepEqual(await recovered.body(), firstBytes);
      assert.equal(
        (
          await admin.request.get(`/admin/media/file/${firstMedia}/640`)
        ).status(),
        200,
      );
      assert.equal(
        (await admin.request.get(`/media/catalog/${firstMedia}/640`)).status(),
        404,
      );
      page.once("dialog", (d) => d.accept());
      await page.getByRole("button", { name: "Verify genuine image" }).click();
      await expect(page.getByText(/Genuine image verified/)).toBeVisible();
      const anon = await browser.newContext({ baseURL: base });
      assert.equal(
        (
          await anon.request.get(`/admin/media/file/${firstMedia}/640`)
        ).status(),
        403,
      );
      const direct = await fetch(
        `${f.url}/storage/v1/object/authenticated/catalog-private/${original}`,
      );
      assert.equal(direct.status, 404);
      await anon.close();
    });
    await test("gallery primary selection, ordering, replacement, alt text and recovery work", async () => {
      await upload(secondBytes, "second-placeholder.png");
      await expect(page.locator(".admin-media-item")).toHaveCount(2);
      let data = await workspace();
      const firstImage = data.gallery.find((i) => i.media_id === firstMedia);
      const secondImage = data.gallery.find((i) => i.media_id !== firstMedia);
      await page
        .getByRole("button", { name: "Make primary", exact: true })
        .nth(1)
        .click();
      await expect(page.locator(".admin-media-item").first()).toContainText(
        "second-placeholder.png",
      );
      await upload(thirdBytes, "replacement.png", { replace: firstImage.id });
      await expect(page.locator(".admin-media-item")).toHaveCount(2);
      data = await workspace();
      assert(data.gallery.find((i) => i.id === firstImage.id).archived_at);
      assert.equal(
        data.gallery
          .filter((i) => !i.archived_at)
          .sort((a, b) => a.sort_order - b.sort_order)[0].id,
        secondImage.id,
      );
      await page.getByText(/Recover earlier gallery images/).click();
      await page
        .getByRole("button", { name: "Restore image", exact: true })
        .click();
      await expect(page.locator(".admin-media-item")).toHaveCount(3);
      const item = page
        .locator(".admin-media-item")
        .filter({ hasText: "local-original.png" });
      await item
        .locator("input[name=alt_text]")
        .fill("Revised local fixture alt text");
      await Promise.all([
        page.waitForNavigation({ waitUntil: "load" }),
        item
          .getByRole("button", { name: "Save alt text", exact: true })
          .click(),
      ]);
      await expect(
        page
          .locator(".admin-media-item")
          .filter({ hasText: "local-original.png" })
          .locator("input[name=alt_text]"),
      ).toHaveValue("Revised local fixture alt text");
      assert.equal(
        f.sql(
          `SELECT count(*) FROM public.catalog_media WHERE previous_media_id='${firstMedia}';`,
        ),
        "1",
      );
      await capture(page, "docs/phase4/screenshots/gallery-desktop.png");
    });
    await test("10 MiB originals survive the proxy and multipart size boundary", async () => {
      const input = {
        name: "Local upload-size fixture",
        slug: "local-upload-size-fixture",
        sku: "P4-UPLOAD-SIZE",
      };
      const saved = JSON.parse(
        f.sql(
          f.as(
            "admin",
            `SELECT public.save_product_draft(NULL,NULL,${f.literal(input)});`,
          ),
        ),
      );
      const jpeg = await sharp(firstBytes).jpeg().toBuffer();
      const bytes = Buffer.concat([
        jpeg,
        Buffer.alloc(10 * 1024 * 1024 - jpeg.length),
      ]);
      const result = await admin.request.post("/admin/media/api", {
        headers: { Origin: base, "X-CSRF-Token": await csrf(admin) },
        multipart: {
          upload_id: randomUUID(),
          target_id: saved.id,
          kind: "product",
          version: String(saved.version),
          alt_text: "Synthetic size-boundary fixture",
          file: {
            name: "size-boundary.jpg",
            mimeType: "image/jpeg",
            buffer: bytes,
          },
        },
      });
      assert.equal(result.status(), 200, await result.text());
      assert.equal(
        f.sql(
          `SELECT m.byte_size FROM public.catalog_media m JOIN public.product_images i ON i.media_id=m.id WHERE i.product_id='${saved.id}';`,
        ),
        String(10 * 1024 * 1024),
      );
    });
    await test("category/brand editing, review, and genuine logo handling are functional", async () => {
      await page.goto("/admin/catalog/category/new");
      await page
        .getByLabel("Name", { exact: true })
        .fill("Local browser category");
      await page
        .getByLabel("Permanent slug", { exact: true })
        .fill("local-browser-category");
      await page
        .getByLabel("Description", { exact: true })
        .fill("Synthetic category information for local tests.");
      await page
        .getByLabel("SEO title", { exact: true })
        .fill("Local browser category title");
      await page
        .getByLabel("Meta description", { exact: true })
        .fill("Local browser category metadata.");
      await page.getByRole("button", { name: "Create Draft entry" }).click();
      await page.waitForURL(/catalog\/category\/[a-f0-9-]+$/);
      category = page.url().split("/").pop();
      await page.getByRole("button", { name: "Submit for review" }).click();
      await expect(
        page.getByRole("button", { name: "Record review" }),
      ).toBeVisible();
      await page.locator("input[name=identity]").check();
      await page.locator("input[name=content]").check();
      await page.getByRole("button", { name: "Record review" }).click();
      await expect(
        page.getByRole("button", { name: "Publish approved entry" }),
      ).toBeEnabled();
      await page.locator("input[name=approve_indexing]").check();
      await page.getByLabel("I explicitly approve public visibility.").check();
      await Promise.all([
        page.waitForNavigation({ waitUntil: "load" }),
        page.getByRole("button", { name: "Publish approved entry" }).click(),
      ]);
      await expect(
        page.getByRole("button", { name: "Return to Draft" }),
      ).toBeVisible();
      await page.goto("/admin/catalog/brand/new");
      await page
        .getByLabel("Name", { exact: true })
        .fill("Local browser brand");
      await page
        .getByLabel("Permanent slug", { exact: true })
        .fill("local-browser-brand");
      await page
        .getByLabel("Description", { exact: true })
        .fill("Synthetic brand information for local tests.");
      await page.getByRole("button", { name: "Create Draft entry" }).click();
      await page.waitForURL(/catalog\/brand\/[a-f0-9-]+$/);
      await expect(
        page.getByLabel("Original image", { exact: true }),
      ).toBeVisible();
      await upload(secondBytes, "local-logo.png");
      await expect(page.locator(".admin-media-item")).toHaveCount(1);
      await page.getByLabel("Asset alt text").fill("Local logo description");
      await Promise.all([
        page.waitForNavigation({ waitUntil: "load" }),
        page
          .getByRole("button", { name: "Save alt text", exact: true })
          .click(),
      ]);
      await expect(page.getByLabel("Asset alt text")).toHaveValue(
        "Local logo description",
      );
      await capture(page, "docs/phase4/screenshots/brand-desktop.png");
    });
    await test("published derivatives are readable, originals stay private and withdrawal closes all delivery paths", async () => {
      await page.goto(`/admin/products/${product}`);
      await page.locator("select[name=category_id]").selectOption(category);
      await page.getByLabel("SEO title").fill("Local fixture product title");
      await page
        .getByLabel("Meta description")
        .fill("Synthetic product metadata for local publication tests.");
      await page.getByRole("button", { name: "Save Draft changes" }).click();
      await page.waitForURL(/notice=saved/);
      await page.getByRole("button", { name: "Submit for review" }).click();
      await page.waitForURL(/notice=submitted/);
      await page.locator("input[name=identity]").check();
      await page.locator("input[name=content]").check();
      await page.getByRole("button", { name: "Record review" }).click();
      await page.waitForURL(/notice=reviewed/);
      await page.locator("input[name=approve_indexing]").check();
      await page
        .locator('form[action="/admin/actions/publish"] input[name=confirm]')
        .check();
      await page
        .getByRole("button", { name: "Publish approved product" })
        .click();
      await page.waitForURL(/notice=published/);
      const publicImage = await admin.request.get(
        `/media/catalog/${firstMedia}/640`,
      );
      assert.equal(publicImage.status(), 200);
      assert.match(publicImage.headers()["cache-control"], /no-store/);
      assert.equal(
        (await sharp(await publicImage.body()).metadata()).format,
        "webp",
      );
      assert.equal(
        (
          await admin.request.get(`/media/catalog/${firstMedia}/original`)
        ).status(),
        404,
      );
      const optimized = await admin.request.get(
        `/_next/image?url=${encodeURIComponent(`/media/catalog/${firstMedia}/640`)}&w=640&q=75`,
      );
      assert.equal(optimized.status(), 403);
      await page
        .locator(
          'form[action="/admin/actions/return-draft"] input[name=confirm]',
        )
        .check();
      await page.getByRole("button", { name: "Return to Draft" }).click();
      await page.waitForURL(/notice=draft/);
      assert.equal(
        (await admin.request.get(`/media/catalog/${firstMedia}/640`)).status(),
        404,
      );
      const derivative = f.sql(
        `SELECT object_name FROM public.catalog_media_variants WHERE media_id='${firstMedia}' AND variant_key='640';`,
      );
      assert.equal(
        (
          await fetch(
            `${f.url}/storage/v1/object/authenticated/catalog-private/${derivative}`,
          )
        ).status,
        404,
      );
      await page.locator("input[name=model]").fill("KEEP-MODEL");
      await page.locator("input[name=price]").fill("1250");
      await page.getByRole("button", { name: "Save Draft changes" }).click();
      await page.waitForURL(/notice=saved/);
    });
    let csvJob;
    await test("CSV upload, mapping, duplicate/brand validation and explicit bulk-price approval work", async () => {
      const headers = [
        "sku",
        "name",
        "model",
        "price",
        "brand",
        "category",
        "image_alt_text",
      ];
      const source = [
        headers,
        ["P4-BROWSER", "", "", "1500", "", "", ""],
        [
          "CSV-P4-NEW",
          "Local CSV fixture",
          "0007-A",
          "",
          "local-browser-brand",
          "local-browser-category",
          "Local imported image description",
        ],
        ["dup-sku", "First duplicate", "", "", "", "", ""],
        ["ＤＵＰ-SKU", "Second duplicate", "", "", "", "", ""],
        [
          "CSV-P4-UNKNOWN",
          "Unknown reference",
          "",
          "",
          "NO-SUCH-BRAND",
          "",
          "",
        ],
        ["=UNSAFE-SKU", "Invalid price", "", "=1+1", "", "", ""],
      ];
      const csv = Buffer.from(
        source
          .map((row) =>
            row.map((v) => '"' + v.replaceAll('"', '""') + '"').join(","),
          )
          .join("\r\n"),
      );
      await page.goto("/admin/imports");
      await page.getByLabel("Spreadsheet file").setInputFiles({
        name: "local-catalog.csv",
        mimeType: "text/csv",
        buffer: csv,
      });
      await page.getByRole("button", { name: "Upload for mapping" }).click();
      await page.waitForURL(/imports\/[a-f0-9-]+$/);
      csvJob = page.url().split("/").pop();
      await page
        .getByRole("button", { name: "Build validation preview" })
        .click();
      await expect(
        page.getByRole("heading", { name: "3. Explicit import approval" }),
      ).toBeVisible();
      await expect(
        page.getByText("Duplicate SKU in this spreadsheet").first(),
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Apply approved Draft changes" }),
      ).toBeDisabled();
      await page.getByLabel(/I reviewed the mapped values/).check();
      await expect(
        page.getByRole("button", { name: "Apply approved Draft changes" }),
      ).toBeDisabled();
      await page
        .getByLabel(/I explicitly approve the displayed bulk price changes/)
        .check();
      await page.getByLabel(/Skip invalid rows/).check();
      await capture(page, "docs/phase4/screenshots/import-preview-desktop.png");
      const mobile = await browser.newContext({
        baseURL: base,
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      });
      await mobile.addCookies(await admin.cookies());
      const p = await mobile.newPage();
      await p.goto(`/admin/imports/${csvJob}`);
      assert(
        await p.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      );
      await capture(p, "docs/phase4/screenshots/import-preview-mobile.png");
      await mobile.close();
      await page
        .getByRole("button", { name: "Apply approved Draft changes" })
        .click();
      await expect(page.getByText(/Import finished:/)).toBeVisible();
      const row = JSON.parse(
        f.sql(
          `SELECT to_jsonb(p) FROM public.products p WHERE id='${product}';`,
        ),
      );
      assert.equal(row.price, 1500);
      assert.equal(row.model, "KEEP-MODEL");
      assert.equal(row.publication_status, "draft");
      assert.equal(row.price_verified_at, null);
      const report = await admin.request.get(`/admin/imports/${csvJob}/report`);
      assert.equal(report.status(), 200);
      assert((await report.text()).includes("'=UNSAFE-SKU"));
      assert.equal(
        f.sql(
          "SELECT default_image_alt FROM public.products WHERE sku='CSV-P4-NEW';",
        ),
        "Local imported image description",
      );
    });
    await test("interrupted original-source staging resumes from saved private bytes", async () => {
      const id = randomUUID();
      const bytes = Buffer.from(
        "sku,name\nRESUME-1,Local resume one\nRESUME-2,Local resume two\nRESUME-3,Local resume three\n",
      );
      const path = `imports/${id}/source.csv`;
      const q = f.literal;
      f.sql(
        f.as(
          "admin",
          `INSERT INTO storage.objects(bucket_id,name) VALUES('catalog-imports',${q(path)}); SELECT public.begin_catalog_import(${q(id)},'resume-source.csv',${q(createHash("sha256").update(bytes).digest("hex"))},'csv','["sku","name"]',3); SELECT public.stage_catalog_import_source(${q(id)},1,'[{"cells":["RESUME-1","Local resume one"],"errors":[]}]');`,
        ),
      );
      f.storedObjects.set("catalog-imports/" + path, {
        bytes,
        type: "text/csv",
      });
      await page.goto(`/admin/imports/${id}`);
      await page
        .getByRole("button", { name: "Resume original source staging" })
        .click();
      await expect(
        page.getByRole("button", { name: "Build validation preview" }),
      ).toBeVisible();
      assert.equal(
        f.sql(`SELECT uploaded_rows FROM public.import_jobs WHERE id='${id}';`),
        "3",
      );
      assert.equal(
        f.sql(
          "SELECT count(*) FROM public.products WHERE sku LIKE 'RESUME-%';",
        ),
        "0",
      );
    });
    await test("XLSX imports reject formula rows, preserve text model numbers and create unpriced Drafts", async () => {
      const book = new ExcelJS.Workbook();
      const s = book.addWorksheet("Products");
      s.addRow(["sku", "name", "model", "price"]);
      s.addRow(["XLSX-P4-0001", "Local Excel fixture", "0007-A", ""]);
      s.addRow([
        "XLSX-P4-FORMULA",
        "Formula fixture",
        "",
        { formula: "2+2", result: 4 },
      ]);
      const bytes = Buffer.from(await book.xlsx.writeBuffer());
      await page.goto("/admin/imports");
      await page.getByLabel("Spreadsheet file").setInputFiles({
        name: "local-catalog.xlsx",
        mimeType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        buffer: bytes,
      });
      await page.getByRole("button", { name: "Upload for mapping" }).click();
      await page.waitForURL(/imports\/[a-f0-9-]+$/);
      await page
        .getByRole("button", { name: "Build validation preview" })
        .click();
      await expect(page.getByText(/Formula in column 4/)).toBeVisible();
      await page.getByLabel(/I reviewed the mapped values/).check();
      await page.getByLabel(/Skip invalid rows/).check();
      await page
        .getByRole("button", { name: "Apply approved Draft changes" })
        .click();
      await expect(page.getByText(/Import finished:/)).toBeVisible();
      assert.equal(
        f.sql(
          "SELECT model||':'||(price IS NULL)::text||':'||publication_status FROM public.products WHERE sku='XLSX-P4-0001';",
        ),
        "0007-A:true:draft",
      );
      const csv = await admin.request.get("/admin/imports/template?format=csv");
      assert.equal(csv.status(), 200);
      assert.match(await csv.text(), /image_alt_text/);
      const template = await admin.request.get(
        "/admin/imports/template?format=xlsx",
      );
      const parsed = new ExcelJS.Workbook();
      await parsed.xlsx.load(await template.body());
      assert.equal(parsed.worksheets[0].rowCount, 1);
    });
    await test("banner approval, private original replacement and contact settings are operational", async () => {
      await page.goto("/admin/media");
      await page.getByLabel("Banner title").fill("Local banner fixture");
      await page.getByLabel("Button path").fill("/category/sanitary");
      await page.getByRole("button", { name: "Save inactive banner" }).click();
      await page.waitForURL(/banner=/);
      await expect(
        page.getByLabel("Original image", { exact: true }),
      ).toBeVisible();
      await upload(thirdBytes, "local-banner.png", { genuine: true });
      page.once("dialog", (d) => d.accept());
      await page.getByRole("button", { name: "Verify genuine image" }).click();
      await expect(page.getByText(/Genuine image verified/)).toBeVisible();
      const banner = page.url().split("banner=")[1];
      const media = f.sql(
        `SELECT media_id FROM public.homepage_banners WHERE id='${banner}';`,
      );
      await page.locator("input[name=confirm]").check();
      await page
        .getByRole("button", { name: "Approve & activate banner" })
        .click();
      await expect(
        page.getByRole("button", { name: "Disable banner" }),
      ).toBeVisible();
      assert.equal(
        (await admin.request.get(`/media/catalog/${media}/640`)).status(),
        200,
      );
      await page.getByLabel("Banner title").fill("Revised local banner");
      await page.getByRole("button", { name: "Save inactive banner" }).click();
      await expect(
        page.getByRole("button", { name: "Approve & activate banner" }),
      ).toBeVisible();
      assert.equal(
        (await admin.request.get(`/media/catalog/${media}/640`)).status(),
        404,
      );
      await capture(page, "docs/phase4/screenshots/banner-desktop.png");
      await page.goto("/admin/settings");
      await page.getByLabel(/I verified these business details/).check();
      await page
        .getByRole("button", { name: "Save verified settings" })
        .click();
      await page.waitForURL(/notice=saved/);
      assert.equal(
        f.sql("SELECT main_whatsapp FROM public.site_settings;"),
        "+923217165000",
      );
      assert.equal(
        f.sql("SELECT secondary_whatsapp FROM public.site_settings;"),
        "+923086235608",
      );
    });
    await test("historical product details can be reviewed and recovered into a private Draft", async () => {
      const revision = f.sql(
        `SELECT id FROM public.product_revisions WHERE product_id='${product}' AND workflow_state='before_import' ORDER BY created_at LIMIT 1;`,
      );
      await page.goto(`/admin/products/${product}/revisions/${revision}`);
      await page.getByLabel(/I reviewed this snapshot/).check();
      await page
        .getByRole("button", { name: "Restore details as Draft" })
        .click();
      await page.waitForURL(new RegExp(`/admin/products/${product}$`));
      assert.equal(
        f.sql(
          `SELECT price::text||':'||publication_status||':'||(price_verified_at IS NULL)::text FROM public.products WHERE id='${product}';`,
        ),
        "1250.00:draft:true",
      );
    });
    await test("Editor previews, mobile gallery/settings/history and no-store responses remain protected", async () => {
      const editor = await browser.newContext({ baseURL: base });
      const p = await editor.newPage();
      await login(p, "editor");
      await p.goto(`/admin/products/${product}`);
      await expect(p.getByLabel("Original image", { exact: true })).toHaveCount(
        0,
      );
      assert.equal(
        (
          await editor.request.get(`/admin/media/file/${firstMedia}/640`)
        ).status(),
        200,
      );
      assert.equal(
        (
          await json(editor, "/admin/media/api", {
            id: product,
            version: 1,
            kind: "product",
            operation: "remove",
          })
        ).status(),
        403,
      );
      assert.equal(
        (
          await json(editor, "/admin/imports/api", {
            id: csvJob,
            operation: "process",
          })
        ).status(),
        403,
      );
      await editor.close();
      const mobile = await browser.newContext({
        baseURL: base,
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      });
      await mobile.addCookies(await admin.cookies());
      const m = await mobile.newPage();
      await m.goto(`/admin/products/${product}`);
      await expect(m.locator(".admin-media-item")).toHaveCount(3);
      assert(
        await m.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      );
      await capture(m, "docs/phase4/screenshots/gallery-mobile.png");
      await m.goto("/admin/imports");
      await expect(m.getByRole("heading", { name: "Bulk product import", exact: true })).toBeVisible();
      await expect(m.getByRole("heading", { name: "Import history", exact: true })).toBeVisible();
      assert(
        await m.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      );
      await capture(m, "docs/phase4/screenshots/import-history-mobile.png");
      await m.goto("/admin/settings");
      await expect(m.getByRole("heading", { name: "Store settings", exact: true })).toBeVisible();
      await expect(m.getByLabel("Main WhatsApp", { exact: true })).toHaveValue("+923217165000");
      assert(
        await m.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      );
      await capture(m, "docs/phase4/screenshots/settings-mobile.png");
      await mobile.close();
      const response = await admin.request.get(
        `/admin/media/file/${firstMedia}/640`,
      );
      assert.match(response.headers()["cache-control"], /no-store/);
      assert.match(response.headers()["x-robots-tag"], /noindex/);
    });
    console.log(
      `Phase 4 browser: ${groups} functional/security groups passed; 8 desktop/mobile screenshots captured.`,
    );
  } catch (error) {
    console.error("Browser failure URL:", page.url());
    console.error(
      await page
        .locator("main")
        .innerText()
        .catch(() => ""),
    );
    throw error;
  } finally {
    await admin.close();
    await browser.close();
  }
}
