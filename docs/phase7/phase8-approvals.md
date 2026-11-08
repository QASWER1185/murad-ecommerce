# Exact Phase 8 approvals and access required

Recommended next phase: **authorized isolated staging execution and evidence**, not
production launch. Phase 7 has not created/accessed a real staging project,
provisioned accounts/credentials, configured hosted services, merged a PR,
deployed, submitted a sitemap or enabled production indexing.

| Owner decision / access | Scope needed for Phase 8 | Still prohibited without a separate approval |
| --- | --- | --- |
| Approve staging project + application origin | Identify a separate Supabase project reference, staging HTTPS host and production deny targets; time-bounded least-privilege operator access through a secure channel | Production DB connection, customer-data copying, creating a hosted project or changing services merely because this template exists |
| Approve the complete staging migration rehearsal | Review all 12 files and unknown legacy grants/policies; authorize isolated backups/restore and the guarded migration session | Applying Phase 2 restrictive migrations beneath the legacy storefront, or any production migration |
| Approve trusted synthetic accounts | Separately provision Admin, read-only Editor and ordinary test user; operator-owned role mapping; no app registration endpoint | Real Admin creation/self-assigned roles, production Auth setting changes |
| Approve MFA/recovery configuration | Enroll/verify TOTP, test identity-checked recovery, provider session expiry/revocation and signup/abuse controls; then enable database AAL2 policy | Silent MFA disable for recovery, provider enrollment/settings without authorization, treating cookie deletion as JWT revocation |
| Approve private media and import service testing | Synthetic image/import uploads to isolated private Storage, signed gateway/RLS checks, withdrawal/CDN/original denial, restore and largest permitted workload tests | Uploading into production Storage or publishing actual sample products |
| Approve narrow machine credentials + scheduler | Provision a fresh private worker key and independent order-gateway key, install staging-only schedule, secret-manager access and approved heartbeat/log/alert destination | Service-role browser keys, human-cookie cron, production scheduler, sending test alerts/messages without recipient authorization |
| Approve staging deployment and hosting budget | Explicit staging project/hostname deployment rights, chosen memory/body/duration/concurrency limits and load-test budget; keep all development Git deployments disabled until reviewed | Main merge, production deployment, enabling production Admin/media/orders/analytics/indexing gates |
| Decide contrast corrections | Review the small approved red Deals badge and placeholder-text contrast findings; approve minimal storefront color changes if desired | Quietly changing approved Homepage/Sanitary visuals or claiming full WCAG compliance |
| Confirm content and commercial policies | Genuine manufacturer assets/rights, individual specifications/models, verified optional prices/stock, shipping/returns/retention policy; quotation-only daily-rate materials remain unpriced | Fake inventory/reviews/ratings/offers/GTIN/availability or auto-publication of Draft imports |
| Optional owner Google authorization | Owner's real GA4 stream/Measurement ID and manual-only settings, Search Console/domain DNS access, GBP/merchant ownership; authorize each configuration/test specifically | Inventing Google IDs, configuring properties, sitemap submission or production indexing simply as part of staging approval |
| Approve release candidate after staging evidence | Exact commit set, backups/recovery owner, alerts, privacy checks, real Auth/Storage/CDN results, measured hosting capacity and public content policy | Actual main merge/cutover/deployment or feature/indexing activation without its own explicit release authorization |

Use secure secret delivery outside chat/Git/PRs. Project references and canonical
origin are identifiers, not substitutes for verified console access. No account
access, worker credential, provider verification token, monitoring destination,
real product catalog or real GA4 ID is present in this deliverable.

Production blockers include: real-service acceptance matrix unexecuted; operational
MFA default still off until enrollment is approved; provider recovery/session/abuse
settings unverified; worker/order keyrings unprovisioned; scheduler/alerts/backups
not operational; real hosting memory/load limits unverified; slow-mobile local
homepage/Sanitary LCP still above 2.5 s; disclosed storefront contrast findings;
real inventory/content/commercial policies pending; coordinated compatible
migration/application cutover and separate production release gates unapproved.

The database public-view adapter is implemented on the stack and tested locally;
it is **not deployed to main**. Do not weaken RLS to let the current legacy main
application query raw tables during rollout. Stacked Draft PRs remain separate
review units until the owner approves an integration/release method.
