# Proposed production cutover — NOT RUN / separate authorization required

This is a plan, not an executable release approval. No production account,
database, Auth, Storage, environment, deployment, DNS, role, cron or key was
accessed/modified in this phase. No new hosted database is assumed.

## 0. Identity and protected-dependency gate — BLOCKED

1. Owner authorizes **read-only discovery first**, naming the e-commerce Supabase
   ref and Vercel project/team/domain. Previously declared Supabase ref is
   `ddgjspvdgjpbysylntji`; declared hostname is
   `https://murad-ecommerce.vercel.app`. Earlier metadata named Vercel project
   `prj_OXReC9drbCnKpRDc1KdPrLyMvbFU` / team
   `team_aLiRohDtAAZqq656cMy1Hwzz`. These are historical identifiers, not a fresh
   production configuration inspection or a sufficient approval.
2. Establish the exact technical identities/dependencies of **Muraderp ai** through
   owner-reviewed evidence. Its real slug/ref is unknown. Do not discover it by
   probing or changing unrelated projects. Mark shared database schemas/roles,
   Supabase Auth/Storage, organization quotas, hosting project, domains, secrets,
   schedules, repositories and integrations. Unknown relationship means STOP.
3. Restrictive migrations change public-schema/grants and Storage policies; they
   are unsafe if ERP shares those resources. Do not apply them to a shared ERP DB.
   A shared dependency requires a separately reviewed isolation design and owner
   approval; it is not waived by choosing Option 2.
4. With specifically authorized read-only DB access, inspect actual migration
   history, columns, grants/policies, extensions/version, data volumes and app
   dependencies. Compare with fresh/legacy/optional-column local rehearsals.
   Unknown schema/policy drift requires review, not automatic removal of policies.

## 1. Release freeze and recovery gate — BLOCKED

- Owner accepts the local results and every named residual risk. Real provider
  behavior is unverified; passing mocks does not certify Auth/Storage/CDN.
- Freeze the final reviewed commit, npm lock hash, ordered migration hashes,
  build/runtime configuration and permission manifest. New changes invalidate
  affected evidence. Exact tested base and PR heads are in the evidence inventory;
  the final new-branch commit must also be explicitly accepted.
- Approve production access, backup/restore operator and protected destination,
  release/maintenance window, communications, incident owner and rollback trigger.
- Obtain verified DB/schema/ACL/role/config backups **and Storage binary archives**.
  Restore into an approved secured isolated operator target; verify checksums,
  permissions, orders/revisions and private objects. Measure recovery time/data-loss
  window. No third Supabase project is necessary if the owner supplies a suitable
  private restore environment. Never silently copy production data to this session.
- Verify trusted Admin enrollment/recovery, machine keys/rotation, monitoring,
  provider request/body/memory/function limits and sufficient no-impact capacity.
- Current production-mode code gates remain closed. Admin supports only local or
  staging; media/indexing has `productionReleaseApproved=false`; orders/analytics
  reject production. Enabling these requires a separate reviewed code change and
  explicit action-specific approval, not merely adding environment variables.

## 2. Maintenance and fail-closed transition — NOT RUN

Application/database deployment is not atomic. Do not install restrictive schema
under the old raw-table storefront and assume it will continue to work.

1. Approve maintenance for **e-commerce only**. Freeze authoring/imports/request
   intake and stop any old e-commerce worker; never pause ERP infrastructure.
   Verify maintenance covers all old aliases/deployment URLs and API entry points.
   A landing page alone does not block direct Supabase API clients.
2. Keep private authoring data and new synthetic canaries out of the legacy public
   schema until catalog restrictions are installed. Preserve existing business
   data. Record in-flight request/idempotency state and backup cut point.
3. Prepare the compatible final application with Admin, catalog/media, orders,
   worker, analytics and indexing disabled behind maintenance. Verify no active
   raw-table fallback. Do not promote an earlier incomplete stacked PR.
4. During the approved traffic freeze, apply the exact reviewed DB sequence through
   a trusted operator. On a populated DB, reconcile already-applied historical
   migrations; **never replay the legacy seed**. On a proven empty target only,
   use the reviewed fresh initialization plan. Do not assume remote main matches
   Git main just because names agree.
5. Files `20261108000100` through `20261108001000` require
   `SET app.catalog_cutover_approved='yes'` in **each applying connection** and own
   transaction guards. Use a reviewed migration ledger/procedure that preserves
   this session setting. Ordinary `db push` without it fails intentionally.
   Record start/end, exact hashes and success. Stop on first failed transaction;
   do not weaken guards, permissions or RLS or continue dependent DDL.
6. Verify installed schema/grants/views/RLS and anonymous raw-table denial through
   the actual public API. Confirm all retained samples/IDs remain Draft/unverified,
   private originals/import sources are denied and keys/roles were not broadened.
7. Promote only the compatible app while maintenance remains enabled. Canary every
   admission path; old deployments must not serve writable legacy flows. Never
   switch back to old raw-table code under the restricted schema.

## 3. Staged activation gates — each requires its own owner approval

| Stage | Acceptance before proceeding | Failure response |
| --- | --- | --- |
| Basic public catalog | Genuine explicitly published content through public views; unknown price/stock remain unknown; Draft/withdrawn 404; correct URLs/noindex | Keep maintenance/catalog closed |
| Trusted Admin | Real provider login/refresh/revocation/recovery, enrolled TOTP/AAL2, Editor read-only, ordinary denied, CSRF/rates | Keep Admin closed; investigate permissions |
| Authoring/publication | Draft save, versions/revisions, explicit review, publish/withdraw; sample inventory never promoted | Keep authoring/publication closed |
| Public media | Private originals/history denied; approved variants only; withdrawal through real CDN/browser path and concurrency | Keep media off; do not bypass optimizer checks |
| Order requests | Actual gateway signing/idempotency/privacy/rates, correct server snapshots, quotation-only daily rates, receipt recovery | Keep real customer intake disabled |
| Machine worker | Narrow identity/nonces/leases/retries/rotation, monitoring recipient and approved schedule; withdrawal safe if worker offline | Keep schedule off; reconcile queue |
| SEO / analytics | Separate Google/indexing/consent approvals, canonical/property/content eligibility; no fake rich data | Keep indexing/analytics off |

Any live synthetic test accounts/objects/order requests require specific permission,
clearly marked private data and an approved archive/cleanup plan. Do not send real
WhatsApp/email/customer notifications. Requests are not payments, reservations,
accepted orders or confirmed sales. A successful basic storefront smoke is not
permission to enable every gate simultaneously.

## 4. Abort and recovery — NOT RUN

Abort on authorization/privacy failure, unexpected ERP dependency, migration drift,
uncontrolled errors, data mismatch, failed media withdrawal, unsafe order handling
or missing recovery access. Keep e-commerce maintenance/admission gates closed,
stop new ingestion/worker execution, preserve redacted evidence and notify only
through separately approved incident channels.

Prefer a reviewed forward fix to the compatible app/schema. Disabling a feature
limits exposure; it is not a substitute for repairing leaked permissions. Revoke
only authorized compromised e-commerce credentials; never shared ERP credentials.
If restore is required, use the verified compatible DB + Storage archive cut point,
reconcile later legitimate requests/revisions, check ACLs and object privacy, and
repeat closed smoke checks before reopening. Restore authority and exact target
must be explicit. Do not delete business data/history/objects to make checks pass.

**A Git revert is not a database rollback.** Do not promise destructive down SQL,
restoration timing or data-loss bounds that have not been measured and accepted.
No production command has been run by this preparation.
