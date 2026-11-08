# Actual hosted performance results

**Overall: BLOCKED — not executed on real staging.**

The owner supplied only Production/Main, single-tenant identifiers. No separate
authorized staging project, HTTPS hostname or operator access is available to this
execution environment. No production fallback is permitted.

| Check | Status | Evidence / reason |
| --- | --- | --- |
| Homepage/Sanitary/brand/product mobile LCP and CLS | BLOCKED | Upstream staging-isolation/access gate unmet; no hosted request attempted |
| INP or clearly qualified measurable lab interactions | BLOCKED | Upstream staging-isolation/access gate unmet; no hosted request attempted |
| Approved-layout mobile usability | BLOCKED | Upstream staging-isolation/access gate unmet; no hosted request attempted |
| Real database latency and connection-pool capacity | BLOCKED | Upstream staging-isolation/access gate unmet; no hosted request attempted |
| Approved 2000+ synthetic catalog and pagination | BLOCKED | Upstream staging-isolation/access gate unmet; no hosted request attempted |
| Bounded concurrent searches and requests | BLOCKED | Upstream staging-isolation/access gate unmet; no hosted request attempted |
| Actual image/XLSX memory and function duration | BLOCKED | Upstream staging-isolation/access gate unmet; no hosted request attempted |
| Actual gateway body limits and hosting concurrency | BLOCKED | Upstream staging-isolation/access gate unmet; no hosted request attempted |

**No hosted metric is available:** LCP/CLS/INP, RSS, concurrency, timeouts, body
limits and connection-pool capacity are unmeasured. “Free/standard defaults” is
not a numeric test budget; no provisioning or load test was attempted.

Historical local-only context: Part A measured homepage/Sanitary LCP above 2.5 s
and about 377–388 MiB direct XLSX parser peak RSS. These are **not Part B hosted
results**. See [Part A measurements](../phase8-part-a/performance-report.md).

Required next inputs: see [staging-environment.md](staging-environment.md).
Statuses are defined in [README.md](README.md); detailed ledger is in evidence.
