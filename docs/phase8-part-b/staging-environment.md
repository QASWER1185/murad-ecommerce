# Staging environment and exact missing prerequisites

**BLOCKED — no verified real staging identity.** No provider/API/DB/hostname was
queried. The following production identifiers are owner-declared, not independently
verified, and exist only in the offline rejection policy:

| Item | Declared value | Status |
| --- | --- | --- |
| Production Supabase ref | `ddgjspvdgjpbysylntji` | PASS: declaration recorded; rejected as staging |
| Production Supabase origin | `https://ddgjspvdgjpbysylntji.supabase.co` | PASS: declaration recorded; rejected as staging |
| Production hostname | `https://murad-ecommerce.vercel.app` | PASS: declaration recorded; rejected as staging |
| Hosting provider | Vercel | PASS: declaration recorded, not account inspected |
| Project/environment | Production / Main / single tenant | PASS: explicitly declared; disallowed for Part B |
| Separate staging Supabase ref/API | Not supplied | BLOCKED |
| Separate staging HTTPS origin/project/environment | Not supplied | BLOCKED |
| Ownership, aliases, DB pooler target, no-customer-data isolation | Unverified | BLOCKED |
| Staging operator access | Not bound to this execution runtime | BLOCKED |
| Exact spending/load limits | Only “free/standard defaults” supplied | BLOCKED for provisioning/load testing |

The owner states secrets exist in production Vercel environment variables and
Supabase Secret Manager. This does not grant staging access here. A presence-only
runtime check found no configured staging target/operator/budget variables. It did
not inspect provider secret stores or claim they are empty. No secret is required
in chat, PRs or logs.

## Required before hosted work can resume

1. Identify or separately approve provisioning a **nonproduction Supabase project**,
   with project ref/API URL, owning organization and explicit isolated scope.
   Provisioning permission and paid limits must precede creation; do not infer
   permission from the production account or a nominal free tier.
2. Identify a separate Vercel staging project or protected Preview environment,
   project ID, branch/environment scope and distinct HTTPS origin. Confirm ownership,
   aliases/deployment protection and staging-only environment-variable bindings.
   No production Main build or hostname may be reused.
3. Confirm no real customer records are present and all test records/identities
   will be synthetic. Independently verify project/DB direct or pooler identities,
   permissions, production separation and alias destinations before connecting.
4. Bind limited staging operator access through approved secure Environment
   Settings/secret mechanisms accessible to the execution runtime. Supply no
   passwords, JWT signing secrets, private keys or session tokens in conversation.
   External production secret stores are not an alternative.
5. Specify a numeric spending cap/currency and bounded request count, concurrency,
   duration and synthetic-record cap. Clarify image/workbook volume, cleanup limits
   and which provider plan/capacity applies. A 2,000+ record test requires an
   approved cap permitting it; no high-concurrency test is currently approved.
6. Identify authorized staging backup destination, a **separate restore target**,
   retention/cleanup scope and permissions. Confirm migration history and whether
   the target is empty before deciding how the historical seed is handled.
7. Before activation of optional operations, approve the staging worker identity,
   key custody, cadence, monitoring destination and alert budget. Before Auth tests,
   authorize the trusted synthetic-identity provisioner and recovery procedure.
   No MFA enforcement until enrollment and recovery succeed.

## Offline declaration helper

`npm run check:phase8b` is a report-only prerequisite checker, not a deployment or
credential manager. Its names are diagnostic inputs, not a new required provider
integration. Operators may use equivalent approved secure tooling:

- Non-secret: `STAGING_PROJECT_REF`, `CATALOG_SUPABASE_URL`, `CATALOG_SITE_ORIGIN`,
  `STAGING_HOSTING_PROJECT_ID`, `STAGING_HOSTING_ENVIRONMENT` (`preview`/`staging`).
- Secure, presence-only markers: `STAGING_DATABASE_URL`,
  `STAGING_SUPABASE_OPERATOR_BINDING`, `STAGING_HOSTING_OPERATOR_BINDING`.
  The latter two identify locally accessible approved bindings; the checker does
  not resolve them or prove permissions. A DB URL is parsed in memory only to
  reject known production identities and is never output.
- Numeric whole-unit bounds: `STAGING_SPENDING_CAP`, `STAGING_MAX_REQUESTS`,
  `STAGING_MAX_CONCURRENCY`, `STAGING_MAX_DURATION_SECONDS`,
  `STAGING_MAX_SYNTHETIC_PRODUCTS`; currency `STAGING_BUDGET_CURRENCY` (ISO code).
  Zero may declare no permission for that operation. Additional workload/cadence
  details still require review.

**PASS (local only):** supplied Production/Main candidate is rejected; see
[evidence](evidence/production-candidate-rejection.json).
**BLOCKED:** actual ownership/isolation/permissions cannot be inferred from syntax
or a hostname denylist. The helper always leaves `hostedExecutionReady: false`.
No known production endpoint is contacted even to “check” it.
