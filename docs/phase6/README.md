# Phase 6 — order requests, analytics and release preparation

Branch `development/orders-analytics`, based on Phase 5 `7ae9d7985340ec3b6ac5e9b2dbd3e22dc7b72814`. Draft PR targets `development/storefront-integration`. Stop after Phase 6.

No production/staging Supabase connection, production migration, account provisioning, Google property, merge, deployment or indexing enablement was performed. All request/contact records in the evidence are synthetic isolated fixtures. Existing catalog samples remain private and unverified.

## Implemented

- Guest order/quotation persistence reuses the Phase 5 shared cart and wishlist. No second cart is created. Existing WhatsApp enquiry still works; optional persistence appears inside the cart or enhanced quotation dialog only when explicitly configured. Page/nav/hero/card designs remain in place.
- Server validation, signed guest sessions, strict Origin/CSRF checks, honeypot and elapsed-form challenge, bounded selection/body sizes and durable session/contact/global rate limits. No client price, subtotal, tax, shipping charge or payment method is accepted.
- A server-signed database gateway uses the anonymous SDK with a separate private key. Direct anonymous calls without a valid proof cannot create records; browsers never receive the signing key. No service-role client or privileged browser Storage credential is added.
- PostgreSQL locks current product, category/ancestor and brand dependencies, checks public visibility/availability and preview tokens, and atomically records immutable versioned product/price/quantity snapshots. Stale, withdrawn or explicitly out-of-stock selections are rejected. Idempotency uses a globally unique intent UUID with guest-bound receipt access; concurrent retries produce one reference/record/history entry.
- Optional/unpriced/daily-rate items become quotations with null unit/line prices. Mixed selections retain only known per-currency product subtotals, explicitly excluding quotation items and uncalculated charges. A request is not payment, reservation, acceptance or a completed sale.
- Customer acknowledgements expose only reference, original receipt time, kind and receipt confirmation. Lost responses can recover that acknowledgement using the same signed guest session and intent key. No public order-detail/list or customer-contact API exists.
- Admin-only request list, private POST search, status/kind filters, pagination, detail snapshots, customer contact, append-only activity history, version-checked confirmed status updates and basic actual request counts. Editors retain catalog read-only access but cannot read customer request data. Terminal requests cannot be reopened through the UI/RPC.
- Request states: `received`, `in_review`, `awaiting_customer`, `quoted`, `closed`, `cancelled`. Closing a request does not create a sale. There is no accepted/paid/completed sales-order state in this phase.
- Environment-configured, explicit opt-in GA4 preparation with a separate privacy page. No script before consent; browser GPC/DNT and withdrawal are honored. Only whitelisted events/parameters are emitted, with generic page locations/titles and no customer fields, reference numbers, raw search text or purchase event. Production analytics remain disabled; no real GA4 property or delivery was tested.
- Safe operational logging/instrumentation excludes bodies, headers, raw error messages/stacks, contact details, request IDs and query strings. Added owner Google/analytics setup, staging, backup/recovery, incident and scheduler review documents.

## Database migration inventory

Only **`20261108000800_order_requests.sql`** is added. It is additive, transactional and guarded by the existing cutover acknowledgement. It creates request/items/history tables, private signing-key/rate-limit tables, indexes, admin-only RLS and narrowly scoped signed/read/admin RPCs. Earlier migrations and production IDs/data are unchanged. The signing-key table starts empty; no account or real secret is provisioned by the migration.

See [security and data impact](security-and-data.md) for authorization, idempotency, snapshot, key-rotation and recovery contracts.

## Screenshots and design protection

| View | Desktop | Mobile |
| --- | --- | --- |
| Homepage | [Capture](screenshots/home-desktop.png) | [Capture](screenshots/home-mobile.png) |
| Sanitary | [Capture](screenshots/sanitary-desktop.png) | [Capture](screenshots/sanitary-mobile.png) |
| Cart request review | [Capture](screenshots/cart-request-desktop.png) | [Review](screenshots/cart-request-mobile.png) / [Submission controls](screenshots/cart-request-mobile-submit.png) |
| Admin request list | [Capture](screenshots/admin-requests-desktop.png) | [Capture](screenshots/admin-requests-mobile.png) |
| Admin request detail | [Capture](screenshots/admin-request-desktop.png) | [Capture](screenshots/admin-request-mobile.png) |
| Quotation / receipt | [Quotation](screenshots/quotation-request-desktop.png) | [Receipt](screenshots/request-receipt-desktop.png) (desktop) |

Storefront viewports: 1200 × 900 / 390 × 844; Admin: 1440 × 1000 / 390 × 844. Dialogs scroll inside the viewport; the two mobile request frames show both the review and reachable submit controls. These are real Next.js components with synthetic data, not screenshot-background implementations.

Approved images, Sanitary CSS and existing storefront CSS are not replaced. New styles are scoped to new request controls. [Comparison evidence](comparison.json) records before/after page dimensions and pixel checks. User-visible additions are request controls inside existing dialogs, a privacy-choice page and Admin request navigation/screens.

## Validation

Local tests use actual PostgreSQL/RLS and Next.js, SDK calls and Playwright, with loopback Auth/PostgREST/Storage contracts. They do not certify real Supabase JWT/Storage/CDN infrastructure. GA4 script requests are fulfilled by a local browser transport stub; no real Google property is created or contacted by the validation suite.

| Check | Result |
| --- | --- |
| Phase 6 validation/session/challenge/config/analytics/redaction units | 8 passed |
| Phase 6 SQL signatures/RLS/snapshots/idempotency/rates/quotations/concurrency/audit | 62 assertions passed |
| Phase 6 browser functional/security/analytics/mobile/SEO groups | 15 passed |
| Application log redaction | No synthetic customer sentinel appeared |
| Phase 5 regression | 49 DB + 17 browser + 6 unit passed |
| Phase 4 regression | 56 DB + 14 browser + 7 unit passed |
| Phase 3 regression | 27 DB + 15 browser + 4 unit passed |
| Phase 2 regression | 6 policy units + 67 / 67 database compatibility assertions passed |
| Optimized build / TypeScript | Passed with local overrides and integrations disabled at build |
| Production dependency audit | Zero known vulnerabilities at validation time |
| Lint | No errors; 8 pre-existing warnings in unchanged legacy prototype files |

Thirteen screenshot frames include the mobile review and submission controls. The SQL suite uses truly overlapping PostgreSQL transactions for duplicate submission, stale status races and withdrawal while an order is waiting on a catalog lock. The browser suite covers signed guest cookies, Origin/CSRF/honeypot rejection, price tampering, recovery, private data boundaries, normal and quotation submissions, customer search without URL leakage, admin history/version checks, rate limits, consent/event accuracy, no purchase events, noindex/canonical/robots, and mobile scrolling/overflow.

```bash
npm ci
npm run test:phase6:unit
npm run test:phase2
npm run test:phase3:unit
npm run test:phase4:unit
npm run test:phase5:unit
npm run lint
CATALOG_ENABLED=false ADMIN_ENABLED=false NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321 NEXT_PUBLIC_SUPABASE_ANON_KEY=phase6-local-test npm run build
npm run test:phase6:e2e
npm run test:phase5:e2e
npm run test:phase4:e2e
npm run test:phase3:e2e
```

Run app browser suites sequentially; all use loopback 3100, and Phase 5 also uses 3102. Fixtures use the existing pinned PostgreSQL image on an explicit local Docker socket with networking disabled and no database host ports. Historical Phase 3–5 screenshots are preserved; regression captures go to ignored work directories.

## Remaining blockers and Phase 7

- Separate owner approval for real Supabase staging, Auth/JWT/PostgREST/Storage/CDN verification, load/concurrency and backup/restore rehearsal. No production-readiness certification follows from local fixtures alone.
- Trusted gateway key provisioning/rotation, deployment-level spam protection and verified client-IP forwarding, admin MFA/recovery, encrypted backups, PII retention/access policy and operational monitoring still require authorized setup.
- A managed invalidation scheduler needs a reviewed machine identity with narrow claim/ack permissions. The Phase 5 browser-cookie utility is restricted to short-lived local/authorized staging diagnostics; it is not a permanent production credential solution.
- Owner GA4/GSC configuration, enhanced-measurement/privacy review and real delivery validation remain pending. Production order submission, analytics, media and indexing gates remain disabled.
- No payments, stock reservation, delivery/tax calculation, confirmed sales orders or real inventory loading were implemented. Original catalog facts/images must come through the existing reviewed Admin workflow.

Recommended Phase 7: authorized staging rehearsal, operational identities and monitoring, owner Google setup, retention/backup procedures, performance/load validation and a coordinated release review of the stacked PRs. Define any future actual order acceptance/payment/fulfilment requirements separately before implementing them.

See [owner Google checklist](google-and-analytics.md), [staging/release/incident checklist](release-readiness.md), [security/data contracts](security-and-data.md) and [full file inventory](files.md).
