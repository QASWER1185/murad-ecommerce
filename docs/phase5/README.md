# Phase 5 — storefront and central catalog integration

Branch: `development/storefront-integration`, based on Phase 4 `bc50bfcd72cd7fbc26c410f6a47bf8e7ae58a2ef`. The Draft PR targets `development/product-import-media`. Work stops after Phase 5.

No production Supabase connection, Auth configuration, account provisioning, migration, merge or deployment is included. Development Git deployment remains disabled. Existing sample rows and IDs remain unchanged and unverified; they are not automatically published.

## Delivered

- The active homepage no longer imports a hardcoded product inventory. Featured products, genuine approved galleries, nullable verified prices and published brand/category information come from the centralized catalog. Approved static navigation/brand artwork remains presentation content, not a parallel inventory.
- Reusable category, brand, product, directory and search routes use the original `catalog_*_public` projections through anonymous, bounded SQL RPCs. No public path imports the legacy raw-table Supabase client. The RPC assembles one statement snapshot; request-scoped React memoization shares that result between metadata and page rendering, without a cross-request content cache.
- Server-rendered product content, native GET search/filter forms, brand/type/finish/verified availability/price filtering, numeric sorting with unknown prices last, 12-product pagination, child/secondary-category membership, related products, specifications and an interactive responsive gallery. No JavaScript is needed to discover product links or use the GET filters/pagination.
- Shared cart and wishlist state stores only product IDs/quantities. Public product data and current prices are fetched when the drawer opens and checked again before sending a WhatsApp selection. Withdrawn entries disappear; unknown price, quotation and out-of-stock entries require enquiry. This is an enquiry/order-selection foundation, not payment capture or guaranteed order acceptance.
- Product/category/brand withdrawal is enforced in the public projections, admission proxy and image handler. Withdrawal of a primary category, an ancestor category or an attached brand also withdraws affected products and their exclusive media. Quotation mode is inherited from a published parent category.
- Direct 320/640/1280 derivative images, accurate dimensions/alt text and no shared image-optimizer caching. Originals remain private. Public media configuration is independent of Admin configuration; tests serve media with Admin disabled. Production media/indexing remain hard disabled, even if environment opt-ins are set.
- Approved CMS banners can occupy the homepage's existing two banner slots; active banner ordering controls slots. Deactivation restores approved static artwork. Approved taxonomy assets and brand logos flow into the same components. Owner contact settings drive the shopping templates and verified business structured data.
- Admin-only, version-checked homepage-feature selection requires an active Draft and fresh publication review. An old sample's `featured` flag alone cannot expose it.
- Per-route metadata/canonical/Open Graph support, descriptive H1, breadcrumb links and `BreadcrumbList`, eligible Product/Offer generation without reviews/ratings, verified public business `Store` schema, XML sitemap/robots preparation and permanent public-only 308 redirects. In this development phase all pages/media remain noindex, robots disallows crawling and the sitemap is empty.
- Reliable invalidation outbox claim/ack with exclusive leases, bounded batches, retries, backoff and audit retention. Current public reads use `no-store` regardless of worker availability. An authorized Admin workspace drains events; an operator utility supports bounded authenticated processing without service-role credentials.

## Approved design and comparison

Only the selected Sanitary PR #2 stylesheet, extracted assets, shopping-state hook and brand/type presentation options were reused. Its raw-table loader, client-only catalog filtering, migrations, routes and deployment configuration were **not** merged. Homepage and Sanitary artwork and the Sanitary CSS are retained byte-for-byte; inventory/filter bindings and new functionality are real components.

The homepage comparison uses local before/after captures at 1200 px and 390 px. The Sanitary comparison uses the uploaded approved reference and the PR #2 review captures. Review [visual comparison notes](visual-comparison.md) for measured regions and visible differences. Original manufacturer imagery/verified inventory is still pending; screenshots deliberately use clearly synthetic local fixtures, never published commercial data.

| Page | Desktop (1200 × 900) | Mobile (390 × 844) |
| --- | --- | --- |
| Homepage | [Screenshot](screenshots/home-desktop.png) | [Screenshot](screenshots/home-mobile.png) |
| Sanitary | [Screenshot](screenshots/sanitary-desktop.png) | [Screenshot](screenshots/sanitary-mobile.png) |
| Brand | [Screenshot](screenshots/brand-desktop.png) | [Screenshot](screenshots/brand-mobile.png) |
| Product | [Screenshot](screenshots/product-desktop.png) | [Screenshot](screenshots/product-mobile.png) |

Captures are full-page; viewport heights do not limit scrolling. All images/fonts are awaited. Mobile checks reject page-level horizontal overflow.

## Validation

Final results are recorded after the last code and screenshot pass. Tests use real isolated PostgreSQL RLS and Next.js, with local HTTP Auth/PostgREST/Storage contracts, actual Supabase SDK calls, Playwright and real WebP decoding. They do **not** certify real Supabase GoTrue/JWT/Storage/CDN infrastructure. No separately authorized staging was used.

| Check | Result |
| --- | --- |
| Phase 5 config/query/SEO unit tests | 6 passed |
| Phase 5 public views, filtering, hierarchy, quotation, outbox and withdrawal | 49 PostgreSQL assertions passed |
| Phase 5 actual-app browser security/functional groups | 17 passed |
| Phase 3 foundation against the complete migration stack | 27 assertions passed |
| Phase 4 full media/import regression | 56 DB assertions + 14 browser groups passed |
| Phase 3 authentication/authorization browser regression | 15 groups passed |
| Phase 2 policy/database compatibility regression | 6 unit tests + 67 / 67 database assertions passed |
| Phase 3/4 unit regression | 4 / 7 passed |
| Optimized build / TypeScript | Passed with local overrides and catalog/Admin disabled at build time |
| Production dependency audit | Zero known vulnerabilities at validation time |
| Lint | No errors; 8 pre-existing warnings in unchanged prototype/storefront files |

The browser suite covers all ten agreed category slugs and eight brand slugs using synthetic reviewed fixtures, model search, GET filters, pagination, gallery switching, public derivative privacy, optimizer rejection, canonical/robots/sitemap, HTTP 404 and 308, cart revalidation, warm-response withdrawal, a media-withdrawal race, Admin price editing/review/publication, approved CMS banner activation/deactivation, the outbox operator utility and an independent public-media server with Admin disabled.

```bash
npm ci
npm run test:phase5:unit
npm run test:phase2
npm run test:phase3:unit
npm run test:phase4:unit
npm run lint
CATALOG_ENABLED=false ADMIN_ENABLED=false NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321 NEXT_PUBLIC_SUPABASE_ANON_KEY=phase5-local-test npm run build
npm run test:phase5:e2e
npm run test:phase4:e2e
npm run test:phase3:e2e
```

Run browser suites sequentially: they bind loopback port 3100; Phase 5 also uses 3102 to verify media with Admin disabled. Their uniquely named PostgreSQL containers have no network or published DB ports. Existing Phase 3/4 regression captures go to ignored `work/` directories; historic review artifacts remain unchanged.

## Release blockers and Phase 6 recommendation

1. Review the stacked Draft PRs and staged migration together. Phase 5 has removed the active storefront's raw-table adapters, but the live main branch still uses the old code. Never apply restrictive migrations ahead of the coordinated application release.
2. Obtain separate authorization for a real Supabase staging environment. Test JWT/session/RLS/Storage gateway semantics, CDN/optimizer withdrawal, HTTP status codes, request limits, concurrent mutations, load, backup/restore and hosting configuration. Local contracts do not replace this gate.
3. Choose and configure a trusted invalidation scheduler and monitoring. Admin browsing processes saved events; the operator command can drain the queue independently with an existing authorized session. Neither a scheduler nor a production operator account was provisioned. No-store publication checks protect current reads while the queue is idle.
4. The production media/indexing code gate requires an explicit, separately reviewed release change. Confirm the canonical domain, Search Console, robots/sitemap, actual structured data and image indexing before enabling it. Root/directories/search intentionally remain noindex in this phase; no Google submission occurred.
5. Supply real photographs, unique useful descriptions, manufacturer SKUs/models, verified prices/stock and SEO fields through the Admin workflow. Review collection publication separately. In a migrated empty catalog, unpublished collections correctly return 404 and no sample inventory appears.
6. Phase 6 should complete checkout/order persistence, delivery/quotation rules, analytics/owner Google account integrations, operational monitoring, staging validation and coordinated release readiness while preserving approved designs. No payment processing, stock reservation, deployment or ranking guarantee is part of Phase 5.

Read [configuration, security and recovery](operations.md), [visual comparison](visual-comparison.md) and [complete changed-file inventory](files.md).
