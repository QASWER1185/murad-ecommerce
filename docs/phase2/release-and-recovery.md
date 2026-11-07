# Migration safety, data impact and recovery

## Do not apply independently to the current live storefront

Phase 2 is development only. Both migrations abort unless the same database session explicitly sets `app.catalog_cutover_approved=yes`. Do not add this setting to CI, production environment variables or a routine `supabase db push` command. It is an acknowledgement of a reviewed, coordinated catalog cutover, not a security control against a database owner.

The final RLS model deliberately removes anonymous access to raw authoring tables. Current main and Draft PR #2 still query those raw tables. Applying these migrations alone to that application would empty/break category data access. An approved storefront adapter rollout and genuine reviewed catalog publication must accompany any future cutover. Keeping raw anonymous access to Drafts as a compatibility fallback would violate the required privacy guarantee.

## Existing-data compatibility and impact

| Area | Impact |
| --- | --- |
| Existing IDs, FKs and original product values | Retained; no old rows deleted or rewritten |
| Existing six repository seed products | All retain original fields, become Draft/unverified, no automatic approval or indexing |
| Existing prices / `in_stock` flags | Values retained, defaults removed and columns nullable; legacy values do not count as verified |
| Existing `image_url` values | Retained privately; not automatically copied into verified media or exposed by public views |
| Existing category membership | Copied additively into `product_categories`; existing primary `category_id` retained |
| Legacy categories/brands | Retained as Draft, requiring review before public exposure |
| PR #2 optional model/type/finish columns | Reused with `IF NOT EXISTS`; no PR merge or UI copy required |
| Existing catalog SELECT policies | Exactly three known initial policies replaced; unexpected policies or column-level grants abort migration for review |
| Existing storage policies/buckets | Other buckets retain their policies; restrictive boundaries protect only `catalog-private` even with broad legacy policies |
| Admin membership | None seeded or inferred; no existing user automatically promoted |
| Site settings / homepage banners | New empty structures, no active banners or production setting changes |
| Revisions, imports, outbox | New structures; product/category/brand changes after installation create audit/outbox records |
| Approved UI | No modifications to `src/app`, `src/components` or public artwork |

The local compatibility tests compare the entire original JSON object of each seed product against the migrated row, including IDs and values. A second fresh run includes PR #2's three optional columns. This is evidence for the version-controlled schemas, not a claim that the uninspected production database has identical tables, grants, policies, extensions or data volume.

These additive schema migrations intentionally change authorization. They are not a zero-impact production release. DDL constraints and transactional index creation can lock tables; time and size must be measured on an authorized staging copy before scheduling a production maintenance window.

## Local validation performed now

Run `npm run test:phase2` from the repository with a local Docker daemon and the pinned PostgreSQL image available. The runner constructs a fresh named container on the explicit local socket, uses `--network none`, publishes no host ports, emulates Auth/Storage SQL contracts, applies the two existing migrations and the two new migrations, runs assertions, then removes only that ephemeral container and its volume. It never reads `.env`, accepts a database URL or contacts a Supabase service. It intentionally seeds synthetic repository samples **inside this disposable database only**.

Do not execute the legacy seed migration against an existing store. The local fixture uses it only to test preservation.

## Later authorized staging sequence

1. Obtain explicit staging authorization. Inspect schema/grants/policies, migration history, storage policy interactions and the actual Supabase Postgres version. Rehearse restore from a protected database and storage backup first. Capture row counts and ID/value snapshots without publishing customer or credential data in logs.
2. Review all constraints, legacy grants, duplicate SKUs, existing bucket settings and ownership. The guard rejects unknown legacy catalog policies/column grants and a public `catalog-private` bucket. Resolve discrepancies through reviewed additive changes; do not automatically delete unknown policies.
3. Use an authorized database-owner session. Apply the foundation and then workflow migration, setting `app.catalog_cutover_approved` to `yes` in that same session immediately before each file. Each file has its own explicit transaction. This document intentionally does not provide a production target or production execution command.
4. Check defaults, row counts, old field snapshots, zero auto-published/verified records, public projections, role/preview permissions and authenticated Storage behavior using the full Supabase stack. Run tests with real Auth tokens and Storage uploads, including anonymous, ordinary user, editor and administrator accounts.
5. Only a trusted database operator assigns an explicitly verified Auth user ID a role in `app_private.user_roles`. Never copy the synthetic test IDs into staging/production. Keep the operator connection and service-role credentials outside browser bundles, admin forms and repository files.
6. Deploy the approved adapter to staging, verify no Draft leakage via pages, REST, media, metadata, redirects, sitemap or caches, then review the combined release with the owner. Publish real reviewed records only by explicit admin action.
7. Production migration, merge and deployment need separate approval. This phase grants none.

## Recovery

- **Before execution:** preserve an encrypted backup/PITR checkpoint, grants/policies definitions and storage-object inventory. Test restoring them into a separate authorized environment. Database backups do not necessarily include storage binaries.
- **Within a failing migration:** PostgreSQL rolls back that file's transaction, including schema/data/grants changes. The runner confirms the cutover guard leaves no foundation column behind.
- **Between the two committed files:** the foundation alone still denies Draft access. Keep the storefront cutover paused; investigate and rerun the corrected, reviewed workflow migration or restore a staging checkpoint. Do not temporarily restore anonymous raw-table access.
- **After both commit:** prefer an additive forward correction. There is deliberately no destructive down migration: dropping the new structures would lose revisions/import/audit/media associations. Freeze authoring, preserve an additional backup, repair in staging, and review the repair before production application.
- **If full rollback is unavoidable:** restore the pre-cutover database **and matching previous application** into a separate authorized environment, restore required storage binaries, reconcile any later writes/orders, validate security and only then plan an approved traffic switch. A code rollback alone is incompatible with the new raw-table access policy.
- **If a product was wrongly published:** an administrator returns it to Draft or archives it using its current version. Database public views immediately stop returning it. Future application infrastructure must immediately expire all associated page/metadata/media caches and revoke/expire signed URLs. Restoration does not reuse a previous review; resubmit, review and approve.

No production backup, restore, policy change, role assignment or migration was performed during Phase 2.
