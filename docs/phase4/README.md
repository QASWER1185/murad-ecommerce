# Phase 4 — product media and bulk import

Branch: `development/product-import-media`, based on Phase 3 `d9e27ec7bcece95a0e487195d506f700a4c409d7`. The review PR targets `development/admin-dashboard`, not main. Development stops after Phase 4.

No production Supabase connection, production migration, Auth configuration change, real administrator provisioning, merge or deployment was performed. Existing Draft PRs remain unmerged. Git deployments are disabled for this development branch. Homepage, Sanitary/category storefront code and approved artwork are unchanged.

## Delivered

- Original-image uploads, multiple product images, primary-image selection, ordering, replacement, removal from a gallery, recovery of earlier images and private-original downloads. Original objects are immutable; removal archives the association. Gallery operations require an active Draft, administrator authorization and its current version.
- Actual raster decoding and MIME/extension/size/dimension validation for JPEG, PNG, WebP and AVIF. SVG/unsupported/animated images and oversized/decompression-heavy inputs are rejected. Private originals retain their bytes/checksums and descriptive filenames; metadata-stripped WebP derivatives at 320/640/1280 maximum widths support direct responsive previews.
- Product-gallery alt overrides plus versioned brand/category/banner alt editing. Brand logos, category images and homepage banner originals can be replaced and recovered. Each replacement clears the relevant content approval or disables the banner. Image authenticity verification is an explicit administrator action; placeholders cannot satisfy publication/indexing requirements.
- Public derivative delivery checks current publication eligibility before download and immediately before responding. Originals remain private. There are no public signed URLs or public buckets. Responses are no-store, and the Next.js shared image optimizer is blocked for managed-media paths to prevent caching around withdrawal checks. Already displayed/downloaded bytes cannot be recalled. An asset reused by multiple approved public records remains public while any approved public attachment exists.
- CSV and XLSX templates, uploads, column mapping, mapped-data previews, brand/category matching, SKU/model normalization, duplicate/ambiguous SKU detection, new Draft creation, safe existing-Draft updates, optional prices, descriptions/specifications and SEO fields, row-level errors, progress/history, safe CSV reports and resumable processing.
- Blank mapped cells preserve existing values by default. Clearing optional fields requires explicit approval. Existing-product price changes require separate confirmation, including changes made in normal Draft-import mode. Published/review/archived products are rejected until explicitly returned to active Draft; imports never publish, index or verify commercial claims.
- Durable source/preview rows and per-row application state. Product updates run in bounded SQL batches of at most 50, with locks, expected-version checks, atomic row changes and retry-safe commit tracking. Closing the browser pauses the driver; resume continues pending rows. Failed rows can be revalidated and approved again without reapplying successful rows. Interrupted source staging resumes from the retained private original.
- Category/brand information and SEO editors, hierarchy and quotation-mode selection, explicit review/publication/withdrawal/URL-rename workflows, banner content and activation approval, and versioned verified business settings. The supplied WhatsApp contacts are saved in international format: `+923217165000` and `+923086235608`.
- Historical product-detail review and explicit restoration into an active Draft. Recovery preserves the current permanent URL, clears verification/review, creates a checkpoint and leaves gallery recovery to its dedicated controls. No routine source-code edit is needed for these owner operations.

## Screenshots

These are the real local Next.js application with synthetic test records and raster files, not verified commercial inventory or replacement manufacturer photography. Original manufacturer images and real catalog facts remain for the owner to upload later.

| Desktop | Mobile |
| --- | --- |
| [Product gallery](screenshots/gallery-desktop.png) | [Product gallery](screenshots/gallery-mobile.png) |
| [Import preview](screenshots/import-preview-desktop.png) | [Import preview](screenshots/import-preview-mobile.png) |
| [Brand assets](screenshots/brand-desktop.png) | [Import history](screenshots/import-history-mobile.png) |
| [Banner management](screenshots/banner-desktop.png) | [Contact settings](screenshots/settings-mobile.png) |

Desktop viewport: 1440 × 1000. Mobile: 390 × 844. Full-page captures include all scrolling content; tables/navigation intentionally scroll within their containers. Browser assertions check page-level overflow and images/previews; screenshots were visually inspected. Historic Phase 3 screenshots are preserved; its current regression captures go to ignored `work/phase3-review`.

## Validation

| Check | Result |
| --- | --- |
| Raster, CSV/XLSX, ZIP limits, formula handling, normalization and export tests | 7 passed |
| Phase 4 PostgreSQL media/CMS/import/recovery assertions | 56 passed |
| Phase 4 actual-app browser functional/security groups | 14 passed |
| Phase 3 database authorization/save/throttle foundation | 27 passed |
| Phase 3 browser authentication/authorization/session regression groups | 15 passed |
| Phase 3 policy unit tests | 4 passed |
| Phase 2 publication/SEO unit regression | 6 passed |
| Phase 2 legacy-main and PR #2 optional-column database fixtures | 67 + 67 passed |
| Optimized Next.js build / TypeScript | Passed with localhost overrides and admin disabled at build time |
| Lint | Exit 0, no errors; 8 existing warnings in unchanged storefront files |
| Production dependency audit | Zero known vulnerabilities at validation time |

Database tests exercise a 600-row interrupted import, a concurrent SKU conflict, per-row failure retention and revalidation/retry; successful rows are not duplicated. Browser tests use actual binary uploads, decoded WebP responses, exact original-byte recovery, the 10 MiB multipart boundary, unauthorized/Editor rejection, gallery operations, public delivery/withdrawal, shared-optimizer rejection, CSV/XLSX mapping and formula errors, price approval, blank preservation, source-upload resume, history recovery, banner deactivation and mobile layouts.

Auth/Storage/PostgREST HTTP **contracts** are local fixtures backed by real isolated PostgreSQL RLS. The application uses the real Supabase SSR/Storage SDK and real Sharp/ExcelJS parsers. These tests do not certify a real GoTrue deployment, JWT signature configuration, Supabase Storage gateway or CDN. Separately authorized full-stack staging remains mandatory. No fixture identity switch or authentication bypass exists in application code.

```bash
npm ci
npm run test:phase4:unit
npm run test:phase2
npm run test:phase3:unit
npm run lint
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321 NEXT_PUBLIC_SUPABASE_ANON_KEY=phase4-local-test-key ADMIN_ENABLED=false npm run build
npm run test:phase4:e2e
npm run test:phase3:e2e
npm audit --omit=dev
```

The runner uses a digest-pinned PostgreSQL 17 container on the explicit local Docker socket, with network disabled and no published database ports. HTTP fixtures and Next.js bind to loopback. It creates/removes only its own uniquely named test containers and volumes. No production database URL is read by the test runner. Eight Phase 4 screenshots are regenerated by its browser run. A local Chromium executable is required (`CHROMIUM_PATH`, default `/usr/bin/chromium`).

## Phase 5 recommendations and release blockers

1. Review this isolated PR and the existing stack separately. Do not apply the restrictive migrations to the unchanged live storefront. Build a coordinated adapter using `catalog_*_public`, approved media links and nullable verified commerce values, preserving the approved homepage and Sanitary layouts.
2. Integrate product/category/brand routes, genuine related items, breadcrumbs, redirects, canonical URLs, metadata, sitemap/robots and the same publication/indexability policy. First ordered active gallery image is primary. Use direct responsive variants rather than the shared Next image optimizer. Image responses intentionally remain noindex during this isolated-development phase; production image indexing needs the same explicit eligible-source/environment opt-in as page indexing.
3. Implement/validate the durable invalidation-outbox processor and immediate HTML/list/SEO cache withdrawal. Media responses already recheck publication without shared caching; that alone does not withdraw cached storefront HTML. Keep requests containing staff data private/no-store.
4. Obtain separate staging authorization for real Supabase Auth/JWT/refresh/revocation, private Storage upload/download/RLS, MIME limits, gateway/CDN withdrawal and backup/restore tests. Provision the initial real administrator only through the separately authorized trusted operator process. No real account was provisioned here.
5. Load-test configured upper limits and real hosting request/body/duration/memory constraints. Exercise concurrent editors and network failures against the authorized staging stack. Local recovery evidence covers 600 rows and actual 10 MiB uploads, not a production capacity guarantee.
6. Review MFA/session policy, edge abuse protection, monitoring, retention, storage quotas and private orphan reconciliation before release. Failed multi-object uploads can leave private unattached/unregistered objects; nothing is automatically deleted. Existing privacy/immutable-object boundaries remain in force.

Read [security, limits and recovery](security-and-recovery.md) and [full changed-file inventory](files.md). **No Phase 5 implementation, merge or deployment is included.**
