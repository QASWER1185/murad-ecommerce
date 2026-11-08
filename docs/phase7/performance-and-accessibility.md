# Measured performance and accessibility

All measurements are isolated **local synthetic tests**, not production scores, field
Core Web Vitals, hosted Supabase certification or a capacity/SLA guarantee. No
Lighthouse score is invented. Raw reports are in [evidence](evidence/).

## Mobile browser measurements

Chromium, 390×844, 4× CPU throttle, 150 ms latency, 200,000 bytes/s download,
cold browser cache; three runs per route. Current 12 samples; before-hero sample
set has nine runs. The local HTTP Auth/Storage contracts and flat product fixtures
are not representative manufacturer photography or real hosted network latency.
Observed EventTiming interaction durations are **not field INP**. CLS is cumulative
within this finite lab visit, not a field percentile.

| Route | Before hero work: median LCP | Current median LCP | Maximum CLS | Largest sampled interaction | Transferred JS (incl. HTTP overhead) |
| --- | ---: | ---: | ---: | ---: | ---: |
| `/` | 5.868 s | 3.684 s | 0.000006 | 48 ms | 152.8 KiB |
| `/category/sanitary` | 3.684 s | 3.360 s | 0.000083 | 24 ms | 144.0 KiB |
| `/brand/porta` | 1.544 s | 1.584 s | 0.000083 | 24 ms | 144.0 KiB |
| `/product/local-fixture-1` | Not sampled | 1.152 s | 0.000184 | 24 ms | 144.0 KiB |

Homepage median LCP changed from 5.868 s to 3.684 s in these local samples;
Sanitary changed from 3.684 s to 3.360 s. The brand control varied from 1.544 s
to 1.584 s, illustrating test noise. These are observed runs, not a guaranteed
percentage improvement or a production performance claim. Homepage/Sanitary
remain above the 2.5 s LCP good threshold in this slow-mobile lab; obtain real
waterfalls/field measurements and improve delivery further before launch.

Implemented: three smaller lossless WebP hero companions, viewport-specific
high-priority homepage preloads and a Sanitary hero preload. PNG originals remain
unchanged. The generator verifies raw RGBA equality before writing each companion;
bytes drop from 390,929→295,774, 249,538→182,820 and 150,153→108,800 (24–28%).
No new decoration, animation or runtime image library enters the browser.

## Database catalog capacity

2,000 new clearly named synthetic products were created through the actual Draft,
review and publish RPCs in a disposable fixture. No existing sample was published.
The baseline nested security-barrier join plan was pathological: an observed
retrieval was cancelled at 20.622 seconds; a direct membership-view plan took
3,475 ms. This is an incomplete baseline, **not** a completed before/after benchmark.

Migration 010 scopes `enable_nestloop=off` and `jit=off` to the existing read-only
storefront RPC. No global setting, security barrier, publication predicate, RLS,
DTO field or anonymous grant is weakened. Complete DTO equality is tested under
both planner strategies on the smaller regression fixture. Public browsing still
uses one snapshot and no shared content cache.

Three EXPLAIN ANALYZE/BUFFERS samples per case; each statement has an 8 s local
test timeout so a plan regression fails instead of running indefinitely. The
following includes actual SQL execution only, not Docker/process/HTTP overhead.

| Scenario | Median SQL execution | Range | Returned products | Matching products |
| --- | ---: | ---: | ---: | ---: |
| category-first | 888.8 ms | 806.2–935.0 ms | 12 | 2015 |
| category-page-100 | 599.9 ms | 598.3–635.4 ms | 12 | 2015 |
| search | 444.7 ms | 392.6–514.8 ms | 1 | 1 |
| brand | 788.3 ms | 753.5–863.1 ms | 12 | 2008 |
| price-sort | 805.5 ms | 773.3–945.6 ms | 12 | 2015 |
| product-related | 794.1 ms | 755.1–1088.2 ms | 4 | 2013 |

Local seed workflow: 12.21 s. Plans still perform substantial
shared-buffer reads (see raw report). This tuning needs authorized staging
validation with realistic category depth, brand distribution, approved photos,
concurrent shoppers and larger catalogs. It is not proof of linear scalability
or a production database sizing recommendation. Admission plus render may use
separate snapshots; measure the complete HTTP path as well as this SQL RPC.

## XLSX and image memory

Fresh separate Node processes probe the real Phase 4 implementation. Input
generation happens outside the measured child. ResourceUsage maxRSS measures
the process lifetime; no HTTP multipart/Auth/Storage/hosting memory is included.

| Probe | Input | Elapsed | Baseline RSS | Process peak RSS |
| --- | --- | ---: | ---: | ---: |
| XLSX, 10,000 rows × 40 columns | 0.94 MiB | 1.592 s | 60.7 MiB | 384.7 MiB |
| Two concurrent 24 MP high-entropy JPEG decodes + WebP derivatives | 7.42 MiB | 0.574 s | 55.7 MiB | 117.7 MiB |

A third simultaneous image processor is rejected; one spreadsheet parser per
process is enforced. Parser/image limits are process-local and multiply across
host instances. The XLSX sample is 0.94 MiB compressed with many repeated cells;
other permitted files may use more memory. Large image input is deterministic
high-entropy 6000×4000 JPEG, not a manufacturer photograph.

**Release blocker:** certify actual multipart request/body/duration/RSS and
concurrency limits in the chosen staging hosting plan. Measure parser + image +
app concurrency and failure recovery before selecting memory/instance limits or
a separate import worker. Current direct-parser peak does not fit safely in a
small 512 MiB process alongside the full app. No hosting maximum-user claim is made.

## Accessibility and visual regression

Axe WCAG 2 A/AA and 2.1 A/AA scans cover ten desktop/mobile views. Incorrect
WhatsApp, brand and cart accessible names and missing dialog titles are fixed.
Admin neutral/gold text contrast is improved without changing the storefront.
Keyboard tests verify cart activation, focus within a populated native modal,
Escape and focus return. Mobile layouts have no horizontal overflow.

MFA, desktop/mobile Admin overview and the scanned brand page have **zero detected
Axe violations**. This is automated sample coverage, not full accessibility
certification. Remaining findings are the approved storefront's small red Deals
badge and missing-image placeholder text contrast: homepage six nodes per
viewport, Sanitary seven, product one. They are disclosed in the raw report;
changing approved storefront colors needs an owner design decision. No remaining
semantic rule violation is accepted by the suite.

Desktop/mobile homepage and Sanitary screenshots retain exactly the Phase 6
dimensions. Three images match every raw pixel; Sanitary desktop differs in one
pixel by a single 1/255 channel level (0.000046% of pixels), with no visible
layout/color/artwork difference. PNG→WebP source RGBA equality is exact for all
three assets. Screenshot products/prices are explicitly synthetic local fixtures,
not actual inventory. See [visual comparison](evidence/visual-comparison.json).
