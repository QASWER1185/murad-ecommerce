import { chromium, expect } from "@playwright/test";
import assert from "node:assert/strict";
import { fixturePassword } from "../../scripts/phase3/local-fixture.mjs";
const base = "http://127.0.0.1:3100";
export async function runBrowserTests(fixture) {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    headless: true,
    args: ["--no-sandbox"],
  });
  let groups = 0;
  const check = async (name, fn) => {
    await fn();
    groups++;
    console.log(`✓ ${name}`);
  };
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    baseURL: base,
  });
  const page = await context.newPage();
  const csrf = async (ctx) =>
    (await ctx.cookies(base + "/admin")).find(
      (c) => c.name === "murad-admin-csrf",
    )?.value;
  const post = async (ctx, action, data = {}) =>
    ctx.request.post(`/admin/actions/${action}`, {
      form: { csrf: await csrf(ctx), ...data },
      headers: { Origin: base, Accept: "application/json" },
      maxRedirects: 0,
    });
  const login = async (p, role) => {
    await p.goto("/admin/login");
    await p.getByLabel("Email address").fill(`${role}@murad.test`);
    await p.getByLabel("Password", { exact: true }).fill(fixturePassword);
    await p.getByRole("button", { name: "Sign in securely" }).click();
    await p.waitForURL(/\/admin(?:\?[^/]*)?$/);
    await expect(
      p.getByRole("heading", { name: "Store overview" }),
    ).toBeVisible();
  };
  const rawDraft = {
    name: "Local browser fixture",
    slug: "local-browser-fixture",
    sku: "BROWSER-LOCAL",
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
    product_id: "",
    version: "",
  };
  try {
    await check(
      "anonymous dashboard and preview access denied, noindex/no-store enforced",
      async () => {
        const response = await page.goto("/admin");
        await expect(
          page.getByRole("heading", { name: "Welcome back" }),
        ).toBeVisible();
        assert.match(response.headers()["x-robots-tag"], /noindex/);
        assert.match(response.headers()["cache-control"], /no-store/);
        const r = await context.request.get(
          "/admin/products/00000000-0000-0000-0000-000000000001/preview",
        );
        assert(!(await r.text()).includes("Product imagery not displayed"));
        await page.screenshot({
          path: "docs/phase3/screenshots/login-desktop.png",
          fullPage: true,
        });
      },
    );
    await check(
      "ordinary user denied despite forged user_metadata admin role",
      async () => {
        const ordinary = await browser.newContext({ baseURL: base });
        const p = await ordinary.newPage();
        await p.goto("/admin/login");
        await p.getByLabel("Email address").fill("ordinary@murad.test");
        await p.getByLabel("Password", { exact: true }).fill(fixturePassword);
        await p.getByRole("button", { name: "Sign in securely" }).click();
        await expect(p.locator(".admin-notice-error")).toBeVisible();
        await expect(p.locator(".admin-notice-error")).toContainText(
          "Unable to sign in",
        );
        assert(
          !(await ordinary.cookies()).some(
            (c) => c.name.startsWith("murad-admin-session") && c.value,
          ),
        );
        await ordinary.close();
      },
    );
    await check(
      "admin login creates HttpOnly, Strict cookies scoped to /admin",
      async () => {
        await login(page, "admin");
        const session = (await context.cookies(base + "/admin")).find((c) =>
          c.name.startsWith("murad-admin-session"),
        );
        assert(session?.httpOnly);
        assert.equal(session.sameSite, "Strict");
        assert.equal(session.path, "/admin");
        assert(
          session.expires > 0 &&
            session.expires - Date.now() / 1000 <= 8 * 60 * 60 + 60,
        );
        await page.screenshot({
          path: "docs/phase3/screenshots/overview-desktop.png",
          fullPage: true,
        });
      },
    );
    await check(
      "valid ordinary sessions and forged session cookies cannot grant workspace access",
      async () => {
        for (const forged of [false, true]) {
          const denied = await browser.newContext({ baseURL: base });
          const session = fixture.issue(forged ? "admin" : "ordinary");
          if (forged) session.access_token += "forged";
          await denied.addCookies([
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
          const p = await denied.newPage();
          await p.goto("/admin");
          await expect(
            p.getByRole("heading", { name: "Welcome back" }),
          ).toBeVisible();
          assert.equal((await post(denied, "save", rawDraft)).status(), 403);
          await denied.close();
        }
      },
    );
    await check(
      "CSRF, origin and unsupported product field attacks rejected",
      async () => {
        assert.equal(
          (
            await post(context, "save", { ...rawDraft, csrf: "a".repeat(64) })
          ).status(),
          403,
        );
        assert.equal(
          (
            await context.request.post("/admin/actions/save", {
              form: { csrf: await csrf(context), ...rawDraft },
              headers: { Origin: "https://evil.example" },
            })
          ).status(),
          403,
        );
        assert.equal(
          (
            await post(context, "save", {
              ...rawDraft,
              publication_status: "published",
            })
          ).status(),
          422,
        );
        assert.equal(
          (
            await post(context, "save", { ...rawDraft, slug: "invalid slug" })
          ).status(),
          422,
        );
      },
    );
    let id;
    await check(
      "manual creation supports Draft with no image, price or stock claim",
      async () => {
        await page.goto("/admin/products/new");
        await page
          .getByLabel("Product title")
          .fill("Local browser test product");
        await page
          .locator("input[name=slug]")
          .fill("local-browser-test-product");
        await page.getByLabel("SKU", { exact: true }).fill("LOCAL-BROWSER-1");
        await page
          .getByLabel("Main product description")
          .fill(
            "Local test-only description used to exercise the explicit publishing workflow.",
          );
        await page
          .getByRole("button", { name: "Create Draft product" })
          .click();
        await page.waitForURL(/notice=saved/);
        id = page.url().match(/products\/([a-f0-9-]+)/)[1];
        const row = JSON.parse(
          fixture.sql(
            `SELECT to_jsonb(p) FROM public.products p WHERE id='${id}';`,
          ),
        );
        assert.equal(row.price, null);
        assert.equal(row.stock_status, "unknown");
        assert.equal(row.publication_status, "draft");
        assert.equal(row.indexing_approved, false);
        await expect(
          page.getByText("Excluded from indexing", { exact: true }),
        ).toBeVisible();
        await page.screenshot({
          path: "docs/phase3/screenshots/editor-desktop.png",
          fullPage: true,
        });
      },
    );
    await check(
      "atomic edits reject stale versions and duplicate SKU, preserve existing data",
      async () => {
        const version = fixture.sql(
          `SELECT version FROM public.products WHERE id='${id}';`,
        );
        const edit = {
          ...rawDraft,
          name: "Local browser test product",
          slug: "local-browser-test-product",
          sku: "LOCAL-BROWSER-1",
          description: "Local test-only content approved in explicit review.",
          product_id: id,
          version,
        };
        assert.equal((await post(context, "save", edit)).status(), 200);
        assert.equal((await post(context, "save", edit)).status(), 409);
        assert.equal(
          (
            await post(context, "save", {
              ...rawDraft,
              slug: "duplicate-browser-sku",
              sku: "LOCAL-BROWSER-1",
            })
          ).status(),
          409,
        );
        assert.equal(
          fixture.sql(
            "SELECT count(*) FROM public.products WHERE name IN ('Porta Fancy Commode','Faisal Sanitary Wash Basin');",
          ) !== "0",
          true,
        );
      },
    );
    await check(
      "product search, status filter and links return the actual catalog",
      async () => {
        await page.goto("/admin/products?q=LOCAL-BROWSER-1&status=draft");
        await expect(
          page.getByRole("link", { name: /Local browser test product/ }),
        ).toBeVisible();
        await expect(
          page.getByRole("link", { name: /Porta Fancy Commode/ }),
        ).toHaveCount(0);
        await page.goto("/admin/products?status=published");
        await expect(
          page.getByRole("heading", { name: "No matching products" }),
        ).toBeVisible();
      },
    );
    await check(
      "editor can read/preview, but cannot save or execute workflow mutations",
      async () => {
        const editor = await browser.newContext({ baseURL: base });
        const p = await editor.newPage();
        await login(p, "editor");
        await p.goto(`/admin/products/${id}`);
        await expect(p.locator("input[name=name]")).toBeDisabled();
        await expect(
          p.getByRole("button", { name: "Save Draft changes" }),
        ).toHaveCount(0);
        await p.goto(`/admin/products/${id}/preview`);
        await expect(
          p.getByRole("heading", { name: "Private product preview" }),
        ).toBeVisible();
        assert.equal(
          (
            await post(editor, "save", {
              ...rawDraft,
              product_id: id,
              version: "1",
            })
          ).status(),
          403,
        );
        assert.equal(
          (
            await post(editor, "submit", { product_id: id, version: "1" })
          ).status(),
          403,
        );
        await editor.close();
      },
    );
    await check(
      "explicit review and publication remain separate; incomplete indexing is rejected",
      async () => {
        await page.goto(`/admin/products/${id}`);
        await page.getByRole("button", { name: "Submit for review" }).click();
        await page.waitForURL(/notice=submitted/);
        await expect(
          page.getByRole("button", { name: "Publish approved product" }),
        ).toBeDisabled();
        await page.locator("input[name=identity]").check();
        await page.locator("input[name=content]").check();
        await page.getByRole("button", { name: "Record review" }).click();
        await page.waitForURL(/notice=reviewed/);
        const version = fixture.sql(
          `SELECT version FROM public.products WHERE id='${id}';`,
        );
        const rejected = await post(context, "publish", {
          product_id: id,
          version,
          confirm: "on",
          approve_indexing: "on",
        });
        assert.equal(rejected.status(), 422);
        assert.match((await rejected.json()).error, /Indexing requirements/);
        await page
          .locator('form[action="/admin/actions/publish"] input[name=confirm]')
          .check();
        await page
          .getByRole("button", { name: "Publish approved product" })
          .click();
        await page.waitForURL(/notice=published/);
        await expect(page.locator("input[name=name]")).toBeDisabled();
        assert.equal(
          fixture.sql(
            `SET ROLE anon; SELECT count(*) FROM public.catalog_products_public WHERE id='${id}' AND NOT is_indexable AND price IS NULL AND availability='unknown';`,
          ),
          "1",
        );
      },
    );
    await check(
      "return to Draft withdraws public access and clears approval",
      async () => {
        await page
          .locator(
            'form[action="/admin/actions/return-draft"] input[name=confirm]',
          )
          .check();
        await page.getByRole("button", { name: "Return to Draft" }).click();
        await page.waitForURL(/notice=draft/);
        await expect(page.locator("input[name=name]")).toBeEnabled();
        assert.equal(
          fixture.sql(
            `SET ROLE anon; SELECT count(*) FROM public.catalog_products_public WHERE id='${id}';`,
          ),
          "0",
        );
      },
    );
    await check(
      "desktop/mobile layouts, pending controls and screenshots",
      async () => {
        const mobile = await browser.newContext({
          viewport: { width: 390, height: 844 },
          isMobile: true,
          hasTouch: true,
          baseURL: base,
        });
        await mobile.addCookies(await context.cookies());
        const p = await mobile.newPage();
        await p.goto("/admin");
        await expect(
          p.getByRole("heading", { name: "Store overview" }),
        ).toBeVisible();
        assert(
          await p.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        );
        await p.screenshot({
          path: "docs/phase3/screenshots/overview-mobile.png",
          fullPage: true,
        });
        await p.goto("/admin/products");
        assert(
          await p.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        );
        await p.screenshot({
          path: "docs/phase3/screenshots/products-mobile.png",
          fullPage: true,
        });
        await p.goto(`/admin/products/${id}`);
        assert(
          await p.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        );
        await p.screenshot({
          path: "docs/phase3/screenshots/editor-mobile.png",
          fullPage: true,
        });
        await p.goto("/admin/media");
        await expect(
          p.getByRole("button", { name: "Upload & manage · Phase 4" }),
        ).toHaveCount(3);
        for (const b of await p
          .getByRole("button", { name: "Upload & manage · Phase 4" })
          .all())
          await expect(b).toBeDisabled();
        await p.goto("/admin/imports");
        await expect(
          p.getByRole("button", { name: "Choose file · Phase 4" }),
        ).toBeDisabled();
        await p.goto("/admin/catalog");
        await expect(
          p.getByRole("heading", { name: "Brands & categories" }),
        ).toBeVisible();
        await p.goto("/admin/settings");
        await expect(
          p.getByRole("heading", { name: "Store settings" }),
        ).toBeVisible();
        await mobile.close();
      },
    );
    await check(
      "SSR refresh persists rotated cookies and revalidates the session",
      async () => {
        const refreshed = await browser.newContext({ baseURL: base });
        const session = fixture.issue("editor", true);
        await refreshed.addCookies([
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
        const p = await refreshed.newPage();
        const before = fixture.refreshCount;
        await p.goto("/admin");
        await expect(
          p.getByRole("heading", { name: "Store overview" }),
        ).toBeVisible();
        assert(fixture.refreshCount > before);
        assert(
          (await refreshed.cookies()).find((c) =>
            c.name.startsWith("murad-admin-session"),
          )?.httpOnly,
        );
        await refreshed.close();
      },
    );
    await check(
      "login rate limiting fails closed after five attempts",
      async () => {
        fixture.resetLimits();
        const blocked = await browser.newContext({ baseURL: base });
        await blocked.request.get("/admin/login");
        for (let i = 0; i < 5; i++)
          assert.equal(
            (
              await post(blocked, "login", {
                email: "not-a-user@murad.test",
                password: "wrong",
              })
            ).status(),
            401,
          );
        const r = await post(blocked, "login", {
          email: "not-a-user@murad.test",
          password: "wrong",
        });
        assert.equal(r.status(), 429);
        assert.equal(r.headers()["retry-after"], "900");
        await blocked.close();
      },
    );
    await check(
      "logout clears cookies and denies further authenticated previews",
      async () => {
        await page.goto("/admin");
        await page.getByRole("button", { name: "Sign out" }).click();
        await page.waitForURL(/notice=logout/);
        assert(
          !(await context.cookies()).some(
            (c) => c.name.startsWith("murad-admin-session") && c.value,
          ),
        );
        await page.goto(`/admin/products/${id}/preview`);
        await expect(
          page.getByRole("heading", { name: "Welcome back" }),
        ).toBeVisible();
      },
    );
    console.log(
      `Phase 3 browser: ${groups} functional/security groups passed; 6 desktop/mobile screenshots saved. Auth uses local contracts; no staging or production services contacted.`,
    );
  } finally {
    await context.close();
    await browser.close();
  }
}
