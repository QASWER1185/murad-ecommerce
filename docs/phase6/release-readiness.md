# Authorized staging, scheduler, backup and incident plan

This is a reviewable plan, not authorization to connect to staging/production, provision identities, run live migrations or deploy. Production order submission/analytics/media/indexing remain disabled.

## Real Supabase staging checklist

Obtain separate owner authorization and an isolated project/dataset first. Use synthetic catalog/contact fixtures, a trusted operator and private environment variables; never import customer/production data merely to test.

- **Schema compatibility:** rehearse all stacked migrations in order against both latest-main and PR #2 optional-column shapes. Confirm cutover guard failure without acknowledgement, transactional recovery, unchanged IDs/sample Drafts and updated public-view adapters before opening reads. Snapshot schema/data counts before and after.
- **Auth/JWT:** verify real token signature/issuer/audience, refresh rotation, logout/revocation, cookie flags/path, expiry/service outage handling and login throttling. Confirm forged user metadata, ordinary users and Editors cannot read/mutate customer requests. Verify no admin-registration/self-role path. Initial trusted Admin provisioning needs its separately authorized operator process.
- **PostgREST/RLS:** test every table, RPC and private schema with anon, ordinary, Editor and Admin tokens. Unsigned/expired/mismatched gateway envelopes must fail. An Admin cannot read/change gateway keys or bypass request status/history/version rules through raw table operations.
- **Storage/media:** exercise actual private-bucket upload/download, MIME/dimension/size enforcement, immutable originals, derivatives, shared-asset semantics, public withdrawal and image-optimizer rejection through real gateway/CDN/hosting layers. Draft/private originals must never escape.
- **Orders/quotations:** test server price snapshots, optional/mixed/quotation prices, current publication/stock checks, full rollback on invalid selection, receipt-only recovery, same/different guest and idempotency keys, lost HTTP responses, duplicate clicks and real overlapping transactions for catalog/status races. Confirm no payment, reservation, accepted/completed purchase or invented delivery/tax is recorded.
- **Host/request limits:** verify TLS/origin/body/cookie/header limits and function timeouts for cart/order/import/media routes. Validate the trusted client-IP header contract before using it; choose edge/WAF anti-abuse controls and test session/contact/global limits under distributed traffic. Do not treat the local honeypot as complete bot prevention.
- **Monitoring/privacy:** inspect hosting, PostgREST, Auth, DB statement and log-drain settings for bodies/parameters. Use synthetic phone/name sentinels to prove they do not enter public logs or analytics. Alert on error/429 rates, failed status updates, abnormal request volume, oldest pending invalidation age and backup failures. Integrate a reviewed sink; none is silently provisioned by this PR.
- **Analytics:** use an owner's actual staging stream after the manual-only review. Inspect real outgoing payloads and DebugView; no contact fields, refs, raw search, admin paths or purchase events. Test denied consent, revocation, DNT/GPC, script blockers and provider outages. Local GA4 queue/stub tests do not establish Google delivery.
- **SEO/mobile:** run canonical/metadata/breadcrumb/structured-data checks, real 404/308 tests, filter/search noindex, empty dev sitemap, robots, withdrawal and broken-link checks. Test representative mobile devices, keyboard focus, dialog scrolling, gallery/image dimensions, LCP/INP/CLS and Lighthouse/PageSpeed under realistic network conditions. No lab score or field CWV is claimed without that evidence.
- **Load/concurrency:** test thousands of reviewed product rows, realistic category/brand facets, simultaneous request/price/withdrawal/status mutations, imports plus browsing and allocator/database pool limits. Check lock waits, deadlocks, p95 latency, retry behavior, rate isolation and capacity. Local real-transaction race tests are not a production capacity guarantee.
- **Admin MFA/recovery:** require a reviewed MFA/session/recovery process, least-privilege provider/operator access, secure secret storage/rotation and recovery drills. Do not solve worker access by sharing a permanent human browser session.

## Invalidation scheduler recommendation

Current code: durable claim/ack leases, `SKIP LOCKED`, at-most-50 batches, two-minute lease, retained failures, backoff, and immediate publication checks on no-store public reads. The Admin workspace can drain pending work; a short diagnostic cookie utility exists for local/explicit staging use and now rejects unspecified remote environments. No production scheduler or worker identity was created.

Recommended production design for a separately reviewed Phase 7:

1. Use a managed scheduler (hosting cron or Supabase cron invoking a dedicated worker), waking roughly once per minute as an initial operational setting for review.
2. Authenticate server-to-server with workload identity/OIDC (verified issuer, audience, expiry) or a dedicated rotated machine secret in the provider's vault. Never embed a human Admin browser-session cookie in cron, repository, workflow output or permanent environment credentials.
3. Add a separately reviewed narrow worker authorization boundary that can **only** claim/ack invalidation events and invalidate approved caches. The existing RPCs are Admin-only; do not grant the scheduler broad Admin product/customer/key privileges just to reuse them. Do not expose a public unauthenticated revalidation endpoint.
4. Run bounded batches within the lease/time budget, invalidate before ack, recover expired leases and monitor attempts/last error/oldest pending age. Retry duplicate invalidation safely after crashes. Simulate concurrent workers and hosting/CDN failure before enabling the schedule.
5. Preserve no-store/public-view admission as the withdrawal safety boundary; scheduler availability must not be the only privacy barrier. Confirm any future shared HTML/CDN cache separately before changing this design.

No identity, vault entry, cron deployment or authorization expansion is included in Phase 6.

## Backup and restore rehearsal

- Inventory catalog/media/import history and new private order/item/event/key/rate data. Database backups may omit Storage binaries; back up and rehearse both through approved provider procedures.
- Approve encrypted backup access, retention, operator roles and owner-defined recovery objectives before production. Signing keys require secret-manager recovery/rotation planning, not copying them into repository examples or screenshots.
- Restore into a new isolated authorized environment, keep public integration/indexing/analytics off, rotate restored active secrets and disable old gateway keys before accepting requests. Verify FK integrity, RLS, original/derived media, revision history, order snapshots and historical status events.
- Rehearse recovery of a lost response/idempotent retry. Do not replay old acknowledgements as fresh orders or purchases. Keep rate windows and audit timelines interpretable; cleanup needs a separate reviewed retention policy.
- Record the actual restore duration/data-loss window and owner acceptance. No restore SLA is invented here.

## Incident procedure

1. Contain request writes by disabling the affected private gateway key and order feature flag. For an auth/data incident, restrict the affected operator/provider credentials and sessions through authorized procedures. Keep the catalog/WhatsApp fallback available only if its integrity is established.
2. Preserve restricted audit/history/backup evidence. Share only redacted operational codes/route templates; do not paste customer bodies, cookie values, database URLs or secrets into tickets or public logs.
3. Check public/RLS/media/cache boundaries, unauthorized roles, request duplicates and affected identities. A flag or logout does not erase previously downloaded content or replace provider-token revocation.
4. Apply an additive reviewed fix, rotate compromised keys, rehearse in authorized staging and reconcile request references/snapshots with the owner. Avoid deleting customer history, silently republishing samples or reopening raw table access.
5. Obtain separate release approval before restoring production writes, analytics, media or indexing. Document findings, customer-data handling and follow-up access/retention actions through the owner's approved process.
