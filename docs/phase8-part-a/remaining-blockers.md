# Remaining blockers and owner decisions

Part A is a local validation/preparation boundary, not production readiness or
permission to proceed to Part B. No real staging, hosting or Google service was
accessed or configured.

| Blocker | Evidence / required next decision |
| --- | --- |
| Real Auth/RLS/Storage/CDN acceptance | Local HTTP contracts are simulated; approve isolated Part B access and execute the full provider matrix |
| Operational MFA/recovery/session policy | Database policy defaults off; real TOTP enrollment/recovery, session expiry/revocation and Storage AAL propagation unverified |
| Machine identity/scheduler/monitoring | Private non-test keyrings unprovisioned; no real scheduler, sink or alert destination installed; validate rotation, failure/lease recovery and missed-run alerts |
| Hosted transport/memory/capacity | No hosting configuration inspected. Local parser/image measurements exclude full HTTP/app overhead; application size/duration settings are not provider limits |
| Mobile LCP | Local before/after values are in the performance report. No field INP, Lighthouse score, CrUX or real mobile/hosting capacity claim; further tuning may be needed |
| Approved storefront contrast | Small Deals badge and placeholder text still have contrast findings. No palette change was made without design approval; automated scans are not WCAG certification |
| Original product content | Photos, genuine model/specifications/descriptions, real optional prices and verified stock will be supplied later through Admin. No sample is auto-promoted |
| Google/content release | Real domain/property/policy review, eligible content, image-indexing headers and explicit indexing-release gate change required; sitemap currently empty intentionally |
| Future contact changes | Current owner-provided NAP matches. Some approved reference copy remains fixed; recheck visible copy/links/schema together if business details change |
| Stacked integration | PRs remain Draft/unmerged; #2 has seven file conflicts and stale semantic architecture. Owner chooses the reviewed integration/retirement path |
| Coordinated cutover/recovery | Do not apply restrictive catalog migrations below legacy main code. Approve a compatible app/DB release and independently verified DB + binary backup/restore plan |
| Privacy/commercial policy | Retention/log/backup expiry, shipping/returns/tax and Merchant eligibility remain owner decisions. Order requests are not payments, reservations or completed purchases |

No current local code defect listed as remediated is being deferred silently.
Unverified provider behavior and owner-controlled activation/policy decisions remain
explicitly outside Part A. No destructive migration, credential, account, external
configuration or production data change was used to make tests pass.

Recommended next step: owner reviews the Part A Draft PR and reports, then
separately authorizes the exact Part B project/host/access/test scope in
[staging-prerequisites.md](staging-prerequisites.md). Do not request secrets in
chat. Stop after Part A until that explicit authorization arrives.
