# Security preflight and local remediation

This review tests application/SQL contracts only. It neither configures a provider
nor certifies real JWT validation, hosted Auth, Storage, CDN or account recovery.

## Confirmed findings

| Finding | Evidence and impact | Part A resolution |
| --- | --- | --- |
| Preflight accepted production-origin aliases | Offline synthetic configuration passed when staging and production differed only by URL case, default `:443` or trailing slash. This was a false safety check, not evidence of an actual production connection | Compare normalized clean HTTPS `URL.origin` values for every subsystem; reject equal production/staging origins; no network needed |
| XLSX data outside header width was silently omitted | A two-header, three-cell synthetic row returned no error even with a formula in cell three. Formulas were never executed, but source validation/data integrity was incomplete | Scan all bounded row cells, retain header-width payload, report unheaded data/formulas/errors, allow empty formatting-only cells. SQL preserves source errors and rejects application of invalid rows |
| MFA projection shape was assumed | Missing/wrong-type `mfa_required` could be interpreted by the app as no step-up. Existing database AAL/RLS enforcement still protected authoring data | Strict role/AAL/boolean validation fails closed on contract drift; no policy/provider/role activation change |
| Staging template drift | `ORDER_TRUST_VERCEL_IP` was not read by runtime; enabled capabilities lacked identifier preflight checks | Use the actual disabled `ORDER_TRUSTED_IP_SOURCE=none`; require valid key IDs when capabilities are enabled; key identifiers/secrets remain placeholders |
| Asset-generator lint warning | Touched generator discarded a Buffer through an unused binding | Omit binary metadata without the unused binding; no runtime UI change |

The new tests cover aliases, malformed assurance data, extra string/zero/boolean/
formula/error cells, formatting-only cells and SQL preview/error propagation.
The database test explicitly confirms no invalid source product is created and
ordinary/Editor/anonymous actors cannot stage source rows.

## Existing controls rechecked

- Request-scoped Supabase SSR; provider `getUser()` then database-owned roles/AAL;
  early protected-page admission plus independent layout/operation checks.
- Admin/Editor separation; no role-assignment/public registration/recovery bypass.
- Exact Origin, CSRF, bounded bodies, strict server validation and optimistic versions.
- Private raw authoring/order tables and originals; approved public projections;
  no shared image optimizer escape; withdrawal rechecked around binary reads.
- Guest request cookie/challenge/rates, server snapshots, intent idempotency and
  private receipt/history; no client price trust, payment or stock-reservation claim.
- Domain-separated machine HMAC, narrow keyring permissions, freshness/nonces,
  lease concurrency/retry/crash recovery, aggregate health and redacted logs.
- Consent/GPC/DNT, manual analytics whitelist, no customer/raw-search/reference
  data or false purchase/revenue event. Static client chunks checked for private
  Admin/order/worker environment dependencies; no real secrets inspected.

## Remaining security boundaries

MFA enforcement defaults off until separately authorized real enrollment/recovery
rehearsal. Cookie write limits do not establish absolute session lifetime; hosted
JWT/refresh expiry/revocation, Storage AAL propagation, signup/anti-abuse settings
and proxy-header trust need Part B evidence. Role withdrawal is rechecked on the
next access; already delivered pixels/bytes cannot be revoked.

Private worker/order keyrings are empty outside test fixtures. No secret or account
has been provisioned. A compromised narrow worker key could churn the queue;
rotation/revocation and independent missed-heartbeat alerts must be rehearsed.
Provider key custody, log sinks, backup encryption/restore and retention are not
operational merely because templates exist. No customer-data purge runs here.

Normalized origins cannot prove DNS ownership, aliases, project identity or actual
service isolation. Those are explicit future operator checks. No check requests
real credentials. For existing recovery/retention/incident procedures, see
[Phase 7 security and operations](../phase7/security-and-operations.md).
