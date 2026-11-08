# Security results

**PASS in stated local scopes; hosted acceptance remains BLOCKED.** No production
or Muraderp ai identity, DB, Auth, Storage, credentials, hosting, DNS or billing
operation occurred. No external message or customer notification was sent.

| Control | Evidence / scope |
| --- | --- |
| Roles / no self-assignment | Real SQL + simulated broad browser suites; additional real GoTrue/PostgREST role checks, ordinary metadata cannot grant admin |
| Admin login / cookies | Real Next SSR with real GoTrue; HttpOnly, Strict, `/admin` cookie scope; existing expiry cap/CSRF/origin suites pass |
| JWT / sessions | Real getUser, refresh, invalid-token and correctly signed expired-token rejection; local logout clears SDK session |
| MFA | Real local TOTP enrollment/challenge and AAL2 RPC access; AAL1 denied after policy enabled; existing app MFA browser contracts also pass |
| RLS/workflow/private schema | Fresh/legacy/optional-column SQL suites; public views only, Draft/private keyrings protected, Editor read-only, explicit versioned review |
| Media/import security | Actual Sharp/CSV/XLSX/ZIP/XML validation and SQL/RLS; Storage HTTP/binaries are simulated in broad suites, no real CDN claim |
| Orders/worker | Signatures, domain separation, expiry/nonces/replay, narrow capabilities, concurrency/idempotency/leases and rate/origin/privacy contracts pass locally |
| Client-secret boundary | 22 public browser chunks audited; no private Admin/worker/order environment-name dependency; privileged local keys never supplied to Next public env; actual public strings also scanned for service-role JWTs and secret-key markers, zero findings |
| Dependencies | Full and production npm audits: zero known vulnerabilities; lint zero errors/eight existing legacy warnings |
| New local isolation | Two guard tests deny unrelated/privileged/host-network containers and force published ports to loopback; lean services publish no container port |

**Not certified:** real hosted MFA recovery, password/email delivery, refresh/revoke
policy under provider configuration, JWT revocation windows, Storage signed URLs/
CDN/browser withdrawal, infrastructure throttles, operator custody/rotation and
scheduler/monitoring. A local logout or expired-JWT check is not proof that an
already-issued access token is revoked instantly by a hosted provider.

Known authorization/customer-data failures are non-waivable release blockers.
Unknown ERP dependencies are also blockers. No RLS was weakened or anonymous write
privilege broadened to pass tests. Retained storefront contrast findings require
owner design review; automated scans do not certify accessibility.

[Real local results](evidence/real-local-services.json), [SQL recovery/security](evidence/recovery.json),
[bundle audit](evidence/bundle-audit.json), [credential-content audit](evidence/credential-audit.json), [dependencies](evidence/dependency-audit.json).
