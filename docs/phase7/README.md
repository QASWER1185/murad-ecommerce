# Phase 7 — staging readiness, hardening and SEO QA

Branch: `development/staging-readiness`, based on Phase 6
`9df548718d4beac223b052290f70e91dc7c59039`. Draft targets
`development/orders-analytics`. Review date: 8 November 2026, Asia/Karachi.

This is an isolated development deliverable. **No PR was merged, no hosted staging
or production service was accessed/changed, no account/key was provisioned, and
nothing was deployed or submitted to Google. Production gates remain closed.**

## Completed

- Database-backed optional AAL2 enforcement across existing authoring RLS/RPCs,
  private Storage and previews; server-side verified-TOTP challenge flow, shared
  throttling, Origin/CSRF/role checks and early protected-page HTTP admission.
  No public registration, enrollment, role assignment or recovery bypass.
- Dedicated signed machine invalidation gateway/CLI: narrow claim/ack/aggregate
  health capability, domain-bound HMAC, freshness/nonce replay defense, private
  empty keyring, 2-minute leases, bounded batches, concurrent workers, retry/
  crash recovery and redacted alert hooks. Disabled staging cron template uses
  no human browser session or service-role browser credential.
- Private audit records for operator MFA/key changes without signing material;
  reproducible local migration/security and database + binary recovery rehearsal;
  isolated configuration preflight, operational/recovery and credential plans.
- Reviewed all stacked Draft PRs/dependencies and the coordinated cutover path.
  Two guarded migrations only; no historical migration or existing inventory ID
  changed. Samples stay unverified Drafts.
- SEO/publication audit and stronger shared Product/Offer helper, truthful missing-
  price behavior, filter-context consistency and Merchant readiness gap checks.
  Canonical/SSR/H1/breadcrumb/noindex/robots/sitemap/404/308 protections retained.
- Fixed measured 2,000-product pathological catalog plans using RPC-scoped planner
  settings without changing public projections or weakening security. Added
  bounded pagination/query probes, actual mobile timing and parser/image RSS tests.
- Three lossless hero WebP companions and priority preloads: identical source
  pixels, 24–28% fewer asset bytes. Approved page geometry/artwork is preserved.
  Contact links use verified settings; main header WhatsApp routes to the supplied
  main contact. Accessible names/dialog labels, keyboard focus and Admin text
  contrast improved; remaining approved storefront contrast findings are disclosed.

## Verification

| Phase | Unit/policy tests | Real local PostgreSQL checks | Actual-app browser groups |
| --- | ---: | --- | ---: |
| 2 | 6 | 67 legacy + 67 PR #2 column-compatibility assertions | — |
| 3 | 4 | 27 foundation assertions (also rerun by later fixtures) | 15 |
| 4 | 7 | 56 media/import/workflow assertions | 14 |
| 5 | 6 | 49 public catalog/media/lease assertions | 17 |
| 6 | 8 | 62 privacy/order/idempotency/concurrency assertions | 15 |
| 7 | 7 | 51 MFA/worker/plan/audit assertions + recovery rehearsal | 10 |

Build and TypeScript pass. Lint: zero errors, eight pre-existing unused-variable
warnings. Full and production dependency audits: zero known vulnerabilities at
check time; the development minimatch advisory is fixed with a scoped override,
without downgrading Next.js. No private worker/order/Admin environment names were
found in emitted static client chunks. Full run results/logs and raw measured
reports are in [evidence](evidence/).

The final regression fixed a test synchronization race: the manual-price scenario
now waits for persisted Draft navigation before requesting review, instead of
mistaking the typed input value for a completed save. Optimistic version checks
remain enforced; no workflow rule was bypassed to make the test pass.

Local Auth/PostgREST/Storage HTTP contracts and synthetic users/media are simulated;
PostgreSQL/RLS/transactions, Next.js, Supabase SDK client, Sharp, spreadsheet parser
and Chromium are real. Google transport is stubbed. **Real GoTrue/JWT/Storage/CDN,
provider MFA/revocation, remote backups/alerts and Google delivery are not certified.**
See the [unexecuted real-service acceptance matrix](staging-runbook.md).

## Measurements and remaining findings

- Current cold slow-mobile median LCP: home **3.684 s**, Sanitary **3.360 s**,
  brand **1.584 s**, product **1.152 s**. Home/Sanitary still need improvement
  before launch. EventTiming samples are not field INP; no Lighthouse score exists.
- 2,000 synthetic reviewed products: six bounded catalog/detail scenarios and
  18 SQL timing samples; final execution range **393–1,088 ms**, at most 12 cards
  (four related items). Baseline retrieval was cancelled at 20.622 seconds.
- 10,000×40 XLSX sample: **384.7 MiB** process peak RSS; two concurrent 24 MP
  high-entropy JPEG processors: **117.7 MiB**, third rejected. These direct-process
  probes exclude full HTTP/app overhead and do not certify hosting limits.
- Axe scans: no detected violations on MFA, both Admin overview viewports and
  scanned brand page; remaining public findings are approved storefront color
  contrast only. No semantic violation is accepted. Not full WCAG certification.
- Local DB restore verified product/order checksums, raw anonymous denial and
  28 separate fixture binaries byte for byte. This is not an operational backup
  or recovery SLA. No original manufacturer inventory is present in screenshots.

Full detail: [performance/accessibility](performance-and-accessibility.md),
[SEO/Google audit](seo-and-google.md), [security/operations](security-and-operations.md),
[migration/data-impact/release review](migrations-and-release.md),
[staging setup](staging-runbook.md), [full file inventory](files.md).

## Screenshots

All are new captures of isolated synthetic fixtures, not commercial inventory or
real administrator accounts. Homepage/Sanitary dimensions match Phase 6 exactly.
Three captures match every raw pixel; Sanitary desktop has one pixel differing by
one channel level (1/255), with no visible difference. Original PNGs are unchanged.

| View | Desktop | Mobile |
| --- | --- | --- |
| Homepage | [1200 px](screenshots/home-desktop.png) | [390 px](screenshots/home-mobile.png) |
| Sanitary | [1200 px](screenshots/sanitary-desktop.png) | [390 px](screenshots/sanitary-mobile.png) |
| Product template | [Desktop](screenshots/product-desktop.png) | [Mobile](screenshots/product-mobile.png) |
| MFA challenge | [Desktop](screenshots/admin-mfa-desktop.png) | [Mobile](screenshots/admin-mfa-mobile.png) |
| Admin overview | [Desktop](screenshots/admin-overview-desktop.png) | [Mobile](screenshots/admin-overview-mobile.png) |

## Next step

**Stop after Phase 7.** Recommended Phase 8 is separately authorized real staging
validation, recovery/load tests and owner configuration review. The exact approvals,
access and production blockers are listed in [Phase 8 approvals](phase8-approvals.md).
No main merge, production migration, deployment or indexing activation is approved
by this report.
