# Initial release: business website with an empty product catalog

**GO for owner execution approval after the focused checks below.** This replaces
prior database-backed launch plans. Owner has approved an initially empty catalog.
No staging project, product approval list or production SQL is needed to launch it.

## Exact scope

- Approved luxury navy homepage, existing header/footer artwork, banners and logos.
- Main categories: **Sanitary → Electrical → Building Materials**, in that order.
  Imported Kitchen & Bath stays visible; existing category links remain valid.
- Approved existing brand logos and working, gracefully empty category/brand pages.
- Professional empty-catalog message, both WhatsApp contacts and today's-rate
  Building Materials enquiries. No product records, product photos, prices or stock
  claims are displayed. Approved category/banner artwork remains decorative.
- No cart, wishlist, checkout, payments, order intake, analytics or private uploads.
- Unique page metadata, canonical URLs, breadcrumbs and verified business details
  preserved. No product/Offer/review markup or product sitemap URLs. Existing
  no-index safeguards remain unchanged pending a later indexing decision.
- Admin source code is retained but every Admin route is closed server-side with
  HTTP 503. No login form, registration or database connection in business mode.

## Why zero migrations are required

`BUSINESS_SITE_MODE=empty-catalog` supplies approved business/navigation information
and **zero products**. It takes priority over catalog, Admin and worker enable flags.
The site does not query Supabase, Auth or Storage. There is no parallel hardcoded
product catalog and no automatic publishing of the six unverified legacy records.

**Initial release: 0 migrations, 0 RLS/Auth/Storage changes, 0 data exports/restores.**
The [previous ten-file migration bundle](migrations.json) is deferred until product
entry/Admin activation. Do not run it during this release.

Legacy Supabase public SELECT policies remain unchanged. They must be addressed,
with verified backup/restore and separate approval, BEFORE private product entry
or Admin activation. This release introduces no private data or new DB access.
Existing backup readiness is not certified; DB recovery is unnecessary for a release
that does not touch the database. No backup/restore approval is being requested now.

## Evidence

[Focused build/TypeScript/lint/browser results](results.json) and
[last read-only production baseline](production-readonly.json).
The new test uses no database and checks that conflicting enable flags cannot
cause backend requests. Completed database/commerce suites are not repeated.

[Desktop home](screenshots/home-desktop.png) · [Mobile home](screenshots/home-mobile.png) ·
[Sanitary](screenshots/sanitary-mobile.png) · [Building Materials](screenshots/materials-mobile.png) ·
[Imported](screenshots/imported-mobile.png) · [Brand](screenshots/brand-mobile.png).
These are the actual empty-site UI, not synthetic product screenshots.

## Exact execution approval requested

1. Approve the final commit/tree in Draft PR #13 and the non-secret production
   settings in [the configuration manifest](../../ops/production/catalog-inquiry.environment.example).
   Existing Supabase variables/values and all unrelated settings remain untouched.
2. Record prior production deployment `dpl_JBtpFzJHEfCJud4eAH2UfFhijUWa` / source
   `c73b01b93c4093edefe1c00e34299a9041ea5bef` and the prior state of only changed flags.
3. Apply ONLY the listed business-site flags to the e-commerce project's Production
   scope. Do not change Supabase, RLS, Auth, Storage, domains, team settings or plans.
4. Merge the approved PR/tree into main and let its Git production deployment run
   once. Verify the resulting deployment/tree matches the approved release.
5. Read-only live smoke: homepage, navigation/category order, all advertised category
   and brand pages, Imported section, both WhatsApp destinations, zero products,
   denied Admin/cart/payment paths and mobile layout. Send no WhatsApp messages.
6. On failure, use the prior Vercel deployment and restore ONLY changed flags to
   their recorded prior state. No SQL rollback or database restoration is required.

**Still unapproved:** production configuration change, merge, deployment and any
rollback action. No production action follows from this document alone.
No ERP/Google Cloud access or changes are included.

## Later product uploads

The secure Admin/catalog implementation is preserved. Before enabling it, review
and approve the deferred database/RLS migrations, trusted administrator provisioning,
backup/isolated restore and genuine inventory/media. Switch out of empty-catalog
mode only in that separately approved activation. No routine source edits are
needed to manage products once that foundation is activated.
