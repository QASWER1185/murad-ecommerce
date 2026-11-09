// Empty business release only: no database, Auth, Storage or production access.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { chromium, expect } from '@playwright/test';
import sharp from 'sharp';

const dir = 'work/phase5-empty-business'; mkdirSync(dir, { recursive: true });
const unexpectedBackendCalls = [];
const trap = createServer((request, response) => { unexpectedBackendCalls.push(request.url); response.writeHead(500); response.end('Unexpected backend access'); });
await new Promise(resolve => trap.listen(0, '127.0.0.1', resolve));
const backend = `http://127.0.0.1:${trap.address().port}`, base = 'http://127.0.0.1:3100';
const env = { ...process.env };
for (const key of Object.keys(env)) if (/^(ADMIN_|CATALOG_|ORDER_|ANALYTICS_|GA4_|SUPABASE_|VERCEL_|BUSINESS_|NEXT_PUBLIC_SUPABASE_)/.test(key)) delete env[key];
Object.assign(env, { NEXT_TELEMETRY_DISABLED: '1', BUSINESS_SITE_MODE: 'empty-catalog', BUSINESS_SITE_ORIGIN: base,
  // Deliberately conflicting enable flags prove the empty-site guard is authoritative.
  CATALOG_ENABLED: 'true', CATALOG_ENVIRONMENT: 'local', CATALOG_SITE_ORIGIN: base, CATALOG_SUPABASE_URL: backend, CATALOG_SUPABASE_PUBLISHABLE_KEY: 'local-test-only',
  ADMIN_ENABLED: 'true', ADMIN_ENVIRONMENT: 'local', ADMIN_SITE_ORIGIN: base, ADMIN_SUPABASE_URL: backend, ADMIN_SUPABASE_PUBLISHABLE_KEY: 'local-test-only', ADMIN_RATE_LIMIT_SECRET: 'b'.repeat(64),
  ORDER_REQUESTS_ENABLED: 'true', CATALOG_MEDIA_ENABLED: 'true', CATALOG_INDEXING_ENABLED: 'true', CATALOG_WORKER_ENABLED: 'true', ANALYTICS_ENABLED: 'true',
  NEXT_PUBLIC_SUPABASE_URL: backend, NEXT_PUBLIC_SUPABASE_ANON_KEY: 'local-test-only' });
let app, browser, log = '', checks = 0, heroComparisons = 0;
const results = [];
const check = async (name, run) => { await run(); checks++; results.push(name); console.log(`PASS ${name}`); };
try {
  app = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '--hostname', '127.0.0.1', '--port', '3100'], { env, stdio: ['ignore', 'pipe', 'pipe'] });
  for (const stream of [app.stdout, app.stderr]) stream.on('data', data => { log = (log + data).slice(-12000); });
  let ready = false;
  for (let i = 0; i < 100; i++) { if (app.exitCode !== null) throw Error(log); try { if ((await fetch(base)).ok) { ready = true; break; } } catch {} await new Promise(r => setTimeout(r, 200)); }
  assert(ready);
  browser = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] });
  const context = await browser.newContext({ baseURL: base, viewport: { width: 1200, height: 900 } });
  const outsideRequests = [];
  await context.route('**/*', route => { const url = new URL(route.request().url()); if (url.hostname === 'wa.me') return route.fulfill({ contentType: 'text/html', body: 'WhatsApp test intercepted; no message sent.' }); if (url.origin !== base) { outsideRequests.push(url.origin); return route.abort(); } return route.continue(); });
  const page = await context.newPage(), errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const settle = async () => { await page.waitForLoadState('networkidle'); await page.evaluate(async () => { await document.fonts.ready; await Promise.all(Array.from(document.images, i => i.decode().catch(() => {}))); }); };
  await check('Empty-mode guards override catalog/Admin/worker enable flags without touching a backend', async () => {
    const { readAdminConfig } = await import('../src/lib/admin/config.ts');
    const { storefrontConfig } = await import('../src/lib/storefront/config.ts');
    const { workerConfig } = await import('../src/lib/worker/contracts.ts');
    assert.equal(readAdminConfig(env), null); assert.equal(storefrontConfig(env), null); assert.equal(workerConfig(env), null);
    assert.equal((await context.request.get('/api/catalog/cart')).status(), 404);
    assert.equal((await (await context.request.get('/api/order-requests/session')).json()).enabled, false);
    assert.equal((await context.request.post('/api/order-requests', { data: {} })).status(), 503);
    assert.equal((await context.request.get('/media/catalog/00000000-0000-0000-0000-000000000001/320')).status(), 404);
    const admin = await context.request.get('/admin'); assert.equal(admin.status(), 503);
    await page.goto('/admin/login'); await expect(page.locator('form')).toHaveCount(0);
    assert.equal(unexpectedBackendCalls.length, 0);
  });
  const categories = ['sanitary', 'electric', 'building-material', 'imported-products'];
  const brands = ['faisal-sanitary', 'porta', 'dell-ceramics', 'popular-pipes', 'duramax', 'duraflow', 'imported-china'];
  await check('All approved category and brand routes render graceful empty pages with accurate SEO', async () => {
    const titles = new Set();
    for (const path of [...categories.map(s => `/category/${s}`), ...brands.map(s => `/brand/${s}`)]) {
      const response = await page.goto(path); assert.equal(response.status(), 200, path); await settle();
      await expect(page.getByRole('region', { name: 'Product catalogue information' })).toBeVisible();
      await expect(page.locator('article')).toHaveCount(0);
      await expect(page.getByRole('button', { name: /Cart|Checkout|Wishlist/i })).toHaveCount(0);
      const title = await page.title(); assert(!titles.has(title)); titles.add(title); assert(!title.includes('not found'));
      assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'), base + path);
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
      assert(!/PKR\s*[\d,]+/.test(await page.locator('main').innerText()));
      assert(!(await page.locator('main').innerText()).includes('Collection image will be added'));
    }
    for (const path of ['/product/local-fixture-1', '/product/unknown', '/category/not-a-category', '/brand/not-a-brand', '/category/sanitary?page=2', '/checkout', '/api/payments']) assert.equal((await context.request.get(path)).status(), 404, path);
  });
  await check('Homepage/navigation/directories publish Sanitary, Electrical, Building Materials in order and retain Imported', async () => {
    await page.goto('/'); await settle();
    const tiles = await page.getByRole('region', { name: 'Shop by category' }).locator('a').evaluateAll(a => a.map(x => new URL(x.href).pathname));
    assert.deepEqual(tiles.slice(0, 3), categories.slice(0, 3).map(s => `/category/${s}`));
    const nav = await page.getByRole('navigation', { name: 'Product categories' }).locator('a[href^="/category/"]').evaluateAll(a => a.map(x => new URL(x.href).pathname));
    assert.deepEqual(nav, categories.map(s => `/category/${s}`));
    const links = [...new Set(await page.locator('a[href^="/"]').evaluateAll(a => a.map(x => new URL(x.href).pathname)))];
    for (const link of links) assert.equal((await context.request.get(link)).status(), 200, link);
    await expect(page.locator('article')).toHaveCount(0); await expect(page.getByRole('region', { name: 'Product catalogue information' })).toBeVisible();
    for (const number of ['0321-7165000', '0308-6235608']) await expect(page.locator('footer').getByRole('link', { name: number, exact: true })).toBeVisible();
    await page.goto('/categories');
    assert.deepEqual(await page.locator('.catalog-directory a').evaluateAll(a => a.map(x => new URL(x.href).pathname)), categories.map(s => `/category/${s}`));
    await page.goto('/brands'); await expect(page.locator('.business-brand-logo')).toHaveCount(brands.length);
    await page.goto('/search?q=Porta'); await expect(page.getByRole('region', { name: 'Product catalogue information' })).toBeVisible();
  });
  await check('Both WhatsApp contacts and building-material today-rate enquiries work without sending messages', async () => {
    await page.goto('/category/building-material');
    const region = page.getByRole('region', { name: 'Product catalogue information' });
    for (const [label, digits] of [['0321-7165000', '923217165000'], ['0308-6235608', '923086235608']]) {
      const link = region.getByRole('link', { name: `WhatsApp ${label}`, exact: true });
      const url = new URL(await link.getAttribute('href')); assert.equal(url.hostname, 'wa.me'); assert.equal(url.pathname, `/${digits}`); assert(url.searchParams.get('text').includes("today's rates"));
      const opening = context.waitForEvent('page'); await link.click(); const popup = await opening; await popup.waitForLoadState(); assert.equal(new URL(popup.url()).hostname, 'wa.me'); await popup.close();
    }
    await expect(page.getByRole('button', { name: /Cart|Checkout|Wishlist/i })).toHaveCount(0);
  });
  await check('Desktop/mobile screenshots preserve approved hero art and avoid overflow; all products remain absent', async () => {
    for (const [path, name] of [['/', 'home'], ['/category/sanitary', 'sanitary'], ['/category/electric', 'electrical'], ['/category/building-material', 'materials'], ['/category/imported-products', 'imported'], ['/brand/porta', 'brand-porta']]) {
      for (const width of name === 'home' || name === 'sanitary' ? [1200, 390] : [390]) {
        await page.setViewportSize({ width, height: width === 1200 ? 900 : 844 }); await page.goto(path); await settle();
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1), `${name}-${width}`);
        await page.screenshot({ path: `${dir}/${name}-${width}.png`, fullPage: true });
        if (['home', 'sanitary'].includes(name)) {
          const old = `work/phase5-launch/before-${name}-${width === 1200 ? 'desktop' : 'mobile'}-hero.png`;
          if (existsSync(old)) { const now = await page.locator('section[class*="hero"]').first().screenshot(); const a = await sharp(old).raw().toBuffer({ resolveWithObject: true }), b = await sharp(now).raw().toBuffer({ resolveWithObject: true }); assert.deepEqual(a.info, b.info); assert(a.data.equals(b.data)); heroComparisons++; }
        }
        await expect(page.locator('article')).toHaveCount(0);
      }
    }
    await page.setViewportSize({ width: 320, height: 844 }); await page.goto('/'); await settle(); assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    assert.deepEqual(errors, []); assert.deepEqual(outsideRequests, []); assert.deepEqual(unexpectedBackendCalls, []);
  });
  writeFileSync(`${dir}/results.json`, JSON.stringify({ timestamp: new Date().toISOString(), runtime: process.version, checks, results, heroComparisons, backendRequests: unexpectedBackendCalls.length, outsideBrowserRequests: outsideRequests.length, productRecordsPublished: 0, productionOperations: 0, requiresDatabaseMigration: false, adminEnabled: false, cartCheckoutWishlistPaymentsEnabled: false }, null, 2) + '\n');
} catch (error) { console.error(log.slice(-4000)); throw error; }
finally { await browser?.close(); app?.kill('SIGTERM'); if (app && app.exitCode === null) await new Promise(resolve => app.once('exit', resolve)); await new Promise(resolve => trap.close(resolve)); }
