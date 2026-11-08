# Migration compatibility and coordinated release

Review timestamp: 8 November 2026, Asia/Karachi. GitHub metadata confirmed PRs
#2–#7 open, Draft, unmerged and individually mergeable against their current base.
That metadata is not permission to merge or deploy. Phase 7 is based on the exact
Phase 6 tip `9df548718d4beac223b052290f70e91dc7c59039`.

| Phase / PR | Branch | Target | Required foundation |
| --- | --- | --- | --- |
| Sanitary #2 | `shopping/sanitary-section` | `main` | Separate older design work; do not merge its raw catalog loader |
| 2 / #3 | `development/seo-commerce` | `main` | Guarded schema, roles, publication rules |
| 3 / #4 | `development/admin-dashboard` | Phase 2 | Request-scoped Auth, Admin workflow RPCs |
| 4 / #5 | `development/product-import-media` | Phase 3 | Private media/content/imports |
| 5 / #6 | `development/storefront-integration` | Phase 4 | Public snapshots, route admission, secure derivatives |
| 6 / #7 | `development/orders-analytics` | Phase 5 | Private requests, signed order gateway, privacy-aware analytics |
| 7 | `development/staging-readiness` | Phase 6 | MFA gate, dedicated invalidation worker, readiness checks |

Phase 5 already selectively reused PR #2's Sanitary CSS/assets and adapted its
components to the secure central catalog. Blindly merging #2 later would risk
reintroducing conflicting queries, fake sample catalog assumptions and approved
layout changes. It remains open/unmerged for separate owner review.

## Applied only to disposable local PostgreSQL

Run all migration files lexically, never editing an applied migration:

1. `20261106055003_initial_ecommerce_schema.sql`
2. `20261106064811_seed_initial_products.sql`
3. `20261108000100_catalog_foundation.sql`
4. `20261108000200_catalog_workflow.sql`
5. `20261108000300_admin_operations.sql`
6. `20261108000400_catalog_media.sql`
7. `20261108000500_catalog_content.sql`
8. `20261108000600_catalog_imports.sql`
9. `20261108000700_storefront_integration.sql`
10. `20261108000800_order_requests.sql`
11. `20261108000900_staging_hardening.sql`
12. `20261108001000_catalog_query_plans.sql`

Phases 2 onward require the explicit session guard
`app.catalog_cutover_approved=yes`; no script accepts a remote DB URL. Unknown
legacy policies/grants fail the Phase 2 guard instead of silently weakening RLS.

The Phase 7 hardening migration is additive: private security singleton, worker keyring,
nonce replay table and indexes; replacement role predicates add optional AAL2;
one own-session projection and one signed narrow worker RPC. A second guarded
migration scopes hash-oriented planning and disables JIT within the existing
read-only storefront RPC to avoid the measured pathological nested scans. It
changes no projection, publication predicate, function privilege or RLS policy.
The regression compares complete public DTOs with both planner strategies. Existing IDs,
authoring products, publications, galleries, orders and revisions are not deleted
or overwritten. Worker keyring starts empty and MFA enforcement defaults false;
no accounts or sample inventory are promoted. Nonce expiry only removes obsolete
machine replay records, never customer data.

Full local latest-stack tests use actual PostgreSQL/RLS and fixture Auth/Storage
schemas. Existing Phase 2 compatibility tests additionally cover the legacy schema
and PR #2's extra columns. Hosted Supabase extension versions, managed Auth grants,
actual Storage implementation, network/CDN settings and production legacy drift
remain separate staging checks. A passing local fixture is not proof that live
production schema matches these files.

## Future release sequence — requires a new approval

1. Freeze and review exact PR SHAs, migrations, designs, blockers and backups.
   No merge during Phase 7. Keep every development branch's Git deployment
   disabled; verify project integrations cannot deploy these branches separately.
2. Obtain explicit isolated staging approval and run the acceptance matrix.
   Rehearse recovery, MFA/provider setup, machine identity, queue alerts, actual
   hosting capacity and original/private media withdrawal before release approval.
3. Decide reviewed stack integration method: merge/retarget in dependency order
   #3 → #4 → #5 → #6 → #7 → Phase 7, or a single reviewed integration branch
   preserving their commits. Revalidate diffs when bases move. Do not squash a
   foundation and leave dependent branches accidentally comparing duplicate work.
4. A merge is not migration or deployment authorization. Deploy **one coordinated
   compatible application/migration release**, never the Phase 2 restrictive
   migrations while main still serves unrestricted legacy raw-table code. Plan
   a maintenance/traffic window or rehearsed compatible cutover with feature gates
   closed. Document recovery responsibility before any production write.
5. Keep production indexing, analytics, order intake, public media and Admin
   operations disabled until their separate owner approvals and readiness gates.
   Current hard-coded production gates intentionally require another reviewed
   code change. No env variable can silently bypass that boundary.
6. After approved deployment, canary anonymous public views/404/308/no-store,
   AAL2 Admin/Editor roles, private Storage, worker heartbeat/queue, Draft imports,
   order privacy and business contacts. Withdraw test records and inspect
   direct origin/CDN caches. Owner then approves each public feature independently.
7. Indexing release is a separate content/Google-account decision: review real
   inventory, titles, useful descriptions, original images/alt, verified prices/
   availability and final policies. Search/filters/Admin/drafts stay excluded.

Rollback: disable entry points and roll forward the compatible public-view app.
Do not restore legacy raw-table application code beneath restrictive RLS. Preserve
additive schema/history. Use a verified isolated backup restore/cutover only under
an explicit recovery approval. No destructive down migration is included.
