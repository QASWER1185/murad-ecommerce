import { chromium, expect } from "@playwright/test";
import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { fixturePassword } from "../../scripts/phase3/local-fixture.mjs";
export async function orderBrowserTests(f, s, o) {
  const base = "http://127.0.0.1:3100";
  const browser = await chromium.launch({
    executablePath: "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  const context = await browser.newContext({
    baseURL: base,
    viewport: { width: 1200, height: 900 },
  });
  let googleLoads = 0;
  await context.route("**/*googletagmanager.com/**", (route) => {
    googleLoads++;
    return route.fulfill({
      status: 200,
      contentType: "text/javascript",
      body: "/* Local GA4 transport contract; no Google request or real property. */",
    });
  });
  await context.route("**/*google-analytics.com/**", (route) => route.abort());
  const page = await context.newPage();
  let groups = 0;
  let submitted, orderId;
  const test = async (name, fn) => {
    await fn();
    groups++;
    console.log(`✓ ${name}`);
  };
  const headers = (session) => ({
    "Content-Type": "application/json",
    Origin: base,
    "X-CSRF-Token": session.csrf,
  });
  const session = async (ctx) =>
    await (await ctx.request.get("/api/order-requests/session")).json();
  const preview = async (ctx, token, ids) => {
    const r = await ctx.request.post("/api/order-requests/preview", {
      headers: headers(token),
      data: { ids },
    });
    assert.equal(r.status(), 200);
    return (await r.json()).items;
  };
  const body = (items) => ({
    idempotency_key: randomUUID(),
    customer_name: "Local guest fixture",
    customer_phone: "+12025550123",
    customer_note: "Synthetic local request only",
    consent: true,
    intent: "order",
    items: items.map((p) => ({
      product_id: p.id,
      quantity: 2,
      order_token: p.order_token,
    })),
  });
  const submit = (ctx, token, request) =>
    ctx.request.post("/api/order-requests", {
      headers: headers(token),
      data: { request, challenge: token.challenge, website: "" },
    });
  const events = () =>
    page.evaluate(() =>
      (window.dataLayer || []).filter(
        (row) => Array.isArray(row) && row[0] === "event",
      ),
    );
  const capture = async (p, name) => {
    await p.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all(
        Array.from(document.images, async (i) => {
          i.loading = "eager";
          await i.decode();
        }),
      );
    });
    await p.screenshot({
      path: `docs/phase6/screenshots/${name}.png`,
      fullPage: true,
    });
  };
  mkdirSync("docs/phase6/screenshots", { recursive: true });
  try {
    await test("existing homepage/Sanitary presentation remains intact before opening request controls", async () => {
      await page.goto("/");
      await expect(
        page.getByRole("heading", { name: "Featured Products", exact: true }),
      ).toBeVisible();
      await capture(page, "home-desktop");
      await page.goto("/category/sanitary");
      await expect(page.getByRole("heading", { level: 1 })).toContainText(
        "Sanitary & Bathroom",
      );
      await capture(page, "sanitary-desktop");
    });
    await test("analytics makes no third-party request before consent", async () => {
      await page.goto("/product/local-fixture-1");
      await expect(
        page.getByRole("heading", { name: "Local fixture 01", exact: true }),
      ).toBeVisible();
      assert.equal(googleLoads, 0);
      assert.equal(
        await page.evaluate(() => window.__muradAnalyticsAllowed),
        false,
      );
    });
    await test("guest security validates Origin, CSRF, signatures, honeypots and actual product selections", async () => {
      const ctx = await browser.newContext({ baseURL: base });
      const token = await session(ctx);
      assert(token.enabled);
      const cookie = (await ctx.cookies()).find(
        (c) => c.name === "murad-order-guest",
      );
      assert(
        cookie.httpOnly &&
          cookie.sameSite === "Strict" &&
          cookie.path === "/api/order-requests",
      );
      const products = await preview(ctx, token, [s.products[0].id]);
      const request = body(products);
      assert.equal(
        (
          await ctx.request.post("/api/order-requests", {
            headers: { ...headers(token), Origin: "https://attacker.invalid" },
            data: { request, challenge: token.challenge, website: "" },
          })
        ).status(),
        403,
      );
      assert.equal(
        (
          await ctx.request.post("/api/order-requests", {
            headers: { ...headers(token), "X-CSRF-Token": "0".repeat(64) },
            data: { request, challenge: token.challenge, website: "" },
          })
        ).status(),
        403,
      );
      assert.equal(
        (
          await ctx.request.post("/api/order-requests", {
            headers: headers(token),
            data: { request, challenge: token.challenge, website: "spam" },
          })
        ).status(),
        422,
      );
      assert.equal(
        (await submit(ctx, token, { ...request, total: 1 })).status(),
        422,
      );
      assert.equal(
        (await ctx.request.get("/api/order-requests")).status(),
        405,
      );
      await ctx.close();
    });
    await test("optional analytics require consent and exclude raw URLs, search text, customer data and purchase events", async () => {
      await page.goto("/privacy");
      await page
        .getByRole("button", { name: "Allow optional analytics", exact: true })
        .click();
      await expect
        .poll(() => page.evaluate(() => window.__muradAnalyticsAllowed))
        .toBe(true);
      await expect.poll(() => googleLoads).toBeGreaterThan(0);
      await page.goto("/category/sanitary");
      await page
        .getByRole("link", { name: "Local fixture 01", exact: true })
        .click();
      await page.waitForURL("**/product/local-fixture-1");
      await expect
        .poll(
          async () =>
            (await events()).filter((e) => e[1] === "select_item").length,
        )
        .toBe(1);
      await page.evaluate(() =>
        history.replaceState(
          null,
          "",
          "/product/local-fixture-1?private=PRIVATE-GUEST",
        ),
      );
      await expect
        .poll(
          async () =>
            (await events()).filter((e) => e[1] === "view_item").length,
        )
        .toBe(1);
      await page
        .getByRole("button", { name: "Add to Cart", exact: true })
        .first()
        .click();
      assert((await events()).some((e) => e[1] === "add_to_cart"));
      await page
        .getByRole("button", { name: "Cart, 1 items", exact: true })
        .click();
      await expect(page.getByRole("dialog")).toContainText("Local fixture 01");
      await page
        .getByRole("button", { name: "Remove Local fixture 01", exact: true })
        .click();
      await expect(page.getByRole("dialog")).toContainText(
        "Your cart is empty.",
      );
      await page.getByRole("button", { name: "Close", exact: true }).click();
      assert((await events()).some((e) => e[1] === "remove_from_cart"));
      await page
        .getByRole("button", { name: "Add to Cart", exact: true })
        .first()
        .click();
      for (const e of await events()) {
        assert(!JSON.stringify(e).includes("PRIVATE-GUEST"));
        assert(!JSON.stringify(e).includes("?"));
        assert.notEqual(e[1], "purchase");
      }
    });
    await test("shared cart creates a persisted guest request with server prices and a recoverable reference", async () => {
      await page
        .getByRole("button", { name: "Cart, 1 items", exact: true })
        .click();
      await expect(page.getByRole("dialog")).toContainText("Local fixture 01");
      await page.getByLabel("Quantity for Local fixture 01").fill("2");
      await page
        .getByRole("button", { name: "Review & save a request", exact: true })
        .click();
      await expect(
        page.getByRole("heading", {
          name: "Order / quotation request",
          exact: true,
        }),
      ).toBeVisible();
      await page
        .getByLabel("Your name", { exact: true })
        .fill("Local guest fixture");
      await page
        .getByLabel("Contact / WhatsApp number", { exact: true })
        .fill("+12025550123");
      await page
        .getByLabel("Optional request note")
        .fill("Synthetic local request only");
      await page.getByLabel(/I agree that M Murad Sons/).check();
      await expect(
        page.getByRole("button", { name: "Submit request", exact: true }),
      ).toBeEnabled();
      await capture(page, "cart-request-desktop");
      await page
        .getByRole("button", { name: "Submit request", exact: true })
        .click();
      await expect(
        page.getByRole("heading", { name: "Request received", exact: true }),
      ).toBeVisible();
      submitted = await page
        .getByRole("dialog")
        .locator("strong")
        .filter({ hasText: /MMS-/ })
        .innerText();
      orderId = f.sql(
        `SELECT id FROM public.order_requests WHERE reference=${f.literal(submitted)};`,
      );
      const detail = s.rpc("admin_order_request", { p_id: orderId });
      assert.equal(Number(detail.items[0].unit_price), 100);
      assert.equal(Number(detail.items[0].line_subtotal), 200);
      assert.equal(detail.request_status, "received");
      const stored = await page.evaluate(() =>
        JSON.stringify({ ...localStorage, ...sessionStorage }),
      );
      assert(!stored.includes("12025550123"));
      assert(!stored.includes("Local guest fixture"));
      const names = (await events()).map((e) => e[1]);
      assert(
        names.includes("begin_order_request") &&
          names.includes("order_request_submitted"),
      );
      assert(!names.includes("purchase"));
      await capture(page, "request-receipt-desktop");
      await page.getByRole("button", { name: "Close", exact: true }).click();
    });
    await test("idempotent public retries cannot duplicate records or reveal another guest receipt", async () => {
      o.resetLimits();
      const ctx = await browser.newContext({ baseURL: base }),
        token = await session(ctx),
        products = await preview(ctx, token, [s.products[0].id]);
      await new Promise((r) => setTimeout(r, 2100));
      const request = body(products);
      const [a, b] = await Promise.all([
        submit(ctx, token, request),
        submit(ctx, token, request),
      ]);
      assert.equal(a.status(), 201);
      assert.equal(b.status(), 201);
      const receipt = await a.json();
      assert.equal((await b.json()).reference, receipt.reference);
      assert.equal(
        f.sql(
          `SELECT count(*) FROM public.order_requests WHERE reference=${f.literal(receipt.reference)};`,
        ),
        "1",
      );
      assert.equal(
        (
          await submit(ctx, token, {
            ...request,
            customer_name: "Changed guest fixture",
          })
        ).status(),
        409,
      );
      const stranger = await browser.newContext({ baseURL: base });
      await session(stranger);
      const read = await stranger.request.get(
        `/api/order-requests/receipt?key=${request.idempotency_key}`,
      );
      assert.equal((await read.json()).receipt, null);
      const own = await ctx.request.get(
        `/api/order-requests/receipt?key=${request.idempotency_key}`,
      );
      assert.equal((await own.json()).receipt.reference, receipt.reference);
      assert(!JSON.stringify(await own.json()).includes("12025550123"));
      await ctx.close();
      await stranger.close();
    });
    await test("withdrawn, changed and out-of-stock selections fail safely with no record", async () => {
      o.resetLimits();
      const ctx = await browser.newContext({ baseURL: base }),
        token = await session(ctx);
      const products = await preview(ctx, token, [s.products[4].id]);
      await new Promise((r) => setTimeout(r, 2100));
      const request = body(products);
      s.rpc("return_catalog_to_draft", {
        kind: "product",
        entity_id: s.products[4].id,
        expected_version: s.version("products", s.products[4].id),
      });
      assert.equal((await submit(ctx, token, request)).status(), 409);
      s.publish("product", s.products[4].id, { price: true, index: true });
      const changed = await submit(ctx, token, request);
      assert.equal(changed.status(), 409);
      assert.equal((await changed.json()).code, "ORDER_SELECTION_CHANGED");
      const stock = await preview(ctx, token, [s.products[2].id]);
      assert.equal((await submit(ctx, token, body(stock))).status(), 409);
      await ctx.close();
    });
    await test("quotation-only products use shared selection and persist without fixed prices", async () => {
      o.resetLimits();
      await page.goto("/product/local-fixture-16");
      await page
        .getByRole("link", { name: "Request Rate", exact: true })
        .first()
        .click();
      await expect(
        page.getByRole("heading", {
          name: "Rate / availability enquiry",
          exact: true,
        }),
      ).toBeVisible();
      await page.getByLabel("Requested quantity").fill("3");
      await page
        .getByRole("button", { name: "Review & save a request", exact: true })
        .click();
      await expect(
        page.getByRole("heading", { name: "Order / quotation request" }),
      ).toBeVisible();
      await expect(page.getByLabel("Request type")).toHaveValue("quotation");
      await page
        .getByLabel("Your name", { exact: true })
        .fill("Local quotation fixture");
      await page
        .getByLabel("Contact / WhatsApp number", { exact: true })
        .fill("+12025550124");
      await page.getByLabel(/I agree that M Murad Sons/).check();
      await expect(
        page.getByRole("button", { name: "Submit request", exact: true }),
      ).toBeEnabled();
      await capture(page, "quotation-request-desktop");
      await page
        .getByRole("button", { name: "Submit request", exact: true })
        .click();
      await expect(
        page.getByRole("heading", { name: "Request received", exact: true }),
      ).toBeVisible();
      const ref = await page
        .getByRole("dialog")
        .locator("strong")
        .filter({ hasText: /MMS-/ })
        .innerText();
      const id = f.sql(
        `SELECT id FROM public.order_requests WHERE reference=${f.literal(ref)};`,
      );
      const quote = s.rpc("admin_order_request", { p_id: id });
      assert.equal(quote.request_kind, "quotation");
      assert.equal(quote.items[0].unit_price, null);
      assert.equal(quote.items[0].quantity, 3);
      assert((await events()).some((e) => e[1] === "quotation_request"));
      await page.getByRole("button", { name: "Close", exact: true }).click();
    });
    await test("guest and Editor cannot read or mutate customer order records", async () => {
      for (const role of [null, "ordinary", "editor"]) {
        const ctx = await browser.newContext({ baseURL: base });
        if (role) {
          const token = f.issue(role);
          await ctx.addCookies([
            {
              name: "murad-admin-session",
              value:
                "base64-" +
                Buffer.from(JSON.stringify(token)).toString("base64url"),
              domain: "127.0.0.1",
              path: "/admin",
              httpOnly: true,
              sameSite: "Strict",
            },
          ]);
        }
        await ctx.request.get("/admin/login");
        const csrf = (await ctx.cookies()).find(
          (c) => c.name === "murad-admin-csrf",
        )?.value;
        assert.equal(
          (
            await ctx.request.post("/admin/orders/query", {
              headers: {
                Origin: base,
                "Content-Type": "application/json",
                "X-CSRF-Token": csrf || "0".repeat(64),
              },
              data: { query: "Local guest" },
            })
          ).status(),
          403,
        );
        assert.equal(
          (
            await ctx.request.post("/admin/orders/status", {
              headers: {
                Origin: base,
                "Content-Type": "application/json",
                "X-CSRF-Token": csrf || "0".repeat(64),
              },
              data: {
                id: orderId,
                version: 1,
                status: "closed",
                note: "",
                confirm: true,
              },
            })
          ).status(),
          403,
        );
        const raw = await fetch(f.url + "/rest/v1/order_requests?select=*", {
          headers: {
            apikey: "local-test-publishable-key",
            Authorization: "Bearer local-test-publishable-key",
          },
        });
        assert.equal(raw.status, 403);
        await ctx.close();
      }
    });
    await test("Admin privately searches, reviews snapshots and updates request status with history/version checks", async () => {
      const admin = await browser.newContext({
          baseURL: base,
          viewport: { width: 1440, height: 1000 },
        }),
        p = await admin.newPage();
      await p.goto("/admin/login");
      await p.getByLabel("Email address").fill("admin@murad.test");
      await p.getByLabel("Password", { exact: true }).fill(fixturePassword);
      await p.getByRole("button", { name: "Sign in securely" }).click();
      await expect(
        p.getByRole("heading", { name: "Store overview" }),
      ).toBeVisible();
      await p
        .getByRole("link", { name: "Order requests", exact: true })
        .click();
      await expect(
        p.getByRole("heading", { name: "Order & quotation requests" }),
      ).toBeVisible();
      await p.getByLabel("Search reference or customer").fill("Local guest");
      await p
        .getByRole("button", { name: "Search requests", exact: true })
        .click();
      await expect(
        p.getByRole("link", { name: submitted, exact: true }),
      ).toBeVisible();
      assert(!p.url().includes("Local"));
      await capture(p, "admin-requests-desktop");
      await p.getByRole("link", { name: submitted, exact: true }).click();
      await expect(
        p.getByRole("heading", { name: submitted, exact: true }),
      ).toBeVisible();
      await expect(
        p.getByRole("heading", { name: "Submitted product snapshot" }),
      ).toBeVisible();
      await p.getByLabel("New request status").selectOption("in_review");
      await p
        .getByLabel("Private activity note")
        .fill("Local review; no payment confirmed.");
      await p.getByLabel("I confirm this request status update.").check();
      await p
        .getByRole("button", { name: "Update request status", exact: true })
        .click();
      await expect(
        p.getByRole("heading", { name: submitted, exact: true }),
      ).toBeVisible();
      await expect(p.locator("main")).toContainText("in review");
      const csrf = (await admin.cookies()).find(
        (c) => c.name === "murad-admin-csrf",
      )?.value;
      const stale = await admin.request.post("/admin/orders/status", {
        headers: {
          Origin: base,
          "Content-Type": "application/json",
          "X-CSRF-Token": csrf,
        },
        data: {
          id: orderId,
          version: 1,
          status: "cancelled",
          note: "",
          confirm: true,
        },
      });
      assert.equal(stale.status(), 409);
      await capture(p, "admin-request-desktop");
      await p.setViewportSize({ width: 390, height: 844 });
      await p.goto("/admin/orders");
      await expect(
        p.getByRole("heading", { name: "Order & quotation requests" }),
      ).toBeVisible();
      assert(
        await p.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      );
      await capture(p, "admin-requests-mobile");
      await p.goto(`/admin/orders/${orderId}`);
      await expect(
        p.getByRole("heading", { name: submitted, exact: true }),
      ).toBeVisible();
      assert(
        await p.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      );
      await capture(p, "admin-request-mobile");
      assert.equal(
        await p.locator('script[src*="googletagmanager"]').count(),
        0,
      );
      await admin.close();
    });
    await test("database-backed spam limits reject additional unique submissions but permit safe replay", async () => {
      o.resetLimits();
      const ctx = await browser.newContext({ baseURL: base }),
        token = await session(ctx),
        products = await preview(ctx, token, [s.products[0].id]);
      await new Promise((r) => setTimeout(r, 2100));
      let first, last;
      for (let i = 0; i < 6; i++) {
        const request = body(products);
        if (!first) first = request;
        last = await submit(ctx, token, request);
      }
      assert.equal(last.status(), 429);
      assert.match(last.headers()["retry-after"], /\d+/);
      assert.equal((await submit(ctx, token, first)).status(), 201);
      await ctx.close();
    });
    await test("SEO, withdrawal, canonical and structured-data protection remain in place", async () => {
      const r = await context.request.get("/product/private-draft-sentinel");
      assert.equal(r.status(), 404);
      await page.goto("/product/local-fixture-1?filter=1");
      await expect(page.locator("link[rel=canonical]")).toHaveAttribute(
        "href",
        base + "/product/local-fixture-1",
      );
      assert.match(
        await page.locator("meta[name=robots]").first().getAttribute("content"),
        /noindex/,
      );
      const ld = await page
        .locator('script[type="application/ld+json"]')
        .allTextContents();
      assert(ld.map(JSON.parse).some((x) => x["@type"] === "BreadcrumbList"));
      assert(!ld.map(JSON.parse).some((x) => x["@type"] === "Product"));
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
    await test("site search analytics never includes raw search text", async () => {
      await page.goto("/search?q=%2B12025550123");
      await expect
        .poll(
          async () => (await events()).filter((e) => e[1] === "search").length,
        )
        .toBe(1);
      assert(!JSON.stringify(await events()).includes("12025550123"));
      assert(!JSON.stringify(await events()).includes("search_term"));
    });
    await test("consent withdrawal and browser privacy signals suppress analytics", async () => {
      await page.goto("/privacy");
      await page
        .getByRole("button", {
          name: "Decline / withdraw analytics",
          exact: true,
        })
        .click();
      await expect
        .poll(() => page.evaluate(() => window.__muradAnalyticsAllowed))
        .toBe(false);
      const before = (await events()).length;
      await page.evaluate(() =>
        window.dispatchEvent(new MouseEvent("click", { bubbles: true })),
      );
      assert.equal((await events()).length, before);
      const privateCtx = await browser.newContext({ baseURL: base });
      await privateCtx.addInitScript(() => {
        Object.defineProperty(navigator, "globalPrivacyControl", {
          value: true,
        });
        localStorage.setItem("murad-analytics-consent-v1", "granted");
      });
      const p = await privateCtx.newPage();
      let external = 0;
      await privateCtx.route("**/*googletagmanager.com/**", (route) => {
        external++;
        return route.abort();
      });
      await p.goto("/product/local-fixture-1");
      await expect(
        p.getByRole("heading", { name: "Local fixture 01", exact: true }),
      ).toBeVisible();
      assert.equal(external, 0);
      await privateCtx.close();
    });
    await test("mobile storefront and cart request review retain working responsive layouts", async () => {
      const mobile = await browser.newContext({
          baseURL: base,
          viewport: { width: 390, height: 844 },
          isMobile: true,
          hasTouch: true,
        }),
        p = await mobile.newPage();
      for (const [path, name] of [
        ["/", "home-mobile"],
        ["/category/sanitary", "sanitary-mobile"],
      ]) {
        await p.goto(path);
        await expect(
          p.getByRole("heading", { level: 1 }).first(),
        ).toBeVisible();
        assert(
          await p.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
          path,
        );
        await capture(p, name);
      }
      await p.goto("/product/local-fixture-1");
      await p
        .getByRole("button", { name: "Add to Cart", exact: true })
        .first()
        .click();
      await p
        .getByRole("button", { name: "Cart, 1 items", exact: true })
        .click();
      await p
        .getByRole("button", { name: "Review & save a request", exact: true })
        .click();
      await expect(
        p.getByRole("heading", { name: "Order / quotation request" }),
      ).toBeVisible();
      const dialog = p.getByRole("dialog");
      assert(
        await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth + 2),
      );
      await dialog.evaluate((el) => {
        el.scrollTop = 0;
      });
      await p.screenshot({
        path: "docs/phase6/screenshots/cart-request-mobile.png",
        fullPage: false,
      });
      await p
        .getByRole("button", { name: "Submit request", exact: true })
        .scrollIntoViewIfNeeded();
      await expect(
        p.getByRole("button", { name: "Submit request", exact: true }),
      ).toBeVisible();
      await p.screenshot({
        path: "docs/phase6/screenshots/cart-request-mobile-submit.png",
        fullPage: false,
      });
      await mobile.close();
    });
    console.log(
      `Phase 6 browser: ${groups} order, privacy, analytics, SEO and Admin groups passed; 13 desktop/mobile screenshots captured.`,
    );
  } finally {
    await context.close();
    await browser.close();
  }
}
