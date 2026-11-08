# Real worker and monitoring results

**Overall: BLOCKED — not executed on real staging.**

The owner now authorizes creating isolated staging in existing accounts at no
additional cost. Supabase/Vercel integrations and runtime operator access remain
unavailable; no staging project or HTTPS hostname has been created or verified.
No production fallback is permitted.

| Check | Status | Evidence / reason |
| --- | --- | --- |
| Dedicated narrow machine identity and private key custody | BLOCKED | Provider provisioning access unavailable; no isolated target or hosted request |
| No human-cookie or browser service-role dependency | BLOCKED | Provider provisioning access unavailable; no isolated target or hosted request |
| Signature age, domain binding and nonce replay rejection | BLOCKED | Provider provisioning access unavailable; no isolated target or hosted request |
| Concurrent claims/ack leases and crash recovery | BLOCKED | Provider provisioning access unavailable; no isolated target or hosted request |
| Retry/backoff and invalidation acknowledgement | BLOCKED | Provider provisioning access unavailable; no isolated target or hosted request |
| Withdrawal remains effective when worker is delayed/offline | BLOCKED | Provider provisioning access unavailable; no isolated target or hosted request |
| Approved cadence/budget staging-only scheduler | BLOCKED | Provider provisioning access unavailable; no isolated target or hosted request |
| Missed-run/backlog/failed-run monitoring | BLOCKED | Provider provisioning access unavailable; no isolated target or hosted request |

**NOT RUN:** No machine/order key was provisioned, cron installed or test alert
sent. The existing disabled schedule example remains a plan, not an operational
service. Cadence, identity, alert recipient and resource limits are still needed.

Required next inputs: see [staging-environment.md](staging-environment.md).
Statuses are defined in [README.md](README.md); detailed ledger is in evidence.
