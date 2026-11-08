# Real worker and monitoring results

**Overall: BLOCKED — not executed on real staging.**

The owner now authorizes creating isolated staging in existing accounts at no
additional cost. Supabase is connected; one project creation attempt was rejected
by its member-wide active free-project quota. Vercel is connected, but owning-team metadata returned 403 pending consent. No
staging project or HTTPS hostname has been created or verified.
No production fallback is permitted.

| Check | Status | Evidence / reason |
| --- | --- | --- |
| Dedicated narrow machine identity and private key custody | BLOCKED | Supabase free-project quota prevents creation; Vercel owning-team access awaiting provider consent; no isolated test target |
| No human-cookie or browser service-role dependency | BLOCKED | Supabase free-project quota prevents creation; Vercel owning-team access awaiting provider consent; no isolated test target |
| Signature age, domain binding and nonce replay rejection | BLOCKED | Supabase free-project quota prevents creation; Vercel owning-team access awaiting provider consent; no isolated test target |
| Concurrent claims/ack leases and crash recovery | BLOCKED | Supabase free-project quota prevents creation; Vercel owning-team access awaiting provider consent; no isolated test target |
| Retry/backoff and invalidation acknowledgement | BLOCKED | Supabase free-project quota prevents creation; Vercel owning-team access awaiting provider consent; no isolated test target |
| Withdrawal remains effective when worker is delayed/offline | BLOCKED | Supabase free-project quota prevents creation; Vercel owning-team access awaiting provider consent; no isolated test target |
| Approved cadence/budget staging-only scheduler | BLOCKED | Supabase free-project quota prevents creation; Vercel owning-team access awaiting provider consent; no isolated test target |
| Missed-run/backlog/failed-run monitoring | BLOCKED | Supabase free-project quota prevents creation; Vercel owning-team access awaiting provider consent; no isolated test target |

**NOT RUN:** No machine/order key was provisioned, cron installed or test alert
sent. The existing disabled schedule example remains a plan, not an operational
service. Cadence, identity, alert recipient and resource limits are still needed.

Required next inputs: see [staging-environment.md](staging-environment.md).
Statuses are defined in [README.md](README.md); detailed ledger is in evidence.
