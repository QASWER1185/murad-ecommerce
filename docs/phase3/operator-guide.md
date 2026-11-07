# Phase 3 operator/security guide — preparation only

No staging or production action in this guide was executed. Production database changes, Auth setting changes, administrator provisioning, merge and deployment remain unauthorized.

## Configuration boundary

The admin client never falls back to `NEXT_PUBLIC_SUPABASE_URL` or the existing storefront key. With no configuration, `/admin/login` shows a disabled-access notice and mutations return 503. Every data/authorization call is request-scoped and uncached. `connection()` forces environment/session decisions to remain at request time even when builds run with admin disabled.

Set these server-only variables only in a separately approved isolated environment:

| Variable | Meaning |
| --- | --- |
| `ADMIN_ENABLED` | `true` explicitly enables the admin integration; default disabled |
| `ADMIN_ENVIRONMENT` | `local` or `staging`; production mode is deliberately not enabled in this phase |
| `ADMIN_SITE_ORIGIN` | Exact trusted origin, including the local port; never derive it from request headers |
| `ADMIN_SUPABASE_URL` | Explicit local or authorized staging Supabase origin |
| `ADMIN_SUPABASE_PUBLISHABLE_KEY` | Publishable/anon key only; service-role JWT and `sb_secret_` keys are rejected |
| `ADMIN_RATE_LIMIT_SECRET` | At least 32 random characters, stored in the server secret manager; same value across app workers |

Local mode requires loopback origins. Staging requires HTTPS for both origins, enabling Secure cookies. URL credentials, non-root paths, query strings and fragments are rejected. Existing production configuration is not copied into these variables by the code or test runner. Do not point a supposed staging configuration at production.

`ADMIN_RATE_LIMIT_SECRET` HMACs normalized login emails before the database receives them. The throttle stores no passwords, raw emails or IP addresses. It allows five attempts per account window of 15 minutes and 60 total attempts per one-minute global window, atomically under a database lock; old rows expire. Anonymous key churn is bounded by the global budget. Database/RPC failure rejects login rather than bypassing protection. Add an edge/WAF limit before Internet exposure; the anonymous throttle RPC/global budget can itself be abused for denial of service. Do not rely on spoofable forwarded IP headers.

## Future authorized migration/provisioning sequence

1. First review [Phase 2 cutover and recovery constraints](../phase2/release-and-recovery.md). Obtain explicit staging authorization and backup/restore evidence. Keep the legacy storefront release blocked.
2. Rehearse Phase 2 migrations and `20261108000300_admin_operations.sql` in order in the authorized isolated database. Each requires the reviewed same-session `app.catalog_cutover_approved=yes` acknowledgement. Do not put that acknowledgement into a routine production migration job. The Phase 3 migration adds the throttle table/RPC, versioned product-save RPC and image alt override/RPC; it removes direct authenticated product INSERT/UPDATE column grants and preserves SELECT access under RLS. Other Phase 2 functions remain unchanged.
3. The operator, separately authorized to provision accounts, creates/confirms the real staff Auth identity through the approved Supabase operator process. Verify its Auth user UUID out of band. A trusted database owner then assigns that exact ID `admin` or `editor` in `app_private.user_roles`. Do not use any synthetic fixture IDs. Browser code, authenticated users and administrators have no role-assignment API or grant.
4. Authenticate through the real SSR application and confirm `current_catalog_role()` resolves the operator-assigned role. Check ordinary authenticated users and editors cannot mutate, including direct RPC calls and attempts to change JSON/form approval keys. Re-run RLS tests with actual JWTs.
5. Verify real refresh/revocation/error behavior, Secure/HttpOnly/Strict cookies, private/no-store headers, CSRF/origin validation, global/shared throttle behavior and no secrets in browser bundles. Decide MFA, provider token/session lifetimes, password reset/recovery and edge rate limits through a separately approved Auth/operations process.
6. Test genuine Draft product entry, stale concurrent edits, verification, explicit review, publish without indexing, failure of incomplete indexing approval, withdrawal and private previews. No administrator should attest sample data as real. Publishing requires genuine identity and useful content; price and media can remain absent with indexing off.
7. Review Phase 4 media/import work, storefront adapter, immediate cache withdrawal and redirect integration before any proposed production rollout. This dashboard's database correctness does not make the unchanged legacy storefront compatible with restrictive RLS.

## Authorization details

- Proxy only handles CSRF-cookie setup, session refresh and private response headers. Protected layout, each page/data accessor and every mutation independently verify the user and database role; authorization never relies on proxy alone.
- All admin routes/preview responses are noindex/nofollow, private/no-store, frame-denied and same-origin form constrained. No shared user/session cache is created. `getSession()` cookie contents and editable user metadata are never used to authorize.
- Product saves use server Zod validation plus the database's independent allowlist/constraints. SQL row locks and expected-version checks reject stale overwrites with 409. Unknown form publication fields are rejected. Workflow approval/stamps cannot be set through the Draft payload.
- CSRF tokens are 32 random bytes, stored as a host-only HttpOnly Strict cookie and included as hidden form values; mutation origin must exactly match trusted configuration. Tokens rotate on login/logout. Requests with oversized bodies, unsupported encodings or duplicate fields are rejected.
- Private gallery alt edits require an administrator, an active Draft, its exact version and an image actually attached to that Draft. Gallery triggers increment the product version and invalidate verification/review. Original media object paths/binaries are not exposed in public views or previews.
- Session cookie issuance is limited to eight hours; refresh may issue a new cookie. The Auth provider remains responsible for refresh/access token lifetimes and revocation behavior. Logout clears local cookies even when remote revocation fails, reports that failure, and does not claim all existing access tokens are instantly invalid.
- No service-role credential/client is added, no public registration endpoint exists, and no real administrator was silently created. Provider outage rejects access. Current editors remain read-only.

## Recovery

The new migration is transactional; errors roll back that file. No existing product IDs or old business values are rewritten by migration installation. Turning `ADMIN_ENABLED` off disables application access without changing database roles/data. Do not treat it as revocation of existing provider tokens.

After an authorized committed migration, prefer a reviewed additive forward fix and preserve backups/revision/audit records. Do not drop tables or loosen Draft RLS to recover legacy pages. A UI rollback must account for the removal of direct product-authoring grants. Use the versioned RPC path, not restored broad writes, and follow the coordinated Phase 2 database/application recovery plan.

Any staging, production or Auth configuration operation still needs its own explicit owner authorization.
