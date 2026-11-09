# Production-security gap analysis

Observed metadata and source/historical local evidence are separated below. No
attack, Auth login, customer-row read, write probe or commercial-data retrieval.

| Finding | Classification | Evidence / required later gate |
| --- | --- | --- |
| Public raw catalog reads | FAIL for target publication privacy | anon SELECT grant plus three permissive TO PUBLIC USING(true) policies; no Draft/publication fields. Legacy public catalog design is observed, not a claim of customer-data exposure |
| Excessive grants | FAIL for target least privilege | anon/authenticated hold row-write/DDL-related grants including TRUNCATE. Row policies currently only SELECT; successful unauthorized row writes were not demonstrated. TRUNCATE is not governed by RLS |
| Column/policy cutover guards | PASS inspected preconditions | No explicit column ACL entries; legacy policy names match reviewed allowlist. This is not exhaustive migration acceptance |
| New secure catalog foundation | FAIL release parity | Missing ten migrations, public views/RPCs/private roles/revisions/keyrings/imports/orders/outbox; gate 3 review required |
| Application/DB coordination | BLOCKED for rollout | Actual production main SHA c73b01b is now verified and its source uses legacy reads. New restrictions still require maintenance/compatible app+DB cutover |
| Auth/MFA/session/recovery | NOT VERIFIED | Service relation presence only. No user/session/config/token read or real login; local TOTP/expiry in PR #11 does not certify production |
| Private media/Storage | NOT VERIFIED | Zero bucket rows, RLS enabled/no policies returned; no object/HTTP/CDN/withdrawal acceptance. Future private bucket/RPC contracts absent |
| Worker/order requests | NOT VERIFIED in production | DB infrastructure absent; no keys read, request sent, worker or cron started. External schedule/settings unknown |
| Production feature gates | BLOCKED / source fact | Candidate Admin admits local/staging only; production media/indexing constant false; orders/analytics refuse production. Separate reviewed enablement needed |
| Environment secrets/client boundary | PARTIAL metadata; live security NOT VERIFIED | Only project-level names/scopes reported in preceding access check; no values or live bundle audit. Effective/inherited env and production secret isolation remain unverified |
| Capacity | NOT VERIFIED | DB max_connections=60 is a parameter, not pool headroom. Hosted function limits unavailable; prior 380.6 MiB parser RSS excludes full HTTP overhead |
| Recoverability | BLOCKED | Free plan confirmed, actual backup inventory/restore/binary archive unverified; gate 2 requires explicit authorization |
| ERP dependency boundary | NOT VERIFIED / critical blocker | No positive shared indicator in narrow catalog metadata; external Auth/keys/hosting/integrations unknown |

No grants, RLS, roles, bucket policy, schema or configuration were changed to close
these gaps. RLS enabled alone does not establish correct publication/privacy.
Absence of INSERT/UPDATE/DELETE policies does not erase excessive table grants or
certify every direct SQL/API path. Never run anonymous business-data or write
probes under this metadata-only authorization.

Later security acceptance must check real provider MFA/recovery/revocation windows,
server-side roles, direct RPC/RLS/Storage boundaries, secret isolation, media
withdrawal/caches, signed orders/worker nonces and controlled key custody. Known
customer-data or authorization failures cannot be waived to accelerate release.

The [final readiness assessment](final-readiness-assessment.md) records restored
Vercel access, current deployment and Node 26 compatibility limits. Original
Supabase observations remain dated; they were not refreshed for this update.
