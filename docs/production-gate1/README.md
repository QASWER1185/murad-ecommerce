# Production release Gate 1 — read-only inspection

**Supabase inspection: PASS within metadata-only scope. Vercel inspection: BLOCKED
(403). Gate 2 execution: NOT APPROVED / not safe to begin yet.**

**ERP ISOLATION NOT VERIFIED — PRODUCTION CHANGES BLOCKED.**

Inspected only owner-authorized e-commerce Supabase project `murad-ecommerce` /
`ddgjspvdgjpbysylntji`, after matching both name and ref. No Muraderp ai resource,
repository, identity, table, hosting, secret, job, domain or dependency was followed.
Reports use Asia/Karachi; evidence timestamps are UTC.

| Finding | Status | Evidence / implication |
| --- | --- | --- |
| Exact Supabase identity/health | PASS | ACTIVE_HEALTHY; provider build 17.11.0.018; SQL PostgreSQL 17.11 |
| Three SQL inspections | PASS | Explicit READ ONLY, five-second statement and one-second lock bounds; each reported read_only=on |
| Production history vs candidate | FAIL for release parity | Only the two original migrations recorded; ten catalog/Admin/media/import/order/security migrations absent |
| Database catalog | PASS observed | Three public tables, no public views/functions, no app_private schema; nineteen legacy columns |
| Public data boundary | FAIL for proposed Draft privacy | RLS enabled, but all three SELECT policies use true for PUBLIC; no publication status/verification fields or approved projections yet |
| Privilege hygiene | FAIL for target least privilege | anon/authenticated hold broad table grants including TRUNCATE; row RLS is not a substitute for revoking excessive capabilities |
| Storage metadata | PASS observed / acceptance NOT VERIFIED | No bucket rows returned; buckets/objects RLS enabled, no policies returned. No object/file query performed |
| Auth settings / actual backups | NOT VERIFIED | Service tables exist; no configuration/backup inventory capability exposed by current metadata tools; no users/tokens read |
| Vercel team/project | BLOCKED | Exact scoped project listing denied 403; actual deployment SHA/runtime/env names/domains/limits unverified |
| ERP isolation | NOT VERIFIED, critical | E-commerce metadata alone cannot prove separate Auth/credentials/integrations or absence of external ERP use |
| Later gates | BLOCKED | No backup, restore, migration, feature activation, merge or deployment authorized |

No production data rows, customer records, Auth users/sessions/tokens, commercial
values, Storage objects/files or secrets were retrieved. Column defaults such as
`price DEFAULT 0` describe schema, not actual product prices. No RLS probe using
business rows or write operation was attempted. Temporary transaction-local safety
timeouts are inspection bounds, not persistent database configuration changes.

## Reports

- [Supabase inventory](supabase-inventory.md)
- [Actual migration drift](migration-drift.md)
- [Vercel access/configuration limits](vercel-inventory.md)
- [ERP isolation](erp-isolation.md)
- [Security gaps](security-gaps.md)
- [Backup readiness](backup-readiness.md)
- [Prioritized release blockers](release-blockers.md)
- [Gate 2 recommendation / exact future permissions](gate2-recommendation.md)

Raw, bounded, non-sensitive metadata and [executed queries](evidence/metadata-queries.md)
are retained under evidence. PASS means observed/executed in the stated metadata
scope; FAIL means an observed condition misses the proposed release requirement;
BLOCKED means permission/capability prevents completion; NOT VERIFIED means no
sufficient evidence. Historical local tests in PR #11 are not production acceptance.

## Git scope and publication safeguard

Local branch `development/production-gate1-inspection` starts at reviewed PR #11
commit `f4deb663ac4b3d372d22be6d39f5f034334a7005`. Only this documentation directory
changes. App source, artwork, SQL, lockfile and Vercel configuration are untouched.
No build/regression rerun is needed for metadata reports; documentation/data-shape,
local-link, source-preservation and secret-exclusion checks are recorded separately.

**Draft PR publication is held pending a no-deployment safeguard.** The requested
new branch is absent from `vercel.json`'s explicit deployment exclusions. Vercel's
[current configuration rule](https://vercel.com/docs/project-configuration/git-configuration)
and schema say unspecified branches default to true. Team access is denied, so
actual Git linkage/ignored-build settings cannot be verified. A push might trigger
a forbidden automatic Preview. No reliable native commit-message skip was verified.

The minimal proposed exception to the documentation-only scope is exactly:

```text
vercel.json → git.deploymentEnabled
"development/production-gate1-inspection": false
```

This has **not** been applied. Owner can separately approve that branch-only
repository safeguard, or provide authorized evidence that automatic deployments
for this exact branch are already disabled. Do not change production Vercel
settings as an alternative under Gate 1. Then publish the Draft targeting
`development/controlled-launch-prep`; do not merge it. The audit reports are
complete/reviewable locally while this final publication decision is pending.

**Stop after Gate 1.** No later gate or live operation starts from this report.
