# Staging preparation — no hosted environment authorized

Phase 7 only prepares local checks and configuration. No real Supabase project,
GoTrue account, Storage service, Google property, scheduler or deployment was
created or changed. The loopback Auth/PostgREST/Storage HTTP layer is simulated;
PostgreSQL 17 migrations, SQL functions, transactions and RLS run in a real,
networkless disposable Docker container. Synthetic users and images are fixtures,
not inventory or production administrators.

## Reproduce locally

Requirements: Node 22+, npm lockfile, Docker at the local Unix socket, Chromium at
`/usr/bin/chromium`. Read the managed-runtime Docker/network instructions before
installation. Scripts strip remote Docker context/TLS selectors, bind HTTP to
loopback and expose no PostgreSQL port. Never supply a hosted database URL.

```sh
npm ci
npm run test:phase7:unit
npm run test:phase7:db
CATALOG_ENABLED=false ADMIN_ENABLED=false NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321 NEXT_PUBLIC_SUPABASE_ANON_KEY=phase7-local-test npm run build
node scripts/phase7/regress.mjs
npm run test:phase7:e2e
npm run test:phase7:capacity
node scripts/phase7/capacity.mjs
npm run check:staging -- --static
npx tsc --noEmit
npm run lint
npm audit --omit=dev
```

Browser suites use port 3100 and must run sequentially. Capacity parsing requires
`test:phase4:unit` to compile its real implementation. All generated reports,
spreadsheets, account sessions and screenshots first go under ignored
`work/phase7-*`. Reviewed redacted reports/screenshots are copied to this folder.
Containers and their volumes are removed in `finally`. If interrupted, inspect
only the uniquely named `murad-phase3-*` test container, confirm its test label,
then remove that specific container/volume; never prune unrelated Docker data.

`test:phase7:db` applies every migration to a fresh fixture, runs the MFA/worker
security tests, dumps that synthetic database in memory, restores a second
local database and verifies counts and the anonymous raw-table restriction.
Fixture Storage binaries are separately round-tripped byte for byte. A database
dump does **not** include Storage object bytes. This is not real Storage or
provider backup certification, nor a measured operational RPO/RTO.

## Hosted staging — requires separate owner authorization

1. Owner identifies an isolated non-production Supabase project and application
   origin and grants time-bounded operator access. Confirm production deny-target
   references and a backup owner. Do not reuse production data or accounts.
2. Copy `ops/staging/environment.example` into a secret store outside Git. Replace
   placeholders with the approved project's anonymous publishable key and three
   independent random private secrets. Do not put privileged values in
   `NEXT_PUBLIC_*`, command arguments, PRs, screenshots or shell transcripts.
   `node --env-file=/private/staging.env scripts/phase7/check-config.mjs` performs
   configuration-only validation with no network or credential output.
3. Verify project identity in the provider console. Review migrations and unknown
   grants/policies; rehearse restore first. Only after explicit migration approval,
   use the provider's reviewed migration process in file order with the guarded
   `app.catalog_cutover_approved=yes` setting in each migration connection. Do not
   independently apply restrictive catalog migrations to a legacy storefront.
4. Separately authorize synthetic Auth account provisioning. Trusted operator
   assigns one Admin and one read-only Editor through `app_private.user_roles`;
   ordinary/anonymous users get no role. No app registration/role endpoint exists.
5. Enroll and verify the trusted Admin's TOTP through the separately approved
   provider/operator process. Rehearse identity-checked recovery and offline
   recovery access, then enable `app_private.catalog_security_policy.require_mfa`
   using the trusted operator connection. Check signed JWT `aal2` at both SSR
   and PostgREST. AAL1 must fail raw authoring RLS, RPCs, previews and private
   Storage, even if app requests are bypassed. Do not turn MFA off to recover
   a lost factor; revoke sessions and follow the operator recovery procedure.
6. Explicitly authorize insertion of a staging-only worker key and order-gateway
   key into their separate private keyrings and the matching app secret store.
   Keyrings start empty. Admin/Editor/anonymous clients cannot provision/read
   them. No service-role browser credential is required.
7. With deployment authorization, deploy only to the approved staging hostname.
   Keep real analytics/indexing disabled, password-protect the staging host if
   available, and apply security headers. Robots alone does not secure staging.
8. Run the real-service matrix below, record evidence, and only then separately
   authorize installing the disabled cron example. Verify hosted request/body/
   memory/concurrency/duration limits; a local pass is not hosting certification.

## Real-service acceptance matrix (not executed in Phase 7)

| Area | Required staging checks |
| --- | --- |
| Auth | Anonymous/ordinary denied; Editor read-only; Admin AAL1 denied when MFA required; verified TOTP AAL2 allowed; wrong/expired/replayed TOTP denied; revoked/expired/rotated JWT and refresh tokens; logout; role withdrawal; password-recovery session cannot bypass MFA; shared login/MFA throttles and provider CAPTCHA/lockout decisions |
| RLS | Direct anon/authenticated raw tables, RPCs, private schemas, Storage REST and signed-URL behavior; ordinary user metadata cannot grant a role; no public keyring reads; grants/policies match reviewed migrations |
| Publication | Image/price-free Draft; optimistic editing/revisions; explicit review/publish; separate indexing eligibility; changed ancestors/brand or missing verification withdraws product; 404/308; late concurrent updates remain queued |
| Media | Upload actual permitted original; spoof MIME/invalid/oversize rejected; derivatives only; draft/original/history bytes denied publicly; withdrawal before/after binary fetch; direct/optimizer/CDN/browser cache behavior; actual Storage upload/download failures and recovery |
| Imports | CSV/XLSX mapping, duplicate SKU/model, blanks preserve, explicit price approval, formulas/ZIP limits, interrupted batches/retry, concurrent version conflict, all imports stay Draft |
| Orders | Origin/CSRF, challenge age, spam/rates, duplicate/global intent identity, changed-product rejection, private snapshots/receipts/history, Admin status/version checks, quotation-only unpriced building materials, no invented purchase/payment or stock reservation |
| Worker | No cookies; invalid/missing/replayed/expired signature denied, origin bound; overlapping keys/workers, key rotation/revocation, crash after claim/before ack, expired lease, retry backoff, persistent queue failure and missed-run alert |
| SEO/privacy | SSR verified content, noindex staging/search/filters/Admin/drafts, empty sitemap, canonical/404/308, no fake rich markup, no third-party analytics before consent, GPC/DNT, no PII/raw search or purchase/revenue events |
| Recovery | Restore schema/ACLs/roles/Auth integration and separate original/derivative binary archive in isolated target; checksum/permissions/public withdrawal; orders/history reconciliation; independently witnessed timings |

Do not use customer orders as staging fixtures. Do not load commercial sample
records as verified/published. The local synthetic fixture uses the real review
workflow only in its disposable test database.
