# Actual hosted performance results

**Overall: BLOCKED — not executed on real staging.**

The owner now authorizes creating isolated staging in existing accounts at no
additional cost. Supabase is connected; one project creation attempt was rejected
by its member-wide active free-project quota. Vercel remains unconnected. No
staging project or HTTPS hostname has been created or verified.
No production fallback is permitted.

| Check | Status | Evidence / reason |
| --- | --- | --- |
| Homepage/Sanitary/brand/product mobile LCP and CLS | BLOCKED | Supabase free-project quota prevents creation; Vercel not connected; no isolated test target |
| INP or clearly qualified measurable lab interactions | BLOCKED | Supabase free-project quota prevents creation; Vercel not connected; no isolated test target |
| Approved-layout mobile usability | BLOCKED | Supabase free-project quota prevents creation; Vercel not connected; no isolated test target |
| Real database latency and connection-pool capacity | BLOCKED | Supabase free-project quota prevents creation; Vercel not connected; no isolated test target |
| Approved 2000+ synthetic catalog and pagination | BLOCKED | Supabase free-project quota prevents creation; Vercel not connected; no isolated test target |
| Bounded concurrent searches and requests | BLOCKED | Supabase free-project quota prevents creation; Vercel not connected; no isolated test target |
| Actual image/XLSX memory and function duration | BLOCKED | Supabase free-project quota prevents creation; Vercel not connected; no isolated test target |
| Actual gateway body limits and hosting concurrency | BLOCKED | Supabase free-project quota prevents creation; Vercel not connected; no isolated test target |

**No hosted metric is available:** LCP/CLS/INP, RSS, concurrency, timeouts, body
limits and connection-pool capacity are unmeasured. New billable usage is forbidden. Provider quota and a bounded non-billable test
budget have not been verified. One $0-quoted project creation was rejected by
free quota; no load test was attempted.

Historical local-only context: Part A measured homepage/Sanitary LCP above 2.5 s
and about 377–388 MiB direct XLSX parser peak RSS. These are **not Part B hosted
results**. See [Part A measurements](../phase8-part-a/performance-report.md).

Required next inputs: see [staging-environment.md](staging-environment.md).
Statuses are defined in [README.md](README.md); detailed ledger is in evidence.
