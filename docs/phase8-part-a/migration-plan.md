# Database migration and cutover preflight

No migration was added or edited in Part A. All twelve files hash-match the Phase 7
source branch; the exact ordered matrix/hashes are in `evidence/migrations.json`.
The two original files create/seed the legacy schema; subsequent files are guarded
catalog changes and must never be run piecemeal beneath an incompatible app.

| Order | File | Dependency / purpose |
| --- | --- | --- |
| 1 | `20261106055003_initial_ecommerce_schema.sql` | Original products/categories/brands/RLS |
| 2 | `20261106064811_seed_initial_products.sql` | Existing six sample products, retained unverified |
| 3 | `20261108000100_catalog_foundation.sql` | Roles, authoring models, public projections, SEO/media/import/settings foundation |
| 4 | `20261108000200_catalog_workflow.sql` | Review/publication/version/history/redirect contracts |
| 5 | `20261108000300_admin_operations.sql` | Manual draft/SEO and shared sign-in throttle RPCs |
| 6 | `20261108000400_catalog_media.sql` | Immutable originals, variants, eligibility and galleries |
| 7 | `20261108000500_catalog_content.sql` | Category/brand/content/settings/banner operations |
| 8 | `20261108000600_catalog_imports.sql` | Durable source/preview/approval/batch/retry contracts |
| 9 | `20261108000700_storefront_integration.sql` | Strict current public snapshots, quotation inheritance, generation/leases |
| 10 | `20261108000800_order_requests.sql` | Private requests/history and narrow signed guest gateway |
| 11 | `20261108000900_staging_hardening.sql` | Operator MFA policy, narrow machine queue gateway, audit |
| 12 | `20261108001000_catalog_query_plans.sql` | Storefront-RPC-only planner settings; no visibility/RLS weakening |

Local rehearsal uses PostgreSQL 17 in unique networkless Docker containers, no
published DB port and no accepted remote database URL. Standard latest-stack
fixtures and a new complete-stack rehearsal over PR #2's legacy model/type/finish
columns run separately. All six legacy row IDs/values are retained; they remain
Draft, unverified, with unverified price/stock. Anonymous raw reads are denied;
keyrings remain empty. This does not establish live schema compatibility.

Before any future remotely authorized migration: confirm the isolated project,
version/extensions and actual grants/policies; snapshot schema/data/ACLs/roles,
verify encrypted backup plus independent original/derivative/import binary backup,
rehearse restore and failure recovery. Review unknown drift; do not weaken RLS to
make a legacy query work. Files 3–12 require `app.catalog_cutover_approved=yes` in
the applying session and use transactional guards.

Future cutover requires separate owner approval: freeze exact reviewed SHAs,
validate the real staging matrix, choose maintenance/compatible traffic cutover,
keep features/indexing closed, apply the approved complete schema and compatible
public-view application together, then canary anonymous privacy, AAL2 Admin/Editor,
withdrawal, routes, imports, worker and orders. Main currently contains the older
hardcoded homepage and raw-query category source; source inspection is not a
statement about any hosted deployment.

On failure, stop dependent work and preserve evidence. Disable affected entry
points under incident authority; roll forward the compatible app or restore to
an isolated verified target. Do not drop tables/history or revert to legacy
raw-table code beneath restrictive RLS. No destructive down migration, remote
migration script execution or actual rollback/cutover is part of Part A.

Detailed operating procedures remain in
[Phase 7 migration/release plan](../phase7/migrations-and-release.md) and
[recovery runbook](../phase7/security-and-operations.md).
