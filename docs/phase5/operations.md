# Phase 5 configuration, security, impact and recovery

## Isolated configuration

The storefront deliberately does not inherit `NEXT_PUBLIC_SUPABASE_*` or `ADMIN_*` connection values. This prevents accidental production reads during development and keeps a public media response independent of a local/staging-only Admin login configuration.

For an isolated **local** fixture only:

```dotenv
CATALOG_ENABLED=true
CATALOG_ENVIRONMENT=local
CATALOG_SUPABASE_URL=http://127.0.0.1:54321
CATALOG_SUPABASE_PUBLISHABLE_KEY=<local-anonymous-publishable-key>
CATALOG_SITE_ORIGIN=http://127.0.0.1:3100
CATALOG_MEDIA_ENABLED=true
CATALOG_INDEXING_ENABLED=false
```

Default: integration disabled; homepage retains approved presentation with an empty product rail and public collection/product URLs return 404. No fallback sample catalog or raw-table query is used. `local` restricts URL/origin to loopback. `staging`/`production` require HTTPS, clean origins and an anonymous/publishable key. Secret-prefixed keys and JWTs with a non-anonymous role are rejected. Configuration remains server-side; public SDK clients neither read nor persist staff cookies.

`productionReleaseApproved` is **false in code**. Production media and indexing stay disabled even when both environment flags are set. Do not change this gate or configure a real staging/production connection without the separate release/staging authorization. Admin authorization retains its Phase 3 local/staging limits; no production Admin enablement is included.

## Migration impact and compatibility

`20261108000700_storefront_integration.sql` is a guarded, transactional, development-only migration requiring the existing same-session cutover acknowledgement. It does not create accounts, publish samples, delete tables/records, change IDs, update existing commercial values or replace earlier migration files.

It strengthens the existing public projections to require current reviewed/approved identity/content, a published primary category, published ancestors and any attached published brand. Public content that fails those checks disappears immediately. This is an intentional security behavior change: standalone publication behind an unreviewed parent or brand no longer grants a public URL. Secondary memberships do not publish private categories. Quotation mode inherited from an approved ancestor suppresses fixed prices.

Added read interfaces:

- `catalog_assets_public`: approved derivatives' metadata only; no private original/object URL.
- `catalog_storefront`: a single statement snapshot assembled from the `catalog_*_public` views, with search, filters, totals, 12-row pagination, related items and gallery metadata. Product rows are not fetched en masse into the browser for filtering.
- `catalog_cart`: at most 100 requested public product IDs; no private fallback.
- `catalog_public_generation`: an opaque monotonically increasing change counter. It exposes activity, not Draft details, authors, original filenames, import data or private field values.

Added administrator operations:

- `set_catalog_product_featured`: active Draft + expected version; checkpoint/audit, review reset and subsequent explicit publication required.
- `claim_catalog_invalidations` / `finish_catalog_invalidation`: administrator-only through existing Auth/RLS role checks. Anonymous/ordinary/Editor callers cannot lease or acknowledge work.

The active homepage/category code no longer uses raw tables. Unused older prototype components remain in the repository and are not imported by active routes. The raw legacy Supabase module remains for compatibility but is not imported by public routes. Prior Phase 2 regression fixtures deliberately test their original migration subset; full-stack Phase 3/4/5 fixtures apply every migration.

## Withdrawal and caching

Publication-bearing pages, metadata, admission checks, API cart data and public image downloads do not use cross-request content caching. Headers instruct the browser and compliant CDN not to store public catalog responses. Route admission queries public views before Next.js starts streaming, so absent/private products, categories, brands and out-of-range catalog pagination return HTTP 404. Safe permanent history returns 308 only if its destination remains public; query parameters are discarded on redirect. Database/network errors fail closed rather than falling back to old inventory.

The SQL snapshot prevents mixing raw product data from separate publication moments within a response. React memoization is request-local only. A request admitted before a concurrent withdrawal can be in flight; already delivered HTML, media bytes, browser screenshots and external WhatsApp messages cannot be recalled. New requests after withdrawal recheck visibility. The image endpoint additionally checks eligibility before Storage download and again before responding. A shared image remains public if another approved public attachment still references it.

Links disable speculative prefetch. An open application checks the generation counter on mount, focus, visibility and every 15 seconds while visible and refreshes after changes; browser back/forward-cache restoration forces a reload. This refresh mechanism is eventual for already open pages, not a promise to erase bytes already delivered. Cart checkout checks public data again before creating an enquiry.

Do not put these paths behind a CDN rule that overrides no-store or routes managed media into a shared optimizer. Full Supabase gateway/CDN semantics and distributed hosting behavior remain staging gates. Current Next.js admission/404 behavior was tested against the installed framework version.

## Durable invalidation processing

Events are claimed in batches of at most 50 using `FOR UPDATE SKIP LOCKED`, distinct lease tokens and two-minute leases. Completion requires the matching unexpired token. Failed work retains `processed_at=NULL`, increments attempts and records a bounded error/backoff; expired leases can be reclaimed. Acknowledging one event never erases a newer event. Invalidation expires the catalog tag immediately (`expire: 0`), revalidates the root layout and sitemap/robots before acknowledging success. Duplicate invalidation after a crash is safe.

The administrator workspace drains up to four batches on mount and every 15 seconds. Closing it pauses that driver; the durable queue survives. An independently scheduled operator run can use:

```bash
CATALOG_WORKER_ORIGIN=http://127.0.0.1:3100 \
CATALOG_WORKER_COOKIE_FILE=/private/current-admin-cookies.json \
node scripts/process-catalog-invalidations.mjs
```

The private file contains an already authorized session's browser cookie array (`[{"name":"...","value":"..."}]`), including HttpOnly SSR session chunks and the CSRF cookie. Protect it outside the repository. The utility provisions nothing, uses no service-role credential, performs at most ten batches and stops on authentication/error; rerun with a current authorized session. It does not turn a browser cookie into a permanent worker identity. A trusted scheduler, credential lifecycle, monitoring/alerts and hosting-specific cache propagation need a separately reviewed operational setup before release. No scheduler/account was deployed here.

## Recovery and remaining risks

Retain original SQL/media/import revisions, private binaries and database backups. A failed migration rolls back its transaction. After commit, use an additive forward fix; do not reopen anonymous raw-table access or delete revision/media history. The earlier [Phase 2 recovery plan](../phase2/release-and-recovery.md) and [Phase 4 private media/import guidance](../phase4/security-and-recovery.md) still apply. Database backups alone do not establish Storage-binary recovery.

`CATALOG_ENABLED=false` closes public catalog access without exposing legacy sample inventory; `CATALOG_MEDIA_ENABLED=false` independently closes the application media path. Neither switch revokes bytes already downloaded or replaces provider-token/Storage controls. Disabling Admin does not disable the independently configured public derivative route. Keep production media off until the full Storage/public-delivery setup has been approved and tested.

Real Supabase Auth/JWT/Storage policies, CDN edge invalidation, load at the configured limits, complete backup/restore, operator MFA/session policy, rate/abuse protection and durable scheduling remain release blockers. This Phase 5 work neither weakens RLS nor claims to certify those services through local fixtures.
