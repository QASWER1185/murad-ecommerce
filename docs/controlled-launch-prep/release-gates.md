# Objective release gates

The local code candidate is available for review; **production launch is BLOCKED**.
A local PASS, source mergeability or Option 2 selection is not hosted certification.

| Classification | Gate / current result | Acceptance condition |
| --- | --- | --- |
| Locally validated | PASS: build, TypeScript, lint, audits, 24 existing tasks, 2 new guard groups | Keep final app/dependency/schema changes tied to relevant fresh regressions |
| Locally validated | PASS: real local GoTrue/PostgREST 9 groups | Retain exact reduced-service scope; no real Storage/hosted inference |
| Locally validated | PASS: fresh/legacy/optional-column migrations, RLS, sample preservation | Final migration hashes and compatibility evidence match reviewed candidate |
| Locally validated | PASS: approved captures/assets | No unauthorized artwork, geometry, typography or color change |
| Not validated against hosted services | BLOCKED: actual provider Auth/recovery/revocation/Storage/CDN/transport | Verify in a separately approved protected acceptance scope before relevant live feature is opened |
| Not validated against hosted services | BLOCKED: full official local stack/Storage HTTP | More capable isolated local environment needed for real Storage tests, or separately approved hosted acceptance; retain explicit limitation |
| Requires owner approval | NOT RUN: production discovery/backups/merges/maintenance/migrations/deployment/flags | Exact target/action/operator/window and acceptance/abort plan approved individually |
| Critical blocker | Unknown Muraderp ai identities/shared dependencies | Owner-verified isolation; no mutation of shared ERP resources |
| Critical blocker | Unknown actual production schema/history/recovery | Separately authorized inspection, drift review, verified DB+binary restore and compatible cutover |
| Critical blocker | Production code gates intentionally closed | Separately reviewed Admin production mode and feature-gate changes; no env-only workaround |
| Critical blocker | Maintenance/admission transition not operationally verified | E-commerce-only fail-closed traffic/API plan across aliases; no incompatible legacy raw-table app during restriction |
| Critical blocker for affected feature | Unverified private-data/authorization/withdrawal/customer-request behavior | Real permission/privacy checks pass before opening that feature; no waiver for known failures |
| Target unmet | FAIL: home/Sanitary lab LCP >2.5 s; contrast findings | Evidence-backed performance work and approved design fixes/recheck; owner explicitly assesses scope/residual effect |
| Capacity unresolved | BLOCKED: 380.6 MiB parser peak excludes request overhead | Verify selected-host memory/time/body headroom or implement/review bounded processing alternative |
| Content prerequisite | NOT RUN: original product images/models/specifications/verified data | Trusted review, no automatic sample publication, truthful SEO eligibility |
| Acceptable later improvement if core gates pass | Unrouted legacy source cleanup / non-sensitive tooling convenience | Separate scoped follow-up; must not include access/privacy/data-integrity failures |

Any residual risk accepted for a proposed release must be named with evidence,
affected feature, mitigation, owner and deadline. Authorization/customer privacy
failures, unknown ERP dependencies or absent recoverability are not cosmetic
post-launch improvements and cannot be waived for speed.

## Future visual Preview strategy — planning only

No preview deployed this phase. A future preview needs exact separate Vercel
project/team/HTTPS target, team grant, zero-additional-cost verification, deployment
protection and owner approval. Use a build of the reviewed development branch,
never old main. Disable Admin/catalog/media/orders/worker/analytics/indexing and
omit all production Supabase credentials. Optionally use reviewed build-only
synthetic fixtures that cannot become real inventory and remain protected/noindex.

A visual-only Preview can check layout/navigation/static assets; it cannot prove
Auth, RLS, Storage, imports, orders, invalidation or hosted DB integration. Never
connect it to production or expose local Supabase by a public tunnel. Existing
production Vercel settings/domains stay untouched.
