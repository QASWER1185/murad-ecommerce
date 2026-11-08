# Phase 5 changed-file inventory

Relative to `development/product-import-media`: **96 files** (20 modified, 76 new).

The active storefront uses the central public projections. Existing sample records, approved homepage artwork, historic review screenshots and Phase 2–4 migration files remain unchanged. The Sanitary assets/CSS were selectively reused from PR #2, not merged wholesale.

## Modified files

```text
.gitignore
eslint.config.mjs
package.json
scripts/phase3/local-fixture.mjs
scripts/test-phase4.mjs
src/app/admin/(protected)/layout.tsx
src/app/admin/manage/[action]/route.ts
src/app/category/[slug]/page.tsx
src/app/layout.tsx
src/app/media/catalog/[id]/[variant]/route.ts
src/app/page.tsx
src/components/admin/ProductWorkflow.tsx
src/components/home/ReferenceStorefront.module.css
src/components/home/ReferenceStorefront.tsx
src/components/home/reference-catalog.ts
src/lib/admin/data.ts
src/proxy.ts
tests/phase3/browser.mjs
tests/phase4/browser.mjs
vercel.json
```

## New files

```text
docs/phase5/README.md
docs/phase5/comparison.json
docs/phase5/files.md
docs/phase5/operations.md
docs/phase5/screenshots/brand-desktop.png
docs/phase5/screenshots/brand-mobile.png
docs/phase5/screenshots/home-comparison-desktop.png
docs/phase5/screenshots/home-comparison-mobile.png
docs/phase5/screenshots/home-desktop.png
docs/phase5/screenshots/home-mobile.png
docs/phase5/screenshots/product-desktop.png
docs/phase5/screenshots/product-mobile.png
docs/phase5/screenshots/sanitary-comparison-current.png
docs/phase5/screenshots/sanitary-comparison.png
docs/phase5/screenshots/sanitary-desktop.png
docs/phase5/screenshots/sanitary-mobile.png
docs/phase5/visual-comparison.md
public/sanitary/brand-card-dell.png
public/sanitary/brand-card-faisal.png
public/sanitary/brand-card-imported.png
public/sanitary/brand-card-porta.png
public/sanitary/brand-dell.png
public/sanitary/brand-faisal.png
public/sanitary/brand-imported.png
public/sanitary/brand-porta.png
public/sanitary/cart-symbol.png
public/sanitary/footer-skyline.png
public/sanitary/genuine-symbol.png
public/sanitary/hero-art.png
public/sanitary/logo-footer.png
public/sanitary/logo-header.png
public/sanitary/promotion-art.png
public/sanitary/provenance.json
public/sanitary/shower-symbol.png
public/sanitary/whatsapp-symbol.png
public/sanitary/wishlist-symbol.png
scripts/process-catalog-invalidations.mjs
scripts/test-phase5.mjs
src/app/admin/invalidations/route.ts
src/app/api/catalog/cart/route.ts
src/app/api/catalog/generation/route.ts
src/app/brand/[slug]/page.tsx
src/app/brands/page.tsx
src/app/categories/page.tsx
src/app/error.tsx
src/app/not-found.tsx
src/app/product/[slug]/page.tsx
src/app/robots.ts
src/app/search/page.tsx
src/app/sitemap.ts
src/components/admin/InvalidationProcessor.tsx
src/components/catalog/Breadcrumbs.tsx
src/components/catalog/CatalogPage.tsx
src/components/catalog/Chrome.tsx
src/components/catalog/Directory.tsx
src/components/catalog/Freshness.tsx
src/components/catalog/Gallery.tsx
src/components/catalog/Media.tsx
src/components/catalog/Shopping.tsx
src/components/catalog/catalog.css
src/components/sanitary/SanitaryShop.module.css
src/components/sanitary/catalog-options.ts
src/components/sanitary/shop-state.ts
src/lib/storefront/admission.ts
src/lib/storefront/config.ts
src/lib/storefront/pages.tsx
src/lib/storefront/query.ts
src/lib/storefront/seo.ts
src/lib/storefront/server.ts
src/lib/storefront/types.ts
supabase/migrations/20261108000700_storefront_integration.sql
tests/phase5/browser.mjs
tests/phase5/database.mjs
tests/phase5/fixture.mjs
tests/phase5/unit.test.ts
tsconfig.phase5.json
```

The Phase 3 regression fixture now retains a separately reviewed synthetic parent category during full-form edits, matching the new public visibility policy. Phase 4 regression captures now go to ignored work output rather than rewriting historic review artifacts. No environment values or private fixture cookies are committed.
