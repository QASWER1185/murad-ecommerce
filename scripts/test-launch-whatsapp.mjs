// Only synthetic data in a new networkless PostgreSQL container and loopback app.
// WhatsApp requests are intercepted; this script never contacts WhatsApp/Supabase.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { chromium, expect } from '@playwright/test';
import sharp from 'sharp';
import { startFixture } from './phase3/local-fixture.mjs';
import { seedCatalog } from '../tests/phase5/fixture.mjs';
import { orderFixture } from '../tests/phase6/fixture.mjs';

const baseline = process.argv.includes('--baseline');
const dir = 'work/phase5-launch';
mkdirSync(dir, { recursive: true });
const f = await startFixture();
let app, browser, log = '', checks = 0, visualComparisons = 0;
const results = [];
async function check(name, test) {
  await test(); checks++; results.push(name); console.log(`PASS ${name}`);
}
const base = 'http://127.0.0.1:3100';
try {
  const s = await seedCatalog(f);
  // Reproduce the actual legacy default: the pending foundation adds an online
  // default to existing categories. Daily-rate materials must still fail closed.
  s.rpc('return_catalog_to_draft', { kind: 'category', entity_id: s.categories['building-material'], expected_version: s.version('categories', s.categories['building-material']) });
  s.taxonomy('category', 'building-material', 'Building Materials', { default_sales_mode: 'online' });
  const extra = [];
  for (const slug of ['cement', 'sand', 'gravel', 'bricks', 'electrical', 'imported']) {
    const quotation = ['cement', 'sand', 'gravel', 'bricks'].includes(slug);
    const category = quotation
      ? s.taxonomy('category', `test-${slug}`, `Local test ${slug}`, { parent_id: s.categories['building-material'], default_sales_mode: 'online' })
      : s.categories[slug === 'electrical' ? 'electric' : 'imported-products'];
    const p = s.save({ name: `Local test ${slug}`, slug: `test-${slug}`, sku: `TEST-${slug.toUpperCase()}`, description: 'Synthetic local test record only; not manufacturer inventory or a commercial price.', category_id: category, price: 123, sales_mode: 'online' });
    s.publish('product', p.id, { price: true });
    extra.push({ ...p, slug, quotation });
  }
  const env = { ...process.env };
  for (const key of Object.keys(env)) if (/^(ADMIN_|CATALOG_|ORDER_|ANALYTICS_|GA4_|SUPABASE_|VERCEL_|NEXT_PUBLIC_SUPABASE_)/.test(key)) delete env[key];
  Object.assign(env, { NEXT_TELEMETRY_DISABLED: '1', ADMIN_ENABLED: 'false', CATALOG_ENABLED: 'true', CATALOG_ENVIRONMENT: 'local', CATALOG_SUPABASE_URL: f.url, CATALOG_SUPABASE_PUBLISHABLE_KEY: 'local-test-publishable-key', CATALOG_SITE_ORIGIN: base, CATALOG_MEDIA_ENABLED: 'true', CATALOG_INDEXING_ENABLED: 'false', ORDER_REQUESTS_ENABLED: 'false', ANALYTICS_ENABLED: 'false', NEXT_PUBLIC_SUPABASE_URL: f.url, NEXT_PUBLIC_SUPABASE_ANON_KEY: 'local-test-publishable-key' });
  app = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '--hostname', '127.0.0.1', '--port', '3100'], { env, stdio: ['ignore', 'pipe', 'pipe'] });
  for (const stream of [app.stdout, app.stderr]) stream.on('data', data => { log = (log + data).slice(-20000); });
  let ready = false;
  for (let i = 0; i < 100; i++) {
    if (app.exitCode !== null) throw Error(log);
    try { if ((await fetch(base)).ok) { ready = true; break; } } catch {}
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  assert(ready, 'Loopback app started');
  browser = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] });
  const context = await browser.newContext({ baseURL: base, viewport: { width: 1200, height: 900 } });
  await context.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.hostname === 'wa.me') return route.fulfill({ contentType: 'text/html', body: '<p>Local WhatsApp link test; no message sent.</p>' });
    if (!['127.0.0.1', 'localhost'].includes(url.hostname)) return route.abort();
    return route.continue();
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  async function settle() {
    await page.waitForLoadState('networkidle');
    await page.evaluate(async () => { await document.fonts.ready; await Promise.all(Array.from(document.images, image => image.decode().catch(() => {}))); });
  }
  async function capture(path, name, width = 1200) {
    await page.setViewportSize({ width, height: width === 1200 ? 900 : 844 });
    await page.goto(path); await settle();
    await page.screenshot({ path: `${dir}/${baseline ? 'before' : 'after'}-${name}.png`, fullPage: true });
    for (const [label, locator] of [['header', page.locator('header').first()], ['hero', page.locator('section[class*="hero"]').first()]]) {
      if (await locator.count()) await locator.screenshot({ path: `${dir}/${baseline ? 'before' : 'after'}-${name}-${label}.png` });
    }
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1), `${name}: no page overflow`);
  }
  if (baseline) {
    for (const [path, name] of [['/', 'home'], ['/category/sanitary', 'sanitary']]) {
      await capture(path, `${name}-desktop`);
      await capture(path, `${name}-mobile`, 390);
    }
    console.log('Captured existing build before the WhatsApp update.');
  } else {
    await check('Anonymous raw tables and role self-assignment denied; published views only', async () => {
      assert.throws(() => f.sql(f.as(null, 'SELECT * FROM public.products;')), /permission denied/);
      assert.throws(() => f.sql(f.as('ordinary', "INSERT INTO app_private.user_roles(user_id,role) VALUES(auth.uid(),'admin');")), /permission denied/);
      for (const role of ['anon', 'authenticated']) assert.equal(f.sql(`SELECT has_table_privilege('${role}','public.products','TRUNCATE');`), 'f');
      assert.equal(f.sql(f.as(null, "SELECT count(*) FROM public.catalog_products_public WHERE slug='private-draft-sentinel';")), '0');
    });
    await check('All four daily-rate materials stay quotation-only even with legacy online category defaults', async () => {
      for (const p of extra.filter(p => p.quotation)) {
        const product = s.rpc('catalog_storefront', { p_kind: 'product', p_slug: `test-${p.slug}`, p_query: {} }, null).entity;
        assert.equal(product.sales_mode, 'quotation'); assert.equal(product.price, null);
        await page.goto(`/product/test-${p.slug}`);
        const detail = page.locator('section[class*="detail"]').first();
        await expect(detail.getByRole('button', { name: 'Add to Cart', exact: true })).toHaveCount(0);
        await expect(detail).not.toContainText('PKR 123');
        const link = detail.getByRole('link', { name: `WhatsApp inquiry for Local test ${p.slug}`, exact: true });
        await expect(link).toContainText('Today’s Rate');
        const text = new URL(await link.getAttribute('href')).searchParams.get('text');
        assert(text.includes("today's rate")); assert(text.includes(`SKU: TEST-${p.slug.toUpperCase()}`));
      }
    });
    await check('Every home/category/brand/search product card has an encoded WhatsApp inquiry', async () => {
      const products = JSON.parse(f.sql('SELECT jsonb_agg(to_jsonb(p)) FROM public.catalog_products_public p;'));
      for (const path of ['/', '/category/sanitary', '/category/electric', '/category/imported-products', '/category/building-material', '/brand/porta', '/search?q=Local']) {
        await page.goto(path); await settle();
        const cards = page.locator('article'); assert(await cards.count() > 0, path);
        for (const card of await cards.all()) {
          const link = card.getByRole('link', { name: /^WhatsApp inquiry for / });
          await expect(link).toHaveCount(1);
          const url = new URL(await link.getAttribute('href')), text = url.searchParams.get('text');
          assert.equal(url.hostname, 'wa.me'); assert.equal(url.pathname, '/923217165000');
          const product = products.find(p => text.includes(`${base}/product/${p.slug}\n`));
          assert(product, 'Canonical product URL included'); assert(text.includes(product.name)); assert(text.includes(`SKU: ${product.sku}`));
        }
      }
    });
    await check('Daily-rate server requests cannot acquire a fixed price through an online intent', async () => {
      const orders = orderFixture(f, s);
      for (const product of extra.filter(p => p.quotation)) {
        const receipt = orders.submit(orders.body([product]));
        assert.equal(receipt.kind, 'quotation');
        const lines = JSON.parse(f.sql(`SELECT jsonb_agg(to_jsonb(i)) FROM public.order_request_items i JOIN public.order_requests r ON r.id=i.request_id WHERE r.reference=${f.literal(receipt.reference)};`));
        assert(lines.length === 1 && lines[0].pricing_mode === 'quotation' && lines[0].unit_price === null && lines[0].line_subtotal === null);
      }
    });
    await check('Priced sanitary/electrical/imported details retain cart plus inquiry', async () => {
      for (const slug of ['local-fixture-1', 'test-electrical', 'test-imported']) {
        await page.goto(`/product/${slug}`);
        const detail = page.locator('section[class*="detail"]').first();
        await expect(detail.getByRole('button', { name: 'Add to Cart', exact: true })).toBeVisible();
        await expect(detail.getByRole('link', { name: /^WhatsApp inquiry for / })).toBeVisible();
      }
      await page.getByRole('button', { name: 'Add to Cart', exact: true }).first().click();
      await page.getByRole('button', { name: /Cart.*1.*items/ }).click();
      await expect(page.getByRole('dialog')).toContainText('Local test imported');
      await page.getByRole('dialog').getByRole('button', { name: 'Close', exact: true }).click();
    });
    await check('Missing-price product stays enquiry-only; unavailable routes fail closed', async () => {
      await page.goto('/product/local-fixture-2');
      const detail = page.locator('section[class*="detail"]').first();
      await expect(detail).toContainText('Request current rate');
      await expect(detail.getByRole('button', { name: 'Add to Cart', exact: true })).toHaveCount(0);
      for (const path of ['/product/private-draft-sentinel', '/product/does-not-exist']) assert.equal((await context.request.get(path)).status(), 404);
    });
    await check('Desktop/mobile general contact and WhatsApp popup work without sending a message', async () => {
      for (const width of [1200, 390, 320]) {
        await page.setViewportSize({ width, height: 844 }); await page.goto('/category/sanitary');
        const contact = page.getByRole('link', { name: 'Contact M Murad Sons on WhatsApp', exact: true });
        const headerContacts = await page.locator('header a[href^="https://wa.me/"]').evaluateAll(links => links.map(link => new URL(link.href).pathname));
        assert(headerContacts.includes('/923217165000') && headerContacts.includes('/923086235608'));
        await expect(contact).toBeVisible();
        const box = await contact.boundingBox(); assert(box.width >= 44 && box.height >= 44);
        const opened = context.waitForEvent('page'); await contact.click();
        const popup = await opened; await popup.waitForLoadState(); assert(new URL(popup.url()).hostname === 'wa.me'); await popup.close();
      }
    });
    await check('Desktop/mobile captures avoid overflow and match available header/hero baselines', async () => {
      await page.evaluate(() => localStorage.removeItem('murad-sanitary-shopping-v1'));
      for (const [path, name] of [['/', 'home'], ['/category/sanitary', 'sanitary']]) {
        for (const [width, label] of [[1200, 'desktop'], [390, 'mobile']]) {
          await capture(path, `${name}-${label}`, width);
          for (const part of ['header', 'hero']) {
            const before = `${dir}/before-${name}-${label}-${part}.png`, after = `${dir}/after-${name}-${label}-${part}.png`;
            if (!existsSync(before)) continue;
            const a = await sharp(before).raw().toBuffer({ resolveWithObject: true }), b = await sharp(after).raw().toBuffer({ resolveWithObject: true });
            assert.deepEqual(b.info, a.info); assert(a.data.equals(b.data), `${name}-${label}-${part}: protected design unchanged`); visualComparisons++;
          }
        }
      }
      await capture('/product/local-fixture-1', 'product-mobile', 390);
      await capture('/category/building-material', 'materials-mobile', 390);
    });
    assert.deepEqual(errors, [], 'No client runtime errors');
    writeFileSync(`${dir}/results.json`, JSON.stringify({ timestamp: new Date().toISOString(), runtime: process.version, scope: 'Networkless local PostgreSQL and loopback browser; synthetic inventory only', checks, results, foundationAssertions: f.assertions, productionOrHostedServicesAccessed: false, whatsAppRequestsIntercepted: true, protectedHeaderHeroComparisons: visualComparisons, baselineComparisonComplete: visualComparisons === 8, hostedStagingTested: false }, null, 2) + '\n');
    console.log(`Completed ${checks} launch groups, plus ${f.assertions} foundation assertions.`);
  }
} catch (error) {
  console.error(log.slice(-5000)); throw error;
} finally {
  await browser?.close(); app?.kill('SIGTERM');
  if (app && app.exitCode === null) await new Promise(resolve => app.once('exit', resolve));
  await f.close();
}
