# Phase 6 file inventory

Relative to `development/storefront-integration`: **63 files** (16 modified, 47 new).

One additive guarded migration is added: `20261108000800_order_requests.sql`. Existing approved assets/CSS, historic review artifacts and earlier migrations remain unchanged. No environment values, private guest/operator cookies, real customer data or production credentials are included.

## Modified files

```text
.gitignore
eslint.config.mjs
package.json
scripts/phase3/local-fixture.mjs
scripts/process-catalog-invalidations.mjs
src/app/layout.tsx
src/components/admin/Navigation.tsx
src/components/catalog/CatalogPage.tsx
src/components/catalog/Shopping.tsx
src/components/home/ReferenceStorefront.tsx
src/components/sanitary/shop-state.ts
src/lib/storefront/server.ts
src/lib/storefront/types.ts
src/proxy.ts
tests/phase5/browser.mjs
vercel.json
```

## New files

```text
docs/phase6/README.md
docs/phase6/comparison.json
docs/phase6/files.md
docs/phase6/google-and-analytics.md
docs/phase6/release-readiness.md
docs/phase6/screenshots/admin-request-desktop.png
docs/phase6/screenshots/admin-request-mobile.png
docs/phase6/screenshots/admin-requests-desktop.png
docs/phase6/screenshots/admin-requests-mobile.png
docs/phase6/screenshots/cart-request-desktop.png
docs/phase6/screenshots/cart-request-mobile-submit.png
docs/phase6/screenshots/cart-request-mobile.png
docs/phase6/screenshots/home-desktop.png
docs/phase6/screenshots/home-mobile.png
docs/phase6/screenshots/quotation-request-desktop.png
docs/phase6/screenshots/request-receipt-desktop.png
docs/phase6/screenshots/sanitary-desktop.png
docs/phase6/screenshots/sanitary-mobile.png
docs/phase6/security-and-data.md
scripts/test-phase6.mjs
src/app/admin/(protected)/orders/[id]/page.tsx
src/app/admin/(protected)/orders/page.tsx
src/app/admin/orders/query/route.ts
src/app/admin/orders/status/route.ts
src/app/api/order-requests/preview/route.ts
src/app/api/order-requests/receipt/route.ts
src/app/api/order-requests/route.ts
src/app/api/order-requests/session/route.ts
src/app/privacy/page.tsx
src/components/analytics/Analytics.tsx
src/components/analytics/Setup.tsx
src/components/orders/AdminOrders.tsx
src/components/orders/OrderRequestForm.tsx
src/components/orders/orders.css
src/instrumentation.ts
src/lib/analytics/config.ts
src/lib/analytics/events.ts
src/lib/monitoring/events.ts
src/lib/orders/contracts.ts
src/lib/orders/security.ts
src/lib/orders/server.ts
supabase/migrations/20261108000800_order_requests.sql
tests/phase6/browser.mjs
tests/phase6/database.mjs
tests/phase6/fixture.mjs
tests/phase6/unit.test.ts
tsconfig.phase6.json
```

Regression screenshot output for Phase 5 now uses an ignored work directory. The operator cookie utility remains local/explicit-staging only; it is not a production scheduler credential.
