# Final Gate 1 readiness assessment

**Gate 1 inspection evidence is available; production release remains BLOCKED.
Gate 2 is NOT APPROVED and has not started.** Vercel team access now works.
This update uses fresh read-only e-commerce Vercel/GitHub metadata and current
public runtime documentation. Supabase findings retain the 8 November 2026
inspection timestamp; no Supabase re-query or ERP access occurred for this update.
No provider setting, deployment, database, secret or live feature was changed.

## 1. Exact production deployment and build result

| Field | Verified result |
| --- | --- |
| Project / team | murad-ecommerce / prj_OXReC9drbCnKpRDc1KdPrLyMvbFU / team_aLiRohDtAAZqq656cMy1Hwzz |
| Production alias | https://murad-ecommerce.vercel.app |
| Deployment ID | dpl_JBtpFzJHEfCJud4eAH2UfFhijUWa |
| Target / provider state | production / READY |
| Git source | QASWER1185/murad-ecommerce, main |
| Exact deployed SHA | c73b01b93c4093edefe1c00e34299a9041ea5bef |
| Build result | Vercel reports READY, with no errorCode reported; building-to-ready timestamp interval 11,869 ms |
| Acceptance limit | No build-log audit or application acceptance test; READY is deployment/build completion, not security certification |

Evidence: [sanitized fresh provider metadata](evidence/vercel-current-inspection.json),
[authenticated Vercel deployment API](https://api.vercel.com/v13/deployments/dpl_JBtpFzJHEfCJud4eAH2UfFhijUWa),
[immutable deployed source](https://github.com/QASWER1185/murad-ecommerce/tree/c73b01b93c4093edefe1c00e34299a9041ea5bef).
The API link requires authorized Vercel access; no credential is embedded.

## 2. Production versus development: twelve commits

Candidate: `development/controlled-launch-prep` at
`f4deb663ac4b3d372d22be6d39f5f034334a7005` (PR #11). Production is its ancestor;
candidate is **12 ahead / 0 behind**. The Gate 1 documentation branch is separate
and is not a new application release candidate.

| Order | Exact commit link | Change |
| --- | --- | --- |
| 1 | [2308dd6](https://github.com/QASWER1185/murad-ecommerce/commit/2308dd687443b11049ec2762dddcc819b01f2910) | Guarded catalog publication/SEO database foundation |
| 2 | [d9e27ec](https://github.com/QASWER1185/murad-ecommerce/commit/d9e27ec7bcece95a0e487195d506f700a4c409d7) | Request-scoped Admin dashboard/product workflow |
| 3 | [bc50bfc](https://github.com/QASWER1185/murad-ecommerce/commit/bc50bfcd72cd7fbc26c410f6a47bf8e7ae58a2ef) | Private media and resumable imports |
| 4 | [7ae9d79](https://github.com/QASWER1185/murad-ecommerce/commit/7ae9d7985340ec3b6ac5e9b2dbd3e22dc7b72814) | Central public catalog/storefront integration |
| 5 | [9df5487](https://github.com/QASWER1185/murad-ecommerce/commit/9df548718d4beac223b052290f70e91dc7c59039) | Guest requests and private analytics preparation |
| 6 | [c8f9f70](https://github.com/QASWER1185/murad-ecommerce/commit/c8f9f701c783a4a7f86b4587f641ba7d964414aa) | MFA, narrow worker and readiness QA |
| 7 | [264cc21](https://github.com/QASWER1185/murad-ecommerce/commit/264cc217ede7e6246dbe4554629089677b92d9d5) | Phase 8A audit/import/preflight fixes |
| 8 | [ff7f1df](https://github.com/QASWER1185/murad-ecommerce/commit/ff7f1df1ea204ebdc89c44a581b64a4d03d66b67) | Phase 8B isolation checks/blocked report |
| 9 | [707fff4](https://github.com/QASWER1185/murad-ecommerce/commit/707fff4a623f2a84a281c54f1a997f2bea3dfd92) | Staging authorization/access blocker record |
| 10 | [029b965](https://github.com/QASWER1185/murad-ecommerce/commit/029b9655db6941e0f54140006c47271703c1aa4f) | Supabase connection/free-quota rejection record |
| 11 | [e356331](https://github.com/QASWER1185/murad-ecommerce/commit/e35633164bba10621093a4a5da375d83adf372d6) | Vercel connection/team-consent record |
| 12 | [f4deb66](https://github.com/QASWER1185/murad-ecommerce/commit/f4deb663ac4b3d372d22be6d39f5f034334a7005) | Controlled local validation/cutover preparation |

[GitHub full comparison](https://github.com/QASWER1185/murad-ecommerce/compare/c73b01b93c4093edefe1c00e34299a9041ea5bef...f4deb663ac4b3d372d22be6d39f5f034334a7005)
and [exact history evidence](evidence/production-development-comparison.json).
No commit was merged or deployed for this assessment.

## 3. Node.js 26.x / Next.js compatibility

**PASS — documented support/declared version range. NOT VERIFIED — full candidate
runtime acceptance on Node 26.**

- Fresh Vercel project metadata configures Next.js with Node `26.x`.
- Both the deployed source package and candidate declare Next.js `16.4.5`.
- The [versioned Next package](https://registry.npmjs.org/next/16.4.5) declares
  `engines.node >=20.9.0`; Node 26 satisfies that declared requirement.
- [Current Vercel runtime documentation](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions)
  lists 26.x (default), 24.x and 22.x as available. Node 26 is not an unsupported
  platform version on the inspected documentation date.
- Neither source package pins `engines.node`. The recorded Part A test runtime was
  [v24.22.1](../phase8-part-a/evidence/summary.json). The full candidate has not
  been regression-tested on Node 26; native/media/import/SSR behavior still needs
  that acceptance. No dependency or runtime was changed here.
- Current project settings do not independently prove which Node major the older
  deployment used when it originally built; per-deployment Node version was not
  returned in the inspected metadata. READY does not close the candidate test gap.

Evidence: [compatibility record and sources](evidence/node26-compatibility.json),
[production package](https://github.com/QASWER1185/murad-ecommerce/blob/c73b01b93c4093edefe1c00e34299a9041ea5bef/package.json),
[candidate package](https://github.com/QASWER1185/murad-ecommerce/blob/f4deb663ac4b3d372d22be6d39f5f034334a7005/package.json).
Gate 3 should validate the candidate under Node 26 and review an explicit engine
policy. Any runtime/engine change needs separate review; no automatic downgrade.

## 4. Missing database migrations and dependency order

The 8 November metadata snapshot records only `20261106055003` and
`20261106064811`. The ten files below were absent then; no current-day Supabase
check or migration execution occurred. [History](evidence/installed-migrations.json),
[version/name/hash comparison](evidence/migration-comparison.json).

| Order | Migration | Required dependency / purpose |
| --- | --- | --- |
| 1 | 20261108000100_catalog_foundation.sql | Existing legacy schema; private roles, workflow fields, media/import/settings foundation |
| 2 | 20261108000200_catalog_workflow.sql | Foundation; explicit review/publication/version/slug contracts |
| 3 | 20261108000300_admin_operations.sql | Foundation/workflow; validated Draft/Admin operations and throttling |
| 4 | 20261108000400_catalog_media.sql | Foundation/workflow; immutable media, responsive variants and galleries |
| 5 | 20261108000500_catalog_content.sql | Catalog/media; taxonomy, brand, banner and settings operations |
| 6 | 20261108000600_catalog_imports.sql | Catalog/Admin contracts; private sources, approval, batches/history/retries |
| 7 | 20261108000700_storefront_integration.sql | Catalog/media/workflow; public storefront RPCs, projections and invalidation leases |
| 8 | 20261108000800_order_requests.sql | Storefront; signed request gateway, snapshots/idempotency/private history |
| 9 | 20261108000900_staging_hardening.sql | Existing roles/outbox/order helpers; MFA and narrow machine-worker protections |
| 10 | 20261108001000_catalog_query_plans.sql | Existing storefront RPCs; scoped planner configuration |

Migration bodies/dependencies are in [the reviewed source directory](https://github.com/QASWER1185/murad-ecommerce/tree/f4deb663ac4b3d372d22be6d39f5f034334a7005/supabase/migrations).
Safe *future* order is the order above, after refreshed metadata, isolation and
verified recovery, approved hashes/window/operator and compatible maintenance
cutover. Preserve per-connection cutover guards. Do not replay the two installed
migrations/seed or install restrictive grants beneath the current legacy app.
The now-verified production SHA points to [legacy raw-table source](https://github.com/QASWER1185/murad-ecommerce/blob/c73b01b93c4093edefe1c00e34299a9041ea5bef/src/app/category/%5Bslug%5D/page.tsx);
new code also needs the new schema. A Git revert is not database recovery.

## 5. Unresolved blockers

| Risk | Finding / boundary | Evidence |
| --- | --- | --- |
| Critical | ERP isolation NOT VERIFIED. No ERP resource inspected; e-commerce metadata cannot exclude shared Auth/keys/integrations or quota effects | [Isolation report](erp-isolation.md) |
| Critical | Actual usable backup/retention/restore NOT VERIFIED. Free plan confirmed; no backup/export/restore performed | [Backup readiness](backup-readiness.md), [plan](evidence/organization-plan.json), [provider documentation](https://supabase.com/docs/guides/platform/backups) |
| High; critical before private authoring | Legacy public SELECT USING(true), broad anon/authenticated grants including TRUNCATE. RLS does not govern TRUNCATE; no write exploit or customer-data read demonstrated | [Policy/grant metadata](evidence/database-structure-and-access.json), [security analysis](security-gaps.md) |
| Critical for media activation | No bucket rows in the snapshot; actual Storage HTTP/private-original/withdrawal/CDN behavior NOT VERIFIED. A DB backup excludes object bytes | [Service metadata](evidence/services-and-roles.json), [local service limits](../controlled-launch-prep/local-supabase-results.md) |
| Critical for rollout | Ten schema changes absent in snapshot; current live legacy app/new restrictive schema need coordinated fail-closed cutover. Candidate production feature gates remain closed | [Migration analysis](migration-drift.md), [cutover plan](../controlled-launch-prep/production-cutover-runbook.md) |
| Release verification | Full candidate Node 26 tests and actual hosting body/memory/duration/pool capacity not verified; earlier local LCP/XLSX constraints remain | [Runtime evidence](evidence/node26-compatibility.json), [local performance](../controlled-launch-prep/performance-results.md) |

The previous Vercel 403 is **resolved for these read-only operations**. It is not
an unresolved access blocker and does not authorize writes or Gate 2.

## 6. Prioritized Gate 2 proposal — not executed

| Priority | Prerequisite / proposed action | Risk controlled / exact approval needed |
| --- | --- | --- |
| P0 | Owner supplies non-secret e-commerce dependency/source-scope evidence resolving ERP isolation | Do not inspect ERP. No backup that might copy shared ERP data until source isolation is established |
| P0 | Choose trusted operator, encrypted destination, retention/access policy and sufficiently sized existing private restore target | Explicit Gate 2 approval naming source ref ddgjspvdgjpbysylntji, operator, window, destination, target and data/privacy scope; no third hosted project/new charges assumed |
| P1 | Read-only refresh of source identity/history/bucket manifest and actual backup capabilities before export | Exact-target metadata access through approved tools/bindings; no credentials in chat or broad account/ERP discovery |
| P1 | Consistent DB/schema/ACL/role/history backup plus separately authorized e-commerce Storage manifest/binaries | Separate explicit export/download approval, including whether real Auth/personal/business data are included; no public artifact/dump upload; recheck currently empty bucket manifest |
| P1 | Restore only into the named isolated target and verify data/schema/permission checksums, applicable history and private binaries | Explicit isolated restore/data-processing approval; no production restore. Measure recovery/loss window and obtain owner acceptance; no invented RPO/RTO |
| P2 | Produce a backup/recovery evidence package and review handoff | Redacted aggregates only. Gate 2 completion authorizes no migration, RLS change, deployment, secret rotation, worker, message, publication or indexing |

Detailed permission checklist: [Gate 2 recommendation](gate2-recommendation.md).
Node 26 remediation and migration/security/hosting fixes belong to separately
reviewed Gate 3; maintenance/app+DB execution to Gate 4; controlled feature
acceptance to Gate 5; real content/SEO activation to Gate 6. None is started here.

**Decision:** Gate 1 supports a precise next approval request. Gate 2 cannot start
under current authorization, and critical source-isolation/recovery-target
prerequisites still need owner evidence and acceptance.
