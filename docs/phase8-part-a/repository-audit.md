# Repository architecture audit

Scope: Phase 7 commit `c8f9f701c783a4a7f86b4587f641ba7d964414aa` plus the
Part A changes on `development/phase8-preflight`. This is a repository/local
assessment, not an inspection of a hosted website or actual inventory.

| Area | Implementation reviewed | Result / boundary |
| --- | --- | --- |
| Database | Twelve ordered SQL migrations; private authoring tables, approved public projections, revisions, audit, imports, settings, media and order records | Reused unchanged; original IDs/sample rows retained; full latest-stack + legacy-column rehearsal added |
| Authorization | `app_private.user_roles`, RLS predicates, `require_admin/require_staff`, own-session AAL projection | No self-assignment; Editor stays read-only; new strict projection parser rejects missing/malformed assurance policy |
| Admin | Request-scoped SSR client, login/logout/MFA, protected layouts/HTTP admission and validated mutations | Functional local contracts; real provider MFA/recovery/revocation remains untested |
| Products/workflow | Product editor, optional prices/stock, SKU/model/specifications/SEO, optimistic versions, explicit review/publish, revisions | No invented fields/automatic publication; incomplete Drafts supported |
| Taxonomy/content | Category/brand CRUD, parent hierarchy, brand assets, banners and verified settings | Existing secure RPCs retained; reference marketing/location copy is still design-bound and requires consistency review before future business-detail changes |
| Media | Private originals/version history; actual raster checks; gallery order/primary/alt; public derivatives with before/after eligibility checks | No original/private URL bypass; per-process image limits; real Storage/CDN and hosting upload transport remain Part B work |
| CSV/XLSX | Private durable sources, mapping/preview/duplicates, blank preservation, approval, bounded processing/history/retry | Confirmed unheaded XLSX-cell truncation fixed; errors persist to SQL preview and invalid rows cannot create products |
| Public catalog | Anonymous `catalog_storefront`, approved public views, reusable category/brand/product templates, route admission | Ten category/eight brand structures covered; no active raw-table public product query; no shared stale catalog cache |
| Cart/wishlist | Shared IDs/quantities only, revalidation, page/template navigation, enquiry/optional request form | Existing behavior retained; no reservation/payment/fulfilment claim |
| Orders/quotes | Signed narrow gateway, guest cookie/CSRF/challenge/rates, immutable server snapshots, intent idempotency, Admin-only history/status | Existing tests rerun; daily-rate building material category remains quotation-only; unknown price/stock never invented |
| SEO | Shared publication/indexing rules, metadata/canonical, SSR, structured data, redirects, sitemap/robots | Production indexing hard-disabled; real content/Google validation still pending |
| Analytics | Consent, GPC/DNT, manual whitelist, generic paths, no customer/raw search data or purchase/revenue | Local stub transport only; no real Google property access |
| Invalidation | HMAC machine capability, private keyring, nonces, leases/acks, health hooks and independent CLI | No broad Admin cookie needed; no scheduler/key/monitoring service provisioned |

The active entry points use `ReferenceStorefront`, `CatalogPage`, `ProductPage`
and centralized public DTOs. Old `DesignOption1Storefront`, `NasgasStorefront`,
legacy layout components and `src/lib/supabase.ts` remain unrouted source. Their
old hardcoded catalogs are not imported by the active page graph. They are
technical debt, not an additional active source of product truth. They were not
deleted or wired back into the store during this audit.

Static asset-reference checks cover literal references, homepage reference
manifest and Sanitary brand/card assets. Missing assets fail the audit script.
Dynamic product/media links are validated through actual-app browser and SQL
contracts, not inferred from static filenames. See the aggregate evidence.

No new dashboard, storefront, import engine or database architecture was rebuilt.
The only artwork changes are four pixel-identical WebP companions; original PNGs,
layout, typography, brand colors and approved business details remain intact.
