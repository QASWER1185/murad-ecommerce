# Performance and accessibility recheck

Fresh Part A before/after samples use Node v24.22.1, Chromium 156.0.8078.79,
390×844 viewport, 4× CPU throttle, 150 ms latency, 200,000 bytes/s download and
cold browser cache. Three runs per route; 12 before and 12 after. Database/HTTP
contracts and product rasters are synthetic; these are not hosted/real-device
results, Lighthouse scores, field INP, CrUX percentiles or a capacity guarantee.

To repeat the before sample, use a separate detached local worktree at Phase 7
`c8f9f701c783a4a7f86b4587f641ba7d964414aa`, install the locked dependencies,
build with the loopback/disabled-feature overrides in test-results.md, then run
`npm run test:phase7:e2e` and `node scripts/phase7/capacity.mjs`. Keep its ignored
reports as the before input. Run the current Part A validation sequentially for
the after input; both use port 3100. Never use real service credentials.

## Browser measurements

| Route | Before median LCP | After median LCP | After maximum visit CLS | Largest sampled interaction | After transferred JS |
| --- | ---: | ---: | ---: | ---: | ---: |
| `/` | 3.692 s | 3.636 s | 0.000006 | 32 ms | 152.8 KiB |
| `/category/sanitary` | 3.372 s | 3.268 s | 0.000083 | 24 ms | 144.0 KiB |
| `/brand/porta` | 1.536 s | 1.536 s | 0.000083 | 24 ms | 144.0 KiB |
| `/product/[slug]` | 1.112 s | 1.100 s | 0.000184 | 16 ms | 144.0 KiB |

Observed homepage median changed 3.692→3.636 s and Sanitary 3.372→3.268 s.
These small changes may include noise; no statistically established LCP speedup
is claimed. Both remain above the 2.5 s good threshold in this slow-mobile lab.
EventTiming samples are not field INP and cannot establish real user responsiveness.
JS transfer includes HTTP overhead; no new browser library was added.

The concrete optimization is four lossless companions for existing pipe/building
banners, footer decoration and Sanitary promotion artwork: **408,167→303,572 bytes**,
25.6% smaller (102.1 KiB saved). The existing generator
was reused with an explicit Part A mode and separate evidence destination. It
checks exact raw RGBA equality before writing; PNG originals, dimensions, colors,
layout and typography are untouched. Background image-set retains PNG fallback.

## Large catalog and pagination

The existing six-scenario capacity probe creates 2,000 clearly named synthetic
products through real review RPCs in a disposable PostgreSQL fixture; it does not
promote any original sample. Three EXPLAIN ANALYZE/BUFFERS samples per scenario
with an 8 s per-statement test bound; page cards remain at most 12, related items 4.
No query/RLS/migration was changed in Part A and no DB speedup is claimed. Phase 7's
[historical plan analysis](../phase7/performance-and-accessibility.md) remains the
context, not a matched fresh before-sample for this SQL recheck.

| Scenario | Median SQL execution | Observed range | Returned products |
| --- | ---: | ---: | ---: |
| category-first | 702.6 ms | 700.7–709.5 ms | 12 |
| category-page-100 | 498.7 ms | 492.0–503.9 ms | 12 |
| search | 398.4 ms | 392.9–409.5 ms | 1 |
| brand | 581.9 ms | 580.4–588.1 ms | 12 |
| price-sort | 656.0 ms | 648.8–657.8 ms | 12 |
| product-related | 601.1 ms | 600.7–611.3 ms | 4 |

These SQL timings exclude HTTP/process/Docker overhead and do not prove linear
scalability or production concurrency. Real category depth, photos, distribution,
DB plan estimates, queue backlog and shopper/import concurrency require Part B.
The scheduler's bounded batch/cadence may need tuning for large import activity;
public withdrawal currently uses fresh no-store views and does not wait for it.

## XLSX / image resource measurements

Each direct-probe child is a fresh Node process; fixture generation happens
outside it. Process-lifetime maxRSS includes parser libraries but excludes the
Next app, multipart/Auth/Storage transport and hosting gateway. One sample per
probe per side is insufficient to infer an algorithmic speedup. The full ExcelJS
decoder is intentionally retained; replacing it would need compatibility/resource
review and was not necessary to fix unheaded-cell validation.

| Probe | Before elapsed / peak RSS | After elapsed / peak RSS |
| --- | ---: | ---: |
| 10,000×40 XLSX | 2.015 s / 377.0 MiB | 1.125 s / 387.5 MiB |
| Two concurrent high-entropy 24 MP JPEG processors | 0.360 s / 123.0 MiB | 0.392 s / 121.3 MiB |

XLSX input is ~0.94 MiB compressed with repeated cell values; other permitted
8 MiB/32 MiB-expanded workbooks may cost more. JPEG input is 7.42 MiB at
6000×4000; two processors run, a third is rejected. No memory reduction is claimed:
the parser still peaks around 377–388 MiB. Per-process limits multiply across
instances and leave unverified headroom for the full application. Actual request
limits, RSS, duration and combined concurrency are release blockers, not certified
by the local 12 MiB Next proxy setting.

## Accessibility / visual result

Existing keyboard/modal/Escape/focus-return and no-overflow checks pass. Ten Axe
desktop/mobile scans ran; no semantic violation is accepted. Admin MFA and both
Admin overview samples have zero detected violations. Remaining public findings
are the existing approved Deals/placeholder-text color contrast; source colors
were not altered. Counts/targets are in evidence/accessibility.json. Automated
samples are not complete WCAG/real-assistive-technology certification.

Four new desktop/mobile captures are compared to fresh pre-change captures and
the existing Phase 6 baseline. Dimensions match. Three match every raw pixel;
Sanitary desktop differs in one pixel by one 1/255 channel level, with no
visible difference. Exact and thresholded raw pixel
counts are recorded in evidence/visual-comparison.json; every source companion
has exact RGBA equality. Visual evidence uses synthetic local products, not actual
manufacturer inventory. See screenshots linked from README.
