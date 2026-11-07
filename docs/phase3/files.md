# Phase 3 file inventory

Changes are relative to `development/seo-commerce`, not main. No existing storefront component, approved artwork, Phase 2 migration or Phase 2 publication-policy file is modified.

## Modified files

| File | Change |
| --- | --- |
| `.gitignore` | Ignore compiled Phase 3 test output |
| `eslint.config.mjs` | Exclude generated test JavaScript |
| `package.json` | Supabase SSR/Zod dependencies, Playwright dev dependency and Phase 3 test commands |
| `package-lock.json` | Dependency lock updates |
| `vercel.json` | Disable Git deployment for `development/admin-dashboard`, retaining the Phase 2 exclusion |

## New application files

```text
src/proxy.ts
src/app/admin/layout.tsx
src/app/admin/admin.css
src/app/admin/error.tsx
src/app/admin/login/page.tsx
src/app/admin/actions/[action]/route.ts
src/app/admin/(protected)/layout.tsx
src/app/admin/(protected)/page.tsx
src/app/admin/(protected)/products/page.tsx
src/app/admin/(protected)/products/new/page.tsx
src/app/admin/(protected)/products/[id]/page.tsx
src/app/admin/(protected)/products/[id]/preview/page.tsx
src/app/admin/(protected)/catalog/page.tsx
src/app/admin/(protected)/media/page.tsx
src/app/admin/(protected)/imports/page.tsx
src/app/admin/(protected)/settings/page.tsx
src/components/admin/Navigation.tsx
src/components/admin/MutationForm.tsx
src/components/admin/ProductEditor.tsx
src/components/admin/ProductWorkflow.tsx
src/components/admin/shared.tsx
src/lib/admin/config.ts
src/lib/admin/data.ts
src/lib/admin/security.ts
src/lib/admin/supabase-server.ts
src/lib/admin/validation.ts
```

## New database, validation and review files

```text
supabase/migrations/20261108000300_admin_operations.sql
scripts/phase3/local-fixture.mjs
scripts/test-phase3.mjs
tests/phase3/policy.test.ts
tests/phase3/browser.mjs
tsconfig.phase3.json
docs/phase3/README.md
docs/phase3/operator-guide.md
docs/phase3/files.md
docs/phase3/screenshots/login-desktop.png
docs/phase3/screenshots/overview-desktop.png
docs/phase3/screenshots/editor-desktop.png
docs/phase3/screenshots/overview-mobile.png
docs/phase3/screenshots/products-mobile.png
docs/phase3/screenshots/editor-mobile.png
```

The local fixture is test-only: synthetic accounts, isolated PostgreSQL and loopback HTTP contracts. It is not an application authentication fallback or a production seed. The migration is staged for review and local tests only; it is not applied to production.
