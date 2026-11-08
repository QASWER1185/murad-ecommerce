# Phase 4 file inventory

Relative to `development/admin-dashboard`: **58 files** (19 modified, 39 new).

Approved homepage/category storefront code and artwork, public layout/components, TypeScript publication helpers, and the existing Phase 2/3 migration files are unchanged. Changes to the local fixture extend its HTTP Storage contracts and RPC allowlist only; there is no application authentication bypass. Historic Phase 3 screenshot artifacts are preserved.

## Modified files

```text
.gitignore
eslint.config.mjs
next.config.ts
package-lock.json
package.json
scripts/phase3/local-fixture.mjs
scripts/test-phase3.mjs
src/app/admin/(protected)/catalog/page.tsx
src/app/admin/(protected)/imports/page.tsx
src/app/admin/(protected)/media/page.tsx
src/app/admin/(protected)/products/[id]/page.tsx
src/app/admin/(protected)/products/[id]/preview/page.tsx
src/app/admin/(protected)/settings/page.tsx
src/app/admin/layout.tsx
src/components/admin/Navigation.tsx
src/components/admin/ProductWorkflow.tsx
src/proxy.ts
tests/phase3/browser.mjs
vercel.json
```

## New files

```text
docs/phase4/README.md
docs/phase4/files.md
docs/phase4/screenshots/banner-desktop.png
docs/phase4/screenshots/brand-desktop.png
docs/phase4/screenshots/gallery-desktop.png
docs/phase4/screenshots/gallery-mobile.png
docs/phase4/screenshots/import-history-mobile.png
docs/phase4/screenshots/import-preview-desktop.png
docs/phase4/screenshots/import-preview-mobile.png
docs/phase4/screenshots/settings-mobile.png
docs/phase4/security-and-recovery.md
scripts/test-phase4.mjs
src/app/admin/(protected)/catalog/[kind]/[id]/page.tsx
src/app/admin/(protected)/imports/[id]/page.tsx
src/app/admin/(protected)/products/[id]/revisions/[revision]/page.tsx
src/app/admin/imports/[id]/report/route.ts
src/app/admin/imports/api/route.ts
src/app/admin/imports/template/route.ts
src/app/admin/manage/[action]/route.ts
src/app/admin/media/api/route.ts
src/app/admin/media/file/[id]/[variant]/route.ts
src/app/admin/phase4.css
src/app/media/catalog/[id]/[variant]/route.ts
src/components/admin/ImportUploader.tsx
src/components/admin/ImportWorkspace.tsx
src/components/admin/MediaManager.tsx
src/components/admin/MediaPanel.tsx
src/lib/admin/request.ts
src/lib/imports/fields.ts
src/lib/imports/normalize.ts
src/lib/imports/spreadsheets.ts
src/lib/media/images.ts
supabase/migrations/20261108000400_catalog_media.sql
supabase/migrations/20261108000500_catalog_content.sql
supabase/migrations/20261108000600_catalog_imports.sql
tests/phase4/browser.mjs
tests/phase4/database.mjs
tests/phase4/unit.test.ts
tsconfig.phase4.json
```

New migrations are staged for review and isolated tests only. No production/staging migration or deployment was performed.
