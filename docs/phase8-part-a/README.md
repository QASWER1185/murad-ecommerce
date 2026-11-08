# Phase 8 — Part A only

Repository: `QASWER1185/murad-ecommerce`. Branch:
`development/phase8-preflight`, based on Phase 7
`c8f9f701c783a4a7f86b4587f641ba7d964414aa`. Draft PR target:
`development/staging-readiness`. Report timezone: Asia/Karachi.

**Part A is complete locally. Part B has not started.** No real Supabase,
hosting or Google service was accessed/configured; no real account, credential,
worker schedule or external property was provisioned. No PR was merged, no remote
migration/deployment ran, and no production feature/indexing gate was enabled.

## Changes and findings

- Fixed a reproduced offline staging-preflight false positive: normalized
  production/staging origins can no longer differ only by case, `:443` or slash.
  Enabled worker/order capabilities also require valid key identifiers.
- Fixed XLSX validation silently dropping populated/formula/error cells beyond
  the header width. Invalid rows are flagged and preserved in SQL preview errors;
  empty formatting-only cells remain compatible, and no invalid product is created.
- Added strict Admin session-policy shape checks for role/AAL/boolean MFA fields;
  malformed projections fail closed. Existing database/RLS MFA enforcement is not
  bypassed or activated by this change.
- Corrected the template's unused trusted-IP flag to the real disabled selector;
  future key identifiers remain placeholders. Development Git deployment is disabled.
- Added four lossless artwork companions using the existing generator: 408,167→
  303,572 bytes (25.6% smaller). Original PNGs, approved layouts/colors/typography
  and artwork are preserved; no manufacturer image or catalog was invented.
- Audited the complete architecture, all twelve unchanged migrations, roles,
  private media, orders, SEO, analytics, worker and stacked dependency chain.
  Static asset audit found no missing reference; static client checks found no
  private Admin/worker/order configuration dependency.
- Local merge-tree review found seven conflicts in older Sanitary PR #2 against
  Phase 7. It remains unmerged and needs explicit semantic integration review.
- Corrected a test synchronization race by waiting for actual publication success;
  no publication rule, optimistic version check or test timeout was weakened.

## Validation

Twenty-three local validation tasks passed, plus the offline repository audit.
Build and TypeScript pass; lint has zero errors and eight retained legacy warnings.
Full and production dependency audits have zero known vulnerabilities at check time.

| Phase | Unit/policy groups | Local SQL checks | Browser groups |
| --- | ---: | --- | ---: |
| 2 | 6 | 67 legacy + 67 PR #2 compatibility | — |
| 3 | 4 | 27 foundation assertions, also exercised by later fixtures | 15 |
| 4 | 7 | 56 | 14 |
| 5 | 6 | 49 | 17 |
| 6 | 8 | 62 | 15 |
| 7 | 7 | 51 + database/fixture-binary recovery | 10 |
| Part A | 7 | 9 import-boundary + 7 full-stack legacy compatibility | Existing suites reused |

All twelve migrations also rehearse over the legacy PR #2 model/type/finish columns.
All six original sample rows/IDs remain unchanged, Draft and unverified. No migration
was added/edited. The full run and first failure/remediation are documented, not
represented as a first-attempt perfect pass.

Local Auth/PostgREST/Storage HTTP behavior and users are synthetic contracts;
PostgreSQL/RLS, transactions, Next.js, SDK, parsers, Sharp and Chromium are real.
Google transport is stubbed/blocked. Provider MFA/revocation/Storage/CDN, real
hosting/load/backups/monitoring and Google delivery are **not certified**.

## Performance and remaining blockers

Fresh slow-mobile local median LCP: homepage 3.692→3.636 s, Sanitary 3.372→3.268 s.
The small differences may include noise; bytes saved are proven, a statistical
speedup/production score is not claimed. Both pages remain above 2.5 s in this lab.
The XLSX direct-process peak remains around 377–388 MiB; hosting/transport/combined
concurrency limits need real authorized verification. No memory reduction is claimed.

Admin samples have no detected Axe violations. Approved storefront contrast
findings remain unchanged and need an owner design decision. Genuine inventory,
operator MFA/recovery, private key/scheduler/alert provisioning, real backups,
provider testing, policies and compatible release cutover remain blocked pending
separate approvals. Production indexing stays off with an intentionally empty sitemap.

## Reports

1. [Repository architecture audit](repository-audit.md)
2. [Stacked PR/integration review](stacked-pr-review.md)
3. [Security findings and remediation](security-audit.md)
4. [Technical SEO readiness](seo-audit.md)
5. [Before/after performance and accessibility](performance-report.md)
6. [Migration compatibility/cutover/recovery](migration-plan.md)
7. [Tests, failure history and reproducible commands](test-results.md)
8. [Future Part B configuration/access prerequisites](staging-prerequisites.md)
9. [Remaining blockers and owner decisions](remaining-blockers.md)

Aggregate evidence is in [evidence](evidence/). Runtime fixture records, original
synthetic uploads/spreadsheets, DB dumps, session cookies and credentials are not
committed. Captures below are marked local synthetic visual evidence, not inventory.

| View | Desktop | Mobile |
| --- | --- | --- |
| Approved homepage layout | [Capture](screenshots/home-desktop.png) | [Capture](screenshots/home-mobile.png) |
| Approved Sanitary layout | [Capture](screenshots/sanitary-desktop.png) | [Capture](screenshots/sanitary-mobile.png) |

Run `npm run verify:phase8-part-a` and `node scripts/phase8/audit-repository.mjs`
for local reproduction. Stop after Part A. The next permitted step is owner review;
real Part B work, provider access and every later production action need explicit
separate authorization. This report requests no credentials or external changes.

## Complete modified-file inventory

60 files relative to Phase 7; `A` = new, `M` = modified. No files deleted.

| Status | Path |
| --- | --- |
| M | `.gitignore` |
| A | `docs/phase8-part-a/README.md` |
| A | `docs/phase8-part-a/evidence/accessibility.json` |
| A | `docs/phase8-part-a/evidence/bundle-audit.json` |
| A | `docs/phase8-part-a/evidence/catalog-capacity.json` |
| A | `docs/phase8-part-a/evidence/dependency-audit.json` |
| A | `docs/phase8-part-a/evidence/failures-and-remediation.json` |
| A | `docs/phase8-part-a/evidence/import-boundary.json` |
| A | `docs/phase8-part-a/evidence/initial-reproductions.json` |
| A | `docs/phase8-part-a/evidence/legacy-compatibility.json` |
| A | `docs/phase8-part-a/evidence/memory-after.json` |
| A | `docs/phase8-part-a/evidence/memory-before.json` |
| A | `docs/phase8-part-a/evidence/migrations.json` |
| A | `docs/phase8-part-a/evidence/mobile-after.json` |
| A | `docs/phase8-part-a/evidence/mobile-before.json` |
| A | `docs/phase8-part-a/evidence/recovery-rehearsal.json` |
| A | `docs/phase8-part-a/evidence/reference-assets.json` |
| A | `docs/phase8-part-a/evidence/repository-audit.json` |
| A | `docs/phase8-part-a/evidence/seo.json` |
| A | `docs/phase8-part-a/evidence/summary.json` |
| A | `docs/phase8-part-a/evidence/test-results.json` |
| A | `docs/phase8-part-a/evidence/visual-comparison.json` |
| A | `docs/phase8-part-a/migration-plan.md` |
| A | `docs/phase8-part-a/performance-report.md` |
| A | `docs/phase8-part-a/remaining-blockers.md` |
| A | `docs/phase8-part-a/repository-audit.md` |
| A | `docs/phase8-part-a/screenshots/home-desktop.png` |
| A | `docs/phase8-part-a/screenshots/home-mobile.png` |
| A | `docs/phase8-part-a/screenshots/sanitary-desktop.png` |
| A | `docs/phase8-part-a/screenshots/sanitary-mobile.png` |
| A | `docs/phase8-part-a/security-audit.md` |
| A | `docs/phase8-part-a/seo-audit.md` |
| A | `docs/phase8-part-a/stacked-pr-review.md` |
| A | `docs/phase8-part-a/staging-prerequisites.md` |
| A | `docs/phase8-part-a/test-results.md` |
| M | `eslint.config.mjs` |
| M | `ops/staging/environment.example` |
| M | `package.json` |
| A | `public/homepage/banner-building.webp` |
| A | `public/homepage/banner-pipes.webp` |
| A | `public/homepage/footer-decoration.webp` |
| A | `public/sanitary/promotion-art.webp` |
| M | `scripts/phase3/local-fixture.mjs` |
| M | `scripts/phase7/check-config.mjs` |
| M | `scripts/phase7/optimize-reference-heroes.mjs` |
| A | `scripts/phase8/audit-repository.mjs` |
| A | `scripts/phase8/collect-evidence.mjs` |
| A | `scripts/phase8/test-import-boundary.mjs` |
| A | `scripts/phase8/test-legacy-stack.mjs` |
| A | `scripts/phase8/validate-local.mjs` |
| A | `scripts/phase8/write-performance-report.mjs` |
| M | `src/components/home/ReferenceStorefront.tsx` |
| M | `src/components/sanitary/SanitaryShop.module.css` |
| M | `src/lib/admin/assurance.ts` |
| A | `src/lib/admin/session-policy.ts` |
| M | `src/lib/imports/spreadsheets.ts` |
| M | `tests/phase5/browser.mjs` |
| A | `tests/phase8/unit.test.ts` |
| A | `tsconfig.phase8.json` |
| M | `vercel.json` |
