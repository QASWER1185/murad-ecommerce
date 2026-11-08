# Phase 4 security, limits, data impact and recovery

This is development preparation and local evidence only. No production/staging database, Auth setting or Storage service was connected or modified.

## Authorization and media boundaries

The Phase 3 request-scoped SSR authentication remains the entry point. Every mutation verifies the provider user and database-owned administrator role, exact trusted Origin and CSRF token before reading/processing its file. JSON/multipart operations use a dedicated CSRF header; regular management forms retain the hidden-token contract. Editors can inspect authorized metadata/previews/history but cannot upload, attach, reorder, verify, import, publish, change settings or restore details. Role self-assignment remains impossible through browser operations.

Private originals, derivatives and import originals use immutable paths in private buckets. No service-role credential/client, public bucket or anonymous signing RPC is added. Public Storage SELECT is narrowly permitted only for registered derivatives currently linked to explicitly approved public catalog records or an approved active banner; originals never qualify. Restrictive boundaries still override broad legacy Storage policies. UPDATE/DELETE policies prohibit overwriting/deleting managed objects. Failed uploads remain private; reconciliation/retention needs an operator-reviewed process, not blind deletion.

`catalog_public_media` exposes a derivative location only after checking its processed/genuine/verified media and approved attachment. `/media/catalog/{id}/{320|640|1280}` uses an unauthenticated publishable-key client, not the viewer's staff session, and checks eligibility again after download. It never returns originals. HTTP no-store prevents application/browser/CDN caching under a compliant deployment; the proxy rejects managed-media requests through `/_next/image`. Real Supabase gateway/CDN behavior still needs staging proof. A valid shared asset can remain public through another approved attachment; bytes already received by a browser cannot be revoked retroactively.

The admin file endpoint independently validates session/role for every original/derivative preview. Drafts, removed attachments, inactive banners and unpublished taxonomy do not release a private asset. Placeholder-only/unprocessed legacy media cannot satisfy the strengthened product indexing predicate. Legacy media records/values are preserved, not automatically reprocessed or trusted.

Uploaded content is decoded server-side with Sharp, actual MIME and extension must agree, dimensions/pixel counts are bounded and animated/multi-page inputs are rejected. Private originals preserve original bytes and metadata; generated WebP copies strip metadata. Processing registration records checksums, dimensions, MIME, source filename, uploader and previous-media linkage. Authenticity remains an explicit human attestation, not something binary validation can prove. Trusted administrators can still attest inaccurate facts; RLS does not defend against a malicious database owner or trusted reviewer.

## Explicit limits

| Resource | Limit / behavior |
| --- | --- |
| Image original | 10 MiB; 16–12,000 px per dimension; maximum 24 megapixels |
| Responsive copies | WebP, nominal widths 320 / 640 / 1280; no enlargement |
| Active product gallery | 30 images; ordering's first image is primary |
| Media library | 50 records per page; older/newer pagination, retained prior versions |
| Image processor | At most two transformations at a time per app process |
| Spreadsheet source | 8 MiB, one worksheet, 10,000 data rows, 40 columns |
| Cell / source row | 20,000 characters per cell; 1 MiB serialized source-row bound |
| XLSX container | At most 512 entries, 32 MiB total declared/actual expansion, 16 MiB per entry, expansion-ratio checks |
| XLSX structure | Stream-checked XML row/cell references, cell/string/style/tag/depth bounds, DTD rejection; macro/external/OLE entries rejected |
| Spreadsheet parser | One file at a time per app process; no formula evaluation |
| Source staging | Up to 250 rows / approximately 1 MiB per request to the database |
| Preview preparation | At most 100 rows per batch |
| Product application | At most 50 rows per locked SQL transaction; NULL/unbounded limits rejected |
| History / preview UI | Latest 50 import jobs, first 50 preview rows; report includes all staged row outcomes |
| Framework proxy buffer | 12 MiB to include multipart overhead; handlers impose smaller specific limits |

These bounds reduce memory/CPU exposure, but do not replace hosting-level concurrency limits or full-capacity staging tests. Workbook ZIP entries are streamed and size/structure-validated before ExcelJS creates worksheet objects. Formulas/error cells produce row errors rather than cached-result prices. CSV report/template output neutralizes leading formula characters; XLSX templates contain text-formatted headers and no product facts.

## Import and revision semantics

The private original, SHA-256, headers and immutable source rows are retained. Column mapping and optional blank-clearing are versioned and audited before any product changes. Brand/category matching uses active existing names/slugs; unknown or ambiguous references are errors, not invented taxonomy. SKU normalization is Unicode NFKC, trimming/space normalization and uppercasing; ambiguous legacy matches and duplicate normalized spreadsheet SKUs are rejected. Model casing and text identifiers are retained after normalization; Excel users should format identifier columns as text to preserve leading zeros.

Existing product versions/statuses are captured at preview. Updates merge only mapped values over the current allowed Draft fields; blank cells are omitted unless explicit optional-value clearing was approved. Price-update mode requires an existing SKU. Existing-product price changes require explicit confirmation even in normal import mode; blank unchanged price updates are skipped. Slugs of previously published products cannot be changed through imports. New descriptive Draft slugs are generated only when no slug is supplied and are shown in preview; they can be reviewed/edited before first publication.

Processing holds the job lock, enforces current product version and uses the Phase 3 authoring RPC. Each successful row and its commit marker are atomic; per-row errors roll back that row and preserve its error. A whole-transaction failure rolls back the batch. Retrying after a lost response advances to pending rows. Failed-row revalidation preserves applied rows and requires explicit approval again. Imports always leave products Draft/unverified; there is no importer publication path.

Before existing-product import updates and detail restoration, immutable product snapshots are written. Audit/outbox records include the actor and mutations. The product editor links to historical detail review; restoration requires an active Draft, its expected version and explicit confirmation, preserves the current permanent URL and clears verification/review. Galleries use their own retained-image restore controls. Revision snapshots remain immutable to browser users.

## Migrations and compatibility

Apply none of these files to production in Phase 4:

- `20261108000400_catalog_media.sql`: additive media/variant/default-alt metadata, versioned galleries, narrow derivative eligibility and stricter processed-image indexing requirement.
- `20261108000500_catalog_content.sql`: versioned taxonomy/banner/contact management, contextual alt text and approved public asset links.
- `20261108000600_catalog_imports.sql`: private import-source bucket, staged source/preview ledger, bounded approval/application/retry functions and historical-detail recovery.

All are transactional and require the existing same-session `app.catalog_cutover_approved=yes` acknowledgement. Do not put it into an automatic production migration job. Existing IDs and old business values remain; no old sample is verified/published and no table/production record is deleted. Direct authenticated authoring grants are replaced by controlled administrator RPCs for managed media, imports and CMS records; raw staff SELECT remains under RLS. Existing public access through safe projections remains scoped to approved content. The unchanged legacy storefront is still incompatible with standalone restrictive Phase 2/3/4 migration application.

Recover through an additive forward fix and the prior [Phase 2 recovery plan](../phase2/release-and-recovery.md). Keep encrypted database/storage backups and rehearse restore separately in an authorized environment. Database backups alone may omit Storage binaries. A failed migration rolls back that file; after commit, preserve metadata/history/originals and avoid destructive down migrations or reopening raw anonymous Draft access. Disable `ADMIN_ENABLED` to close application access while investigating; that is not provider-token revocation.

The dependency audit found ExcelJS's old transitive `uuid`. ExcelJS uses its compatible `v4` API; an override pins CommonJS-compatible patched `uuid@11.1.1`. Templates, XLSX imports and the production build were retested; the production dependency audit reports zero known vulnerabilities at validation time. Keep the lockfile and continue routine advisory review.

## Required release gates

Separate authorization is still required for real Supabase Auth/Storage staging, trusted real-account provisioning, any production migration, merge or deployment. Validate real JWT/session behavior, Storage API policy semantics, object size/MIME configuration, withdrawal through gateway/CDN/optimizer, backups, concurrency, and the complete hosting request lifecycle. The local HTTP fixtures are not a substitute for these checks.

Phase 5 must adapt the storefront/public SEO routes, deliver responsive media directly, process invalidation events with immediate withdrawal, handle permanent redirects, and enable production page/image indexing only through the shared eligibility/environment gates. Owner-supplied real images, descriptions, models, prices and stock still require genuine review. No ranking, stock, warranty, rating or rich-result guarantee is made.
