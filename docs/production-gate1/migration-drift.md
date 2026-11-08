# Actual production migration drift

**FAIL — production is not at release-candidate schema.** Only two reviewed
version/name pairs are recorded; ten later migrations are absent. No unexpected
history version returned. No migration was applied, repaired, marked or replayed.

| Version | Name | Production history |
| --- | --- | --- |
| 20261106055003 | initial_ecommerce_schema | PASS: recorded |
| 20261106064811 | seed_initial_products | PASS: recorded |
| 20261108000100 | catalog_foundation | FAIL: absent |
| 20261108000200 | catalog_workflow | FAIL: absent |
| 20261108000300 | admin_operations | FAIL: absent |
| 20261108000400 | catalog_media | FAIL: absent |
| 20261108000500 | catalog_content | FAIL: absent |
| 20261108000600 | catalog_imports | FAIL: absent |
| 20261108000700 | storefront_integration | FAIL: absent |
| 20261108000800 | order_requests | FAIL: absent |
| 20261108000900 | staging_hardening | FAIL: absent |
| 20261108001000 | catalog_query_plans | FAIL: absent |

Version/name matching does not verify historical executed SQL checksums. We did
not read migration statement bodies or seed/business rows. Repository SHA256 hashes
and comparison are [retained](evidence/migration-comparison.json); production
history itself is [separate evidence](evidence/installed-migrations.json).

## Structural corroboration

Observed catalog tables match the initial legacy shape at inspected type/default/
nullability/constraint level: brands/categories each have id/name/slug/created_at;
products has eleven columns including required numeric price DEFAULT 0 and required
boolean in_stock DEFAULT true. Those defaults are schema facts, not commercial
prices or stock claims. Numeric precision/scale was not separately retrieved.

PK and unique-slug indexes exist on all three tables; product category/brand FKs
use ON DELETE SET NULL. No SKU/model/type/finish, workflow/version/review/SEO/
verification/specification fields, app_private roles/keyrings/outbox, public catalog
projections, revision/import/order/media tables or new public RPCs exist.

The three existing policy names match the foundation migration's recognized
legacy allowlist. No explicit catalog column ACLs returned. These inspected
preconditions resemble the successful PR #11 legacy rehearsal, but they are not
permission to run DDL or proof of every live dependency/extension compatibility.
Real GoTrue/Storage schema upgrade behavior, data volumes, row-level content and
current live app commit were not validated by this inspection.

## Compatibility consequence

Repository main has legacy raw-table catalog queries. The candidate uses new
public projections/RPCs and guarded authorization. Actual Vercel deployed SHA/
branch is BLOCKED by 403, so repository main must not be asserted as the observed
live deployment. If a legacy app is running, restrictive foundation migrations
will break its direct reads. Deploying the candidate against only the old schema
also leaves required views/functions absent.

Gate 3 must review this ten-migration gap, real schema/dependency impacts and a
maintenance/fail-closed transition with compatible app/DB together. Do not replay
the already-recorded seed. Preserve IDs and legacy values; future installation
must default existing products to Draft/unverified. Their current record values
were not inspected, so no claim that production already has private Drafts or
exactly six sample rows is made.
