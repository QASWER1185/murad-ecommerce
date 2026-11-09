# Production release Gate 1 — read-only inspection

**Supabase inspection: PASS within its recorded metadata scope. Vercel access and
production deployment metadata: PASS after team approval. Production release
remains BLOCKED; Gate 2 is NOT APPROVED / not safe to begin yet.**

Read the [final readiness assessment](final-readiness-assessment.md), including
the exact deployment, twelve-commit comparison, Node 26 review and Gate 2 proposal.

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
| Vercel team/project | PASS for current read-only scope | Access restored; canonical production READY at c73b01b, current project Node 26.x. Full candidate runtime/hosting acceptance remains unverified |
| ERP isolation | NOT VERIFIED, critical | E-commerce metadata alone cannot prove separate Auth/credentials/integrations or absence of external ERP use |
| Later gates | BLOCKED | No backup, restore, migration, feature activation, merge or deployment authorized |

No production data rows, customer records, Auth users/sessions/tokens, commercial
values, Storage objects/files or secrets were retrieved. Column defaults such as
`price DEFAULT 0` describe schema, not actual product prices. No RLS probe using
business rows or write operation was attempted. Temporary transaction-local safety
timeouts are inspection bounds, not persistent database configuration changes.

## Reports

- [Final readiness assessment](final-readiness-assessment.md)
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

Branch `development/production-gate1-inspection` starts at reviewed PR #11
commit `f4deb663ac4b3d372d22be6d39f5f034334a7005` and targets
`development/controlled-launch-prep`. Changes are Gate 1 reports/evidence plus the
single branch-specific `vercel.json` exclusion approved on **9 November 2026
(Asia/Karachi)**. App source, artwork, SQL, dependencies and every other existing
configuration value remain unchanged. Supabase observations retain the 8 November inspection timestamp. The later
read-only Vercel refresh is separately timestamped; the Git exclusion itself
does not inspect or alter production.

**PASS — Git deployment prevention verified before the first branch push.**
The added rule is exactly:

```json
"development/production-gate1-inspection": false
```

Vercel's [official matching rule](https://vercel.com/docs/project-configuration/git-configuration)
says exact false entries disable branch Git deployments, unspecified branches
otherwise default true, and a matching true rule can override false. Validation
confirms the exact branch matches false, all nine previous exclusions/configuration
are preserved, and there are **zero true rules or wildcard patterns**. No tracked
CI deployment workflow or active custom commit/push hook exists. The first push
includes the guarded final head, not the earlier unguarded documentation commit
alone. No manual deployment command or Vercel settings change is authorized/run.

[Pre-push safety evidence](evidence/deployment-safety.json) records the exact config
SHA256 and checks; [changed-file inventory](evidence/file-inventory.json) lists the
complete scope. Draft publication is authorized by the limited exception. The
prior Vercel owning-team 403 is resolved for the subsequent read-only metadata
checks. Fresh sanitized evidence and its limits are in the final assessment. No
provider security/application acceptance is claimed.

Build/application tests were not rerun for reports plus a boolean Git-trigger
exclusion. JSON validity, exact config preservation, branch matching, docs links,
credential exclusion, source preservation and whitespace were checked.

**Stop after Gate 1. Gate 2 remains NOT APPROVED.** No merge, migration, RLS change,
backup, production/ERP modification or live feature activation follows from this
publication exception.
