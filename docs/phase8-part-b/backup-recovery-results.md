# Actual backup and recovery results

**Overall: BLOCKED — not executed on real staging.**

The owner now authorizes creating isolated staging in existing accounts at no
additional cost. Supabase is connected; one project creation attempt was rejected
by its member-wide active free-project quota. Vercel is connected, but owning-team metadata returned 403 pending consent. No
staging project or HTTPS hostname has been created or verified.
No production fallback is permitted.

| Check | Status | Evidence / reason |
| --- | --- | --- |
| Staging DB backup and independently restored schema/data | BLOCKED | Supabase free-project quota prevents creation; Vercel owning-team access awaiting provider consent; no isolated test target |
| Separate private Storage original/derivative/import binary backup | BLOCKED | Supabase free-project quota prevents creation; Vercel owning-team access awaiting provider consent; no isolated test target |
| Product revision and order-history recovery | BLOCKED | Supabase free-project quota prevents creation; Vercel owning-team access awaiting provider consent; no isolated test target |
| RLS/role/permission restoration | BLOCKED | Supabase free-project quota prevents creation; Vercel owning-team access awaiting provider consent; no isolated test target |
| Worker queue recovery and credential rotation | BLOCKED | Supabase free-project quota prevents creation; Vercel owning-team access awaiting provider consent; no isolated test target |
| Measured recovery duration and observed data-loss window | BLOCKED | Supabase free-project quota prevents creation; Vercel owning-team access awaiting provider consent; no isolated test target |

**No RPO/RTO claimed.** No DB dump, Storage archive, restore, credential rotation
or recovery timer exists for real staging. The earlier fixture round-trip is
local/simulated Storage evidence and is not promoted to a hosted recovery result.

Required next inputs: see [staging-environment.md](staging-environment.md).
Statuses are defined in [README.md](README.md); detailed ledger is in evidence.
