import { chromium, expect } from "@playwright/test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { mkdirSync, writeFileSync, unlinkSync } from "node:fs";
import { spawn } from "node:child_process";
import { fixturePassword } from "../../scripts/phase3/local-fixture.mjs";
export async function browserTests(f, s) {
  const base = "http://127.0.0.1:3100",
    browser = await chromium.launch({
      executablePath: "/usr/bin/chromium",
      args: ["--no-sandbox"],
    });
  const context = await browser.newContext({
      baseURL: base,
      viewport: { width: 1200, height: 900 },
    }),
    page = await context.newPage();
  let groups = 0;
  const test = async (name, fn) => {
    await fn();
    console.log(`✓ ${name}`);
    groups++;
  };
  const capture = async (p, name) => {
    await p.evaluate(async () => {
      window.scrollTo(0, 0);
      await document.fonts.ready;
      await Promise.all(
        Array.from(document.images, async (i) => {
          i.loading = "eager";
          await i.decode();
        }),
      );
    });
    await p.screenshot({
      path: `docs/phase5/screenshots/${name}.png`,
      fullPage: true,
    });
  };
  mkdirSync("docs/phase5/screenshots", { recursive: true });
  try {
    await test("anonymous pages SSR published content without private sentinel data", async () => {
      for (const path of [
        "/",
        "/category/sanitary",
        "/brand/porta",
        "/product/local-fixture-1",
        "/categories",
        "/brands",
        "/search?q=TEST-0001",
      ]) {
        const r = await context.request.get(path);
        assert.equal(r.status(), 200, path);
        assert.match(r.headers()["cache-control"], /no-store/);
        const text = await r.text();
        assert(!text.includes("PRIVATE DRAFT sentinel"), path);
        assert(!text.includes("PRIVATE brand sentinel"), path);
        assert(!text.includes("15000"), "old sample price absent");
        if (path === "/product/local-fixture-1") {
          assert.match(text, /Local fixture 01/);
          assert.match(text, /TEST-0001/);
          assert.match(text, /Not commercial data/);
        }
      }
    });
    await test("category/brand templates cover all ten agreed categories and eight brands", async () => {
      for (const slug of Object.keys(s.categories))
        assert.equal(
          (await context.request.get(`/category/${slug}`)).status(),
          200,
          slug,
        );
      for (const slug of Object.keys(s.brands))
        assert.equal(
          (await context.request.get(`/brand/${slug}`)).status(),
          200,
          slug,
        );
    });
    await test("GET filters, model search, numeric sorting and pagination work", async () => {
      await page.goto("/category/sanitary");
      await expect(
        page.getByRole("heading", { name: "Showing 15 Products" }),
      ).toBeVisible();
      await expect(page.locator("article")).toHaveCount(12);
      await capture(page, "sanitary-desktop");
      await page.getByRole("link", { name: "Next page", exact: true }).click();
      await expect(page.locator("article")).toHaveCount(3);
      await page.goto("/category/sanitary?sort=price-low");
      await expect(page.locator("article").first()).toContainText(
        "Local fixture 01",
      );
      await page.goto("/category/sanitary");
      await page.getByLabel("Porta", { exact: true }).check();
      await page
        .getByRole("button", { name: "Apply filters", exact: true })
        .click();
      await expect(
        page.getByRole("heading", { name: "Showing 8 Products" }),
      ).toBeVisible();
      await page.goto("/search?q=TEST-0001");
      await expect(page.locator("article")).toHaveCount(1);
      await expect(page.locator("article")).toContainText("Local fixture 01");
    });
    await test("price unknown and quotation products never show invented fixed rates or stock", async () => {
      await page.goto("/product/local-fixture-2");
      await expect(
        page.getByRole("heading", { name: "Local fixture 02", exact: true }),
      ).toBeVisible();
      await expect(page.locator("main")).toContainText("Request current rate");
      await expect(page.locator("main")).toContainText("Confirm availability");
      await page.goto("/product/local-fixture-16");
      await expect(
        page.getByRole("heading", { name: "Local fixture 16", exact: true }),
      ).toBeVisible();
      await expect(page.locator("main")).toContainText("Request current rate");
      assert(
        !(await page
          .locator("main")
          .innerText()
          .then((t) => t.includes("PKR 1,600"))),
      );
      await expect(
        page.getByRole("link", { name: "Request Rate", exact: true }),
      ).toHaveAttribute("href", /wa.me\/923217165000/);
    });
    await test("gallery variants are genuine WebP while draft originals and optimizer bypass are denied", async () => {
      const id = s.products[0].media;
      const r = await context.request.get(`/media/catalog/${id}/640`);
      assert.equal(r.status(), 200);
      assert.match(r.headers()["cache-control"], /no-store/);
      assert.equal((await sharp(await r.body()).metadata()).format, "webp");
      assert.equal(
        (await context.request.get(`/media/catalog/${id}/original`)).status(),
        404,
      );
      assert.equal(
        (
          await context.request.get(
            `/_next/image?url=${encodeURIComponent(`/media/catalog/${id}/640`)}&w=640&q=75`,
          )
        ).status(),
        403,
      );
      assert.equal(
        (
          await context.request.get(`/admin/media/file/${id}/original`)
        ).status(),
        403,
      );
      await page.goto("/product/local-fixture-1");
      await expect(page.locator("main img").first()).toBeVisible();
      await expect(
        page.getByRole("button", { name: "View product image 2", exact: true }),
      ).toBeVisible();
      await page
        .getByRole("button", { name: "View product image 2", exact: true })
        .click();
      await expect(
        page.getByRole("button", { name: "View product image 2", exact: true }),
      ).toHaveAttribute("aria-pressed", "true");
      await capture(page, "product-desktop");
    });
    await test("canonical, breadcrumbs, robots and sitemap share disabled production indexing", async () => {
      await page.goto("/category/sanitary?brand=porta");
      await expect(page.locator("link[rel=canonical]")).toHaveAttribute(
        "href",
        `${base}/category/sanitary`,
      );
      assert(
        (await page.locator("meta[name=robots]").allTextContents()).length > 0,
      );
      assert.match(
        await page.locator("meta[name=robots]").first().getAttribute("content"),
        /noindex/,
      );
      const scripts = await page
        .locator('script[type="application/ld+json"]')
        .allTextContents();
      assert(
        scripts.map(JSON.parse).some((s) => s["@type"] === "BreadcrumbList"),
      );
      assert(!scripts.map(JSON.parse).some((s) => s["@type"] === "Product"));
      assert.match(
        await (await context.request.get("/robots.txt")).text(),
        /Disallow: \//,
      );
      assert(
        !(await (await context.request.get("/sitemap.xml")).text()).includes(
          "<loc>",
        ),
      );
    });
    await test("missing/private routes and pagination return HTTP 404, never a streamed 200", async () => {
      for (const path of [
        "/product/private-draft-sentinel",
        "/brand/private-brand-sentinel",
        "/product/private-parent-sentinel",
        "/product/not-a-real-product",
        "/category/not-a-category",
        "/category/sanitary?page=100",
        "/brand/porta?page=0",
      ]) {
        const r = await context.request.get(path);
        assert.equal(r.status(), 404, path);
        assert(!(await r.text().then((t) => t.includes("PRIVATE"))));
      }
    });
    await test("shared cart persists IDs and revalidates price/visibility before enquiry", async () => {
      await page.goto("/product/local-fixture-1");
      await expect(
        page.getByRole("heading", { name: "Local fixture 01", exact: true }),
      ).toBeVisible();
      await page
        .getByRole("button", { name: "Add to Cart", exact: true })
        .first()
        .click();
      await page
        .getByRole("button", { name: "Cart, 1 items", exact: true })
        .click();
      await expect(page.getByRole("dialog")).toContainText("Local fixture 01");
      await page.getByRole("button", { name: "Close", exact: true }).click();
      await page.goto("/");
      await expect(
        page.getByRole("button", { name: "Cart, 1 items", exact: true }),
      ).toBeVisible();
      const stored = await page.evaluate(() =>
        localStorage.getItem("murad-sanitary-shopping-v1"),
      );
      assert(stored.includes(s.products[0].id));
      assert(!stored.includes("Local fixture"));
      const business = await page
        .locator('script[type="application/ld+json"]')
        .allTextContents();
      assert(
        business
          .map(JSON.parse)
          .some(
            (item) =>
              item["@type"] === "Store" && item.telephone === "+923217165000",
          ),
      );
      await page.evaluate(() =>
        localStorage.removeItem("murad-sanitary-shopping-v1"),
      );
      await page.reload();
      await expect(
        page.getByRole("button", { name: "Cart, 0 items", exact: true }),
      ).toBeVisible();
      await capture(page, "home-desktop");
    });
    await test("publication withdrawal immediately closes warmed HTTP pages, media and cart", async () => {
      const p = s.products[0];
      for (let i = 0; i < 2; i++)
        assert.equal(
          (await context.request.get("/product/local-fixture-1")).status(),
          200,
        );
      s.rpc("return_catalog_to_draft", {
        kind: "product",
        entity_id: p.id,
        expected_version: s.version("products", p.id),
      });
      assert.equal(
        (await context.request.get("/product/local-fixture-1")).status(),
        404,
      );
      assert.equal(
        (await context.request.get(`/media/catalog/${p.media}/640`)).status(),
        404,
      );
      const cart = await (
        await context.request.get(`/api/catalog/cart?ids=${p.id}`)
      ).json();
      assert.deepEqual(cart, []);
      const category = await (
        await context.request.get("/category/sanitary")
      ).text();
      assert(!category.includes("Local fixture 01"));
      s.publish("product", p.id, { price: true, index: true });
    });
    await test("concurrent media withdrawal during download fails closed", async () => {
      let changed = false;
      f.setResponseHook((fn, data) => {
        if (fn === "catalog_public_media" && data && !changed) {
          changed = true;
          s.rpc("return_catalog_to_draft", {
            kind: "product",
            entity_id: s.products[0].id,
            expected_version: s.version("products", s.products[0].id),
          });
        }
      });
      try {
        assert.equal(
          (
            await context.request.get(
              `/media/catalog/${s.products[0].media}/640`,
            )
          ).status(),
          404,
        );
        assert(changed);
      } finally {
        f.setResponseHook(null);
        s.publish("product", s.products[0].id, { price: true, index: true });
      }
    });
    await test("permanent rename yields 308 only while its destination is published", async () => {
      const p = s.products[0];
      s.rpc("rename_catalog_slug", {
        kind: "product",
        entity_id: p.id,
        expected_version: s.version("products", p.id),
        new_slug: "renamed-public-fixture",
      });
      let r = await context.request.get("/product/local-fixture-1?old=1", {
        maxRedirects: 0,
      });
      assert.equal(r.status(), 308);
      assert.equal(
        new URL(r.headers().location, base).href,
        `${base}/product/renamed-public-fixture`,
      );
      await page.goto("/product/renamed-public-fixture");
      await expect(page.locator("link[rel=canonical]")).toHaveAttribute(
        "href",
        `${base}/product/renamed-public-fixture`,
      );
      s.rpc("return_catalog_to_draft", {
        kind: "product",
        entity_id: p.id,
        expected_version: s.version("products", p.id),
      });
      assert.equal(
        (
          await context.request.get("/product/local-fixture-1", {
            maxRedirects: 0,
          })
        ).status(),
        404,
      );
      s.publish("product", p.id, { price: true, index: true });
    });
    await test("admin/Editor outbox permissions remain server-side and processing is retry-safe", async () => {
      assert.equal(
        (
          await context.request.post("/admin/invalidations", {
            headers: {
              Origin: base,
              "Content-Type": "application/json",
              "X-CSRF-Token": "bad",
            },
            data: {},
          })
        ).status(),
        403,
      );
      const admin = await browser.newContext({ baseURL: base });
      const p = await admin.newPage();
      await p.goto("/admin/login");
      await p.getByLabel("Email address").fill("admin@murad.test");
      await p.getByLabel("Password", { exact: true }).fill(fixturePassword);
      await p.getByRole("button", { name: "Sign in securely" }).click();
      await expect(
        p.getByRole("heading", { name: "Store overview" }),
      ).toBeVisible();
      const csrf = (await admin.cookies()).find(
        (c) => c.name === "murad-admin-csrf",
      )?.value;
      for (let i = 0; i < 20; i++) {
        const r = await admin.request.post("/admin/invalidations", {
          headers: {
            Origin: base,
            "X-CSRF-Token": csrf,
            "Content-Type": "application/json",
          },
          data: {},
        });
        assert.equal(r.status(), 200, await r.text());
        if (!(await r.json()).more) break;
      }
      assert(
        f.publicRequests
          .filter((r) => r.endpoint === "rpc/catalog_storefront")
          .every((r) => r.role === "anon"),
      );
      const cookieFile = "work/phase5-worker-session.json";
      writeFileSync(cookieFile, JSON.stringify(await admin.cookies()), {
        mode: 0o600,
      });
      try {
        await new Promise((resolve, reject) => {
          const child = spawn(
            process.execPath,
            ["scripts/process-catalog-invalidations.mjs"],
            {
              env: {
                ...process.env,
                CATALOG_WORKER_ORIGIN: base,
                CATALOG_WORKER_COOKIE_FILE: cookieFile,
              },
              stdio: ["ignore", "pipe", "pipe"],
            },
          );
          let output = "";
          child.stdout.on("data", (b) => {
            output += b;
          });
          child.stderr.on("data", (b) => {
            output += b;
          });
          child.once("error", reject);
          child.once("close", (code) =>
            code === 0 ? resolve() : reject(Error(output)),
          );
        });
      } finally {
        unlinkSync(cookieFile);
      }
      const editor = await browser.newContext({ baseURL: base });
      const session = f.issue("editor");
      await editor.addCookies([
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
      await editor.request.get("/admin/login");
      const editorCsrf = (await editor.cookies()).find(
        (c) => c.name === "murad-admin-csrf",
      )?.value;
      assert.equal(
        (
          await editor.request.post("/admin/invalidations", {
            headers: {
              Origin: base,
              "X-CSRF-Token": editorCsrf,
              "Content-Type": "application/json",
            },
            data: {},
          })
        ).status(),
        403,
      );
      await editor.close();
      await admin.close();
    });
    await test("manual admin price edits require withdrawal, review and approval before storefront updates", async () => {
      const admin = await browser.newContext({ baseURL: base });
      const p = await admin.newPage();
      await p.goto("/admin/login");
      await p.getByLabel("Email address").fill("admin@murad.test");
      await p.getByLabel("Password", { exact: true }).fill(fixturePassword);
      await p.getByRole("button", { name: "Sign in securely" }).click();
      await expect(
        p.getByRole("heading", { name: "Store overview" }),
      ).toBeVisible();
      await p.goto(`/admin/products/${s.products[0].id}`);
      await p.getByLabel("Withdraw this product and clear its review.").check();
      await p
        .getByRole("button", { name: "Return to Draft", exact: true })
        .click();
      await expect(
        p.getByRole("button", { name: "Save Draft changes", exact: true }),
      ).toBeEnabled();
      assert.equal(
        (await context.request.get("/product/renamed-public-fixture")).status(),
        404,
      );
      await p.locator("input[name=price]").fill("1777");
      await p
        .getByRole("button", { name: "Save Draft changes", exact: true })
        .click();
      await expect(p.locator("input[name=price]")).toHaveValue("1777");
      await p
        .getByRole("button", { name: "Submit for review", exact: true })
        .click();
      await expect(
        p.getByRole("button", { name: "Record review", exact: true }),
      ).toBeVisible();
      await p.getByLabel("I verified the genuine product identity.").check();
      await p.getByLabel(/I reviewed the description/).check();
      await p.getByLabel("I independently verified the entered price.").check();
      await p
        .getByRole("button", { name: "Record review", exact: true })
        .click();
      await expect(
        p.getByLabel(
          "I explicitly approve making this product publicly visible.",
        ),
      ).toBeEnabled();
      await p
        .getByLabel(
          "I explicitly approve making this product publicly visible.",
        )
        .check();
      await p
        .getByRole("button", { name: "Publish approved product", exact: true })
        .click();
      await expect(
        p.getByRole("button", { name: "Return to Draft", exact: true }),
      ).toBeVisible();
      await page.goto("/product/renamed-public-fixture");
      await expect(
        page.getByRole("heading", { name: "Local fixture 01", exact: true }),
      ).toBeVisible();
      await expect(page.locator("main")).toContainText("PKR 1,777");
      await admin.close();
    });
    await test("approved CMS banners flow into homepage slots and withdraw without a source edit", async () => {
      const id = s.rpc("save_catalog_banner", {
        p_id: null,
        p_version: null,
        p_input: {
          title: "Synthetic local banner",
          subtitle: "Isolated integration test",
          cta_label: "View collection",
          cta_path: "/category/sanitary",
          sort_order: 0,
        },
      });
      s.rpc("attach_catalog_asset", {
        p_kind: "banner",
        p_id: id,
        p_version: s.version("homepage_banners", id),
        p_media_id: s.products[0].media,
      });
      s.rpc("set_catalog_banner_active", {
        p_id: id,
        p_version: s.version("homepage_banners", id),
        p_active: true,
      });
      await page.goto("/");
      await expect(
        page.getByRole("heading", { name: "Featured Products", exact: true }),
      ).toBeVisible();
      await expect(
        page.locator('[aria-label="Pipes and building materials"] img').first(),
      ).toHaveAttribute("src", `/media/catalog/${s.products[0].media}/640`);
      s.rpc("set_catalog_banner_active", {
        p_id: id,
        p_version: s.version("homepage_banners", id),
        p_active: false,
      });
      await page.reload();
      await expect(
        page.locator('[data-reference-asset="banner-pipes"]'),
      ).toBeVisible();
    });
    await test("catalog public media works independently while Admin integration is disabled", async () => {
      assert.equal(
        (await context.request.get("/api/catalog/cart?ids=invalid")).status(),
        400,
      );
      assert(
        f.publicRequests
          .filter((r) =>
            [
              "rpc/catalog_storefront",
              "rpc/catalog_cart",
              "rpc/catalog_public_media",
            ].includes(r.endpoint),
          )
          .every((r) => r.role === "anon"),
      );
      const response = await fetch(
        "http://127.0.0.1:3102/media/catalog/" + s.products[0].media + "/640",
      );
      assert.equal(response.status, 200);
      assert.equal(response.headers.get("content-type"), "image/webp");
    });
    await test("wishlist selections cross category, product and homepage boundaries without persisting private product details", async () => {
      await page.goto("/product/renamed-public-fixture");
      await page
        .getByRole("button", {
          name: "Save Local fixture 01 to wishlist",
          exact: true,
        })
        .first()
        .click();
      await page.goto("/");
      await page
        .getByRole("button", {
          name: "Wishlist, 1 saved products",
          exact: true,
        })
        .click();
      await expect(page.getByRole("dialog")).toContainText("Local fixture 01");
      await page
        .getByRole("button", { name: "Remove Local fixture 01", exact: true })
        .click();
      await expect(page.getByRole("dialog")).not.toContainText(
        "Local fixture 01",
      );
      await page.getByRole("button", { name: "Close", exact: true }).click();
    });
    await test("desktop/mobile templates retain approved artwork and avoid page overflow", async () => {
      await page.goto("/brand/porta");
      await expect(
        page.getByRole("heading", { name: "Porta", exact: true }),
      ).toBeVisible();
      await capture(page, "brand-desktop");
      await page.setViewportSize({ width: 1024, height: 900 });
      await page.goto("/category/sanitary");
      await expect(page.getByRole("heading", { level: 1 })).toContainText(
        "Sanitary & Bathroom",
      );
      await capture(page, "sanitary-comparison-current");
      await page.setViewportSize({ width: 1200, height: 900 });
      const mobile = await browser.newContext({
          baseURL: base,
          viewport: { width: 390, height: 844 },
          isMobile: true,
          hasTouch: true,
        }),
        p = await mobile.newPage();
      for (const [path, name, heading] of [
        ["/", "home-mobile", "Modern Bathroom"],
        ["/category/sanitary", "sanitary-mobile", "Sanitary & Bathroom"],
        ["/brand/porta", "brand-mobile", "Porta"],
        [
          "/product/renamed-public-fixture",
          "product-mobile",
          "Local fixture 01",
        ],
      ]) {
        await p.goto(path);
        await expect(
          p.getByRole("heading", { level: 1 }).first(),
        ).toContainText(heading);
        assert(
          await p.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
          path,
        );
        await capture(p, name);
      }
      await mobile.close();
    });
    console.log(
      `Phase 5 browser: ${groups} integration/security groups passed; 8 desktop/mobile screenshots and one 1024 px comparison captured.`,
    );
  } finally {
    await context.close();
    await browser.close();
  }
}
