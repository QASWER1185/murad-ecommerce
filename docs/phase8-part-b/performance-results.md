# Actual hosted performance results

**Overall: BLOCKED — not executed on real staging.**

The owner now authorizes creating isolated staging in existing accounts at no
additional cost. Supabase/Vercel integrations and runtime operator access remain
unavailable; no staging project or HTTPS hostname has been created or verified.
No production fallback is permitted.

| Check | Status | Evidence / reason |
| --- | --- | --- |
| Homepage/Sanitary/brand/product mobile LCP and CLS | BLOCKED | Provider provisioning access unavailable; no isolated target or hosted request |
| INP or clearly qualified measurable lab interactions | BLOCKED | Provider provisioning access unavailable; no isolated target or hosted request |
| Approved-layout mobile usability | BLOCKED | Provider provisioning access unavailable; no isolated target or hosted request |
| Real database latency and connection-pool capacity | BLOCKED | Provider provisioning access unavailable; no isolated target or hosted request |
| Approved 2000+ synthetic catalog and pagination | BLOCKED | Provider provisioning access unavailable; no isolated target or hosted request |
| Bounded concurrent searches and requests | BLOCKED | Provider provisioning access unavailable; no isolated target or hosted request |
| Actual image/XLSX memory and function duration | BLOCKED | Provider provisioning access unavailable; no isolated target or hosted request |
| Actual gateway body limits and hosting concurrency | BLOCKED | Provider provisioning access unavailable; no isolated target or hosted request |

**No hosted metric is available:** LCP/CLS/INP, RSS, concurrency, timeouts, body
limits and connection-pool capacity are unmeasured. New billable usage is forbidden. Provider quota and a bounded non-billable test
budget have not been verified; no provisioning or load test was attempted.

Historical local-only context: Part A measured homepage/Sanitary LCP above 2.5 s
and about 377–388 MiB direct XLSX parser peak RSS. These are **not Part B hosted
results**. See [Part A measurements](../phase8-part-a/performance-report.md).

Required next inputs: see [staging-environment.md](staging-environment.md).
Statuses are defined in [README.md](README.md); detailed ledger is in evidence.
