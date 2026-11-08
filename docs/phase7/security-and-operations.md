# Security and operations boundaries

## Admin access

Request-scoped SSR validates `getUser()` and then the database's own role/AAL
projection for each operation. No browser/user metadata can assign roles. The new
operator-owned singleton MFA policy defaults **off** to preserve existing access;
this compatibility default is a **release blocker**, not production MFA readiness.
When enabled, `is_staff`/`is_admin` require the gateway-validated JWT `aal2`, covering
existing RLS, authoring RPCs, private Storage and previews. Login redirects trusted
AAL1 accounts to `/admin/mfa`; only existing verified TOTP factors are listed.
Challenge/verify requires correct Origin, CSRF, bounded unique form fields,
revalidated role, per-account database rate limiting and server-side provider
verification. It cannot enroll a user, reset a factor, create an account or assign
a role. Failure stays locked; operational logs use fixed codes, not codes/tokens.

Cookies remain HttpOnly, Strict, scoped `/admin`, Secure on HTTPS and capped at
8 hours per write. Auth is revalidated for each request; role removal is immediate
on the next access. Cookie age is **not an absolute refresh-chain lifetime**.
Provider JWT expiry, inactivity/max session lifetime, refresh reuse protection,
MFA enrollment and recovery require authorized real-service verification. Provider
logout revokes refresh access; already issued JWTs can remain valid until expiry.
For urgent compromise remove the trusted role, revoke provider sessions, rotate
credentials where necessary, and verify direct RLS/Storage access. Never claim
remote access revocation based solely on clearing a browser cookie.

Administrative product/media/import/workflow mutations keep existing immutable
revisions and audit contracts. MFA fixed-code logs complement, and do not replace,
provider Auth audit logs. Operator MFA-policy and worker-key changes also enter
the private audit log; credential audit records contain key ID/active status only,
never signing material. Trusted database operator attribution still requires
provider/operator audit records when no Auth user is attached. They exclude identity details; alert correlation belongs
to a separately approved private provider log sink.

## Dedicated invalidation capability

`POST /api/internal/catalog-invalidations` accepts a fresh HMAC-SHA256 signed,
domain-separated exact-byte envelope, origin/key ID and nonce. It accepts no human
session authorization. Local/staging configuration is separate from Admin and
rejects production. It uses only an anonymous Supabase publishable key plus the
private narrow worker signing secret. Original media and customer/product tables
are outside its authority. No service-role key is involved.

`catalog_worker_gateway` supports only claim (1–25 events), acknowledge a matching
unexpired lease with fixed `ok/retry`, and aggregate queue statistics. Its private
keyring starts empty. Nonces reject committed request replay; stale envelopes
expire after 60 seconds, so nonce cleanup after five minutes is safe. Calls lock
the active key row for the tiny transaction, avoiding heartbeat lock-upgrade
deadlocks and making key revocation transactional. Different key rows can process
concurrently; the queue itself uses `FOR UPDATE SKIP LOCKED`. Leases expire after
2 minutes; retry waits 15 seconds. Ack cannot remove another lease, later event
or concurrent publication. An RPC transaction rolled back before commit leaves
no nonce or lease; a committed claim with a lost response recovers on lease expiry.

The app expires catalog tags immediately and revalidates root layout/sitemap/robots
before ack. Five concurrent ack requests maximum; per-RPC timeout 5s, one batch per
invocation, route budget 60s and CLI timeout 55s. Public catalog requests already
use no-store anonymous snapshots and media checks eligibility around binary fetch;
withdrawal does not depend on a scheduler heartbeat. Previously delivered pixels
or downloaded bytes cannot be revoked. Client focus/BFCache refresh remains.

Existing Admin invalidation UI and cookie-based script remain diagnostics only.
The disabled cron sample runs every minute independently of those sessions.
A scheduled worker's narrow secret can cause queue churn if stolen; rotate/revoke
it and audit backlog. It cannot create inventory or read customer data.

## Monitoring integration points — not installed

Fixed operational codes include worker failure/partial/queue alert and MFA results;
no `Error.message`, stack, raw URL/query, body/header, phone, name, IP, token or key
is logged. Queue response contains counts and age only. The CLI emits whitelisted
counts, never arbitrary server response bodies. Operator must route logs to an
approved sink, define ownership and test notification delivery.

Proposed alerts: worker exit nonzero; no successful scheduler heartbeat >3 minutes;
oldest pending >300s; any event with >=5 attempts; pending >250 for five minutes;
repeated gateway/MFA failures; private media unexpected 2xx; sustained 5xx or
resource pressure. Queue threshold alerts alone cannot detect a completely stopped
scheduler: use an independent missed-run monitor. No alert destination exists yet.

## Backups and recovery

Before cutover, operator must create and independently verify an encrypted database
backup including schema, data, ACLs, roles mapping, revisions, imports, settings,
queue and private orders. Follow Supabase's documented Auth/Storage schema restore
procedure; don't assume a plain SQL dump alone restores hosted GoTrue identities.
Archive **private binary originals and derivatives/import sources separately**, with
object paths, versions, MIME metadata, checksums and access policy. DB Storage rows
contain no binary backup. Never put backups, live keys or customer data in Git.

Proposed policy for owner review: daily encrypted DB plus provider PITR if supported,
daily incremental binaries with version retention, monthly isolated restore and
quarterly Auth/media/orders exercise. Restrict backup roles and encryption keys;
separate recovery access from Admin. Agree actual RPO/RTO only after an authorized
restore is measured and witnessed; Phase 7 local timing is not an operational SLA.

Recovery: freeze mutations/disable order requests and public media as appropriate;
restore to an isolated target; reconcile DB media references and binary checksums;
restore ACL/RLS/operator roles and secrets through approved process; verify anon
Draft/order/original denial and eligible derivative delivery; run worker/pub/order
acceptance matrix; then owner approves traffic cutover. Keep failed source intact.

Credential rotation: add a separately generated new narrow worker/order key, update
secret manager, verify new key in authorized staging, disable old key, wait out
in-flight leases/envelopes, verify old signatures rejected, then remove obsolete
secrets per retention policy. Do not edit historical migrations or expose keyring
contents. Publishable keys still need proper RLS; never substitute service-role keys.

## Data retention proposal — owner/legal approval required

Unsuccessful guest rate buckets: 24h; completed import source/error files: 30 days;
worker nonces: five minutes automatically (no PII); operational aggregate logs:
30 days; customer request/contact snapshots: 180 days after closure, unless a
legal/contractual retention hold applies; security/audit/revision records: 1 year
with least-privilege access. This is a proposal, **not an implemented PII purge**.
No customer deletion or retention jobs run during Phase 7. Provider backup expiry
and erasure procedures must agree with the approved retention/privacy notice.

## Capacity and failure boundaries

Imports: 8 MiB, 10,000 rows, 40 columns, one worksheet; ZIP 32 MiB expanded/16 MiB
per entry/512 entries with XML limits, formula execution prohibited. Import steps
are durable batches, blank-preserving and retry/version safe. Images: 10 MiB,
24 MP, two active decoders per process, immutable original plus 320/640/1280 WebP.
These are application caps, not guarantees of a hosting plan's request/RSS limits.
Parser/image concurrency caps are per-process; multiple serverless instances can
multiply resource use. Authorize a staging load/concurrency and queueing decision
before production. Local capacity report includes full input details and process
RSS; it does not certify maximum concurrent customers or production throughput.

Emergency switches: `ADMIN_ENABLED=false`, `ORDER_REQUESTS_ENABLED=false`,
`ANALYTICS_ENABLED=false`, `CATALOG_WORKER_ENABLED=false`,
`CATALOG_MEDIA_ENABLED=false`; production indexing/media/orders/analytics remain
hard-gated in code. For a private-data incident stop public media/order entry,
revoke affected roles/secrets, preserve redacted evidence, notify the accountable
owner, then validate direct DB/Storage access before reopening. Disable flags on
the actual host only with incident authority; Phase 7 makes no hosted changes.

Rollback is application roll-forward/feature-disable first. Do **not** roll back
to legacy raw-table storefront queries while restrictive migrations remain. Keep
Phase 7 additive tables/functions and data; if MFA causes lockout use the approved
recovery process rather than silently dropping enforcement. Destructive down
migrations are intentionally absent. Restore a verified backup only through a
separately approved isolated recovery/cutover process.
