# Prioritized release blockers

| Priority / status | Blocker | Required decision/evidence |
| --- | --- | --- |
| Critical — NOT VERIFIED | ERP isolation | Owner-provided non-secret dependency/source-scope evidence; no ERP access; no changes while relationship uncertain |
| Critical — BLOCKED | Gate 2 authority/recovery target | Exact source/destination/operator/data scope, encrypted retention, capacity, DB + binary archive/restore verification approved separately |
| Critical — FAIL release parity | Ten migrations absent | Gate 3 review of current legacy schema, live data impact and compatible staged installation; never replay original seed |
| Critical — FAIL target privacy | Unrestricted legacy raw SELECT / broad grants | Reviewed least-privilege/public-view transition coordinated with app; no fixes applied in Gate 1 |
| Critical — BLOCKED | Vercel identity/deployment/config inspection | Owning-team 403 resolved through provider grant; exact project verified before further reads |
| Critical — NOT VERIFIED | Actual running app/DB compatibility | Verify live deployed SHA, runtime/build/env-name scopes, aliases and maintenance admission without reading secret values |
| Critical — BLOCKED | Production feature activation | Candidate hard gates closed; separately reviewed production-mode code and per-feature acceptance; no environment-only workaround |
| Critical for affected feature — NOT VERIFIED | Hosted Auth/Storage/orders/worker/privacy | Provider-level acceptance before opening each path; no synthetic local PASS promoted |
| High — NOT VERIFIED | Hosting capacity/backup inventory | Function body/time/RSS/pool headroom and actual backup capability; max_connections=60 is not load certification |
| High — prior local target unmet | LCP/XLSX/contrast | PR #11 local performance/contrast findings remain historical constraints; no new hosted measurement |
| Publication — BLOCKED | Documentation-only branch may auto-deploy on push | New branch lacks deployment exclusion; Vercel auto-deployment configuration unverified. Approve branch-only repository guard or supply authorized disabled-deployment evidence |

Gate 1 is an inspection, not authorization to repair these conditions. All nine
reports and non-sensitive evidence are locally reviewable. No existing PR was
merged or closed. No production application/SQL/hosting configuration changed.

## Later gate sequence — none authorized now

- Gate 2: narrowly authorized DB/private binary backup and verified isolated restore,
  after source isolation/capacity/access/retention are resolved.
- Gate 3: migration incompatibility, production gate/security/capacity remediation
  reviewed and validated; no blind legacy seed or PR #2 merge.
- Gate 4: owner-approved e-commerce maintenance and compatible non-atomic app/DB
  cutover, with abort/recovery and no ERP/shared-resource mutation.
- Gate 5: protected controlled live acceptance of Admin, media, catalog, order
  requests and machine worker, opening only separately approved features.
- Gate 6: owner-approved genuine product publication and eligible SEO indexing.

The full future procedure is [PR #11's cutover plan](../controlled-launch-prep/production-cutover-runbook.md).
Actual production evidence here updates its unknown-schema gate; remaining
provider/ERP/recovery unknowns are not waived.
