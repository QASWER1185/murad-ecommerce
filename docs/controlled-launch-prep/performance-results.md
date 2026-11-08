# Reproducible local performance and memory

**PASS — measurements executed. FAIL — Homepage/Sanitary 2.5 s LCP target remains
unmet in this lab. BLOCKED — hosting capacity and real field performance.** No
performance score, hosted latency, field INP or infrastructure ceiling is invented.

Command: `npm run verify:controlled-launch` executes `test:phase7:e2e`,
`test:phase7:capacity` and `node scripts/phase7/capacity.mjs`. Browser lab uses
390×844, cold browser cache, 4× CPU throttle, 150 ms latency, 200,000 bytes/s and
three samples per route. The local executor also performed image downloads during
this run; before/after values are observational and not an isolated causal claim.

| Page | Prior Part A median LCP | Current local median LCP |
| --- | --- | --- |
| Homepage | 3.636 s | 3.728 s |
| Sanitary | 3.268 s | 3.452 s |
| Porta brand | See prior evidence | 1.616 s |
| Product fixture | See prior evidence | 1.132 s |

Current max CLS across those samples is 0.000185 (rounded up). Recorded lab
interaction durations are not field INP. No runtime/artwork/font/layout change was
made; no measured improvement or statistically established regression is claimed.
Approved four-page desktop/mobile captures match Part A **every raw pixel**.
Real hosted browser/cache conditions and field Core Web Vitals remain unmeasured.

## XLSX and images

| Probe | Actual local result |
| --- | --- |
| XLSX | 10,000 rows × 40 columns; 986,906-byte workbook; direct parser 1.256 s; process max RSS 399,040,512 bytes (**380.6 MiB**) |
| Previous XLSX context | Approximately 377–388 MiB; current result remains in that range, with no memory-reduction claim |
| Images | 6000×4000 high-entropy JPEG, 7,784,507 bytes; two simultaneous accepted, third rejected; peak RSS 120.1 MiB; approximately 376 ms |

Parser-only numbers exclude full HTTP multipart/Next/SDK/Storage overhead. Upload
limits stay 10 MiB/24 MP and spreadsheets 8 MiB/10,000 rows/40 columns. No validation
or size boundary was weakened. A typical provider process cannot be certified from
these measurements; deployment body/time/RSS limits remain BLOCKED.

## Bounded 2,000-product local catalog

Real SQL review/publication RPCs create only synthetic fixture products. Six
scenarios keep response pages ≤12 products, with three EXPLAIN ANALYZE runs each:

| Query | Median execution |
| --- | --- |
| First category page | 731.12 ms |
| Category page 100 | 521.28 ms |
| Search | 412.03 ms |
| Brand | 608.30 ms |
| Price sort | 691.09 ms |
| Product / related | 643.73 ms |

These are DB execution values, not full network requests, concurrency capacity or
production scalability guarantees. No new query budget has been approved; real
pool/host limits and concurrent performance need separately scoped acceptance.

## Proposed import processing alternative — NOT IMPLEMENTED / review required

Before enabling large live imports on an unproven hosting process, review a bounded
worker design using the existing private source/import/audit/version contracts:

1. HTTP upload validates actual content/size and durably stores the private source;
   return an import/job ID. Do not parse a workbook concurrently in every web request.
2. Dedicated local/operator-approved worker claims a durable job with lease,
   heartbeat, bounded retries/idempotency and a strict global parser concurrency
   of one initially. Recover expired leases without duplicate Draft writes.
3. Keep all ZIP/XML/formula/unheaded-cell limits. Whole-file validation must finish
   before approving rows; do not turn streaming into partial unsafe acceptance.
   Benchmark streaming/shared-string storage changes against the same adversarial
   tests before adopting them. Blank cells preserve values; prices need approval.
4. Persist previews/errors/batch cursors; apply existing optimistic-version RPCs.
   Never auto-publish. Distinguish parsing from reviewed product import approval.
5. Measure full-process RSS/time/body limits and backpressure in the selected
   environment. If it cannot fit with headroom, do not enable that path. Dedicated
   resources or any new charge require separate review/owner approval.

This is an alternative design for review, not a working background service or an
excuse to lower validation. Existing durable product batches do not themselves
move initial workbook parsing out of the web process.

Evidence: [mobile samples](evidence/mobile-lab.json), [memory](evidence/memory.json),
[SQL plans](evidence/catalog-capacity.json), [visual equality](evidence/visual-comparison.json).
