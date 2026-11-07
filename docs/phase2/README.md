# Phase 2 — database and publication foundation

Review branch: `development/seo-commerce`, based on main `c73b01b93c4093edefe1c00e34299a9041ea5bef`.

Scope: isolated development and local validation only. No production database connection, migration, merge or deployment was performed. Phase 3 has not started. Approved page/component code and artwork are unchanged.

## Delivered

1. Two transactional, guarded migrations extend the existing three catalog tables and preserve their IDs and original values. Products support nullable prices, SKU/model, explicit price/stock verification, specifications, galleries, primary/additional categories, and Draft → Ready for Review → Published states. Categories support an acyclic parent hierarchy; brands support manufacturer/collection types.
2. Admin-only workflow RPCs require the current version, explicit review, identity/content attestation, then explicit publication. Direct client writes cannot set workflow, approval, verification or role fields. Publication is independent of indexing approval. An administrator can review and approve their own entry; a two-person approval policy is not imposed.
3. Owner-controlled admin/editor membership, RLS, authenticated preview, private immutable media objects, append-only client-facing revisions/audit, and a durable invalidation outbox form the security foundation.
4. SEO fields, permanent slugs/redirect history and whitelisted public views provide the future storefront contract. TypeScript helpers use the same SQL eligibility flag for metadata and sitemap decisions, with production/indexing opt-in required. No live sitemap/metadata routes were changed in this phase.
5. Import jobs/rows support CSV/XLSX mapping, validation errors, SKU matching, intended updates and history. Site settings and inactive-by-default banners prepare later admin management. No parser, import worker or admin interface was added.

## Publication and indexing contract

| Stage | Public route/data | Indexing |
| --- | --- | --- |
| Draft, including all legacy samples | Denied | Denied |
| Ready for Review | Denied | Denied |
| Reviewed, approved Published record | Public whitelisted projection | Separate opt-in and eligibility checks |
| Archived or returned to Draft | Denied immediately at database boundary | Denied |

Publishing requires real identity and useful content verification for that exact version. Prices and images remain optional. Products without verified media/SKU/taxonomy/SEO fields can be published deliberately with indexing disabled, but cannot opt into indexing. Placeholder images cannot be verified or satisfy indexing requirements.

Product indexing additionally requires a published primary category, a published brand if assigned, genuine verified gallery media with alt text/dimensions, SKU, description and unique page metadata. Taxonomy indexing requires verified identity/content, useful description, page metadata and explicit approval. Human review must determine whether descriptions are useful and original; the database checks presence, not literary quality or factual truth. The SQL flag is recalculated when dependent category/brand publication changes.

Canonical paths default to `/product/{slug}`, `/category/{slug}` and `/brand/{slug}`. Custom same-site paths are stored for future controlled migration, but non-self canonicals make a route ineligible for indexing. External canonicals are rejected. Renames use a privileged, versioned RPC and preserve redirect history; historical source slugs cannot be reused. An HTTP redirect handler is a later storefront task.

Public products expose only explicitly verified positive prices and verified stock statuses. Unknown price is `null`; unknown stock is `unknown`. Product or primary-category quotation mode suppresses price. The Offer eligibility helper requires an eligible public projection and a genuine exposed price; it does not emit structured data or invent availability, reviews, ratings or warranties.

## Phase 3 integration

- Create request-scoped authenticated Supabase SSR clients with validated sessions. Inject them into `requireCatalogActor`; never trust `user_metadata`, a client-supplied role, or a cached authorization result. The database independently enforces permissions.
- A trusted database operator bootstraps the first administrator. No browser operation can assign roles. Editors currently have read/preview access only; giving editors write powers requires a separately reviewed policy change.
- Manual entry writes permitted Draft columns, with optional price/media/specifications. Updates use optimistic version checks at the application boundary; workflow RPCs also check versions under row locks. Gallery/association changes invalidate review eligibility.
- Use `submit_catalog_review`, `review_catalog_entity` and `publish_catalog_entity` in distinct explicit actions. Render previews through `getAuthorizedProductPreview`, with `noindex,nofollow` and private/no-store responses. No preview route is exposed yet.
- Current live records must be returned to Draft before editing, withdrawing them from public access. Audit history and revision snapshots preserve prior content. A future staged-revision publishing workflow is needed if live pages must remain available during editing; do not silently implement this by editing Published rows.
- Consume `app_private.invalidation_events` through a trusted worker/server, with retries and acknowledgement. Invalidate product/category/brand pages, lists, redirects, related products, metadata and sitemap. Taxonomy changes require dependent-product invalidation too. For publication withdrawal use immediate expiry, not a stale-serving cache profile. No worker or cached storefront integration exists in Phase 2.
- Phase 4 implements safe XLSX/CSV parsing, preview, file validation, duplicate resolution and image processing. Import payloads are untrusted; create Drafts and use the same review/publication RPCs. Import records alone never publish products.
- Later storefront integration must query `catalog_*_public` views, handle nullable prices and verified availability, resolve brand/category relations explicitly, serve verified images through a public eligibility-checking media endpoint and keep private originals inaccessible. Supabase relational embedding assumptions from the old raw-table queries must be updated.

## Files

| File | Purpose |
| --- | --- |
| `supabase/migrations/20261108000100_catalog_foundation.sql` | Schema, RLS, private storage and public projections |
| `supabase/migrations/20261108000200_catalog_workflow.sql` | Review/publication, preview, revision/audit, slug/association workflow |
| `src/lib/catalog/publication.ts` | Typed public/authoring policy contracts |
| `src/lib/catalog/server-access.ts` | Server-only verified authorization and public-view access |
| `src/lib/seo/catalog-policy.ts` | Shared metadata/sitemap/canonical eligibility |
| `scripts/test-phase2.mjs` | Network-isolated PostgreSQL migration/RLS integration tests |
| `tests/phase2/bootstrap.sql` | Local Auth/Storage database contracts and synthetic users |
| `tests/phase2/publication.test.ts` | Publication, role, metadata, sitemap and Offer policy tests |
| `tsconfig.phase2.json` | Isolated policy test compilation |
| `package.json` | Reproducible test commands; no new dependencies |
| `.gitignore`, `eslint.config.mjs` | Ignore generated policy-test output |
| `vercel.json` | Disable Vercel Git deployments for this development branch |
| `docs/phase2/*` | Completion, impact, validation and recovery reports |

Read [release and recovery](release-and-recovery.md) before any future application of the migrations, and [validation and risks](validation.md) for the limits of this local evidence.
