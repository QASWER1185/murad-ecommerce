# Vercel production inventory — BLOCKED

Authorized target only: murad-ecommerce / project
`prj_OXReC9drbCnKpRDc1KdPrLyMvbFU`, team
`team_aLiRohDtAAZqq656cMy1Hwzz`, declared hostname
`https://murad-ecommerce.vercel.app`.

The connection is installed, but the fresh exact-team project-identity listing
GET /v10/projects with the authorized team and name filter returned **403
forbidden**, scope `kelidexpipes-5464s-projects`. Identity could not be freshly
verified, so no downstream project inspection was attempted. No alternate
personal/team scope, credential extraction or browser access workaround was used.

| Requested production metadata | Result |
| --- | --- |
| Exact owning team/project identity | BLOCKED: scoped listing denied |
| Current production deployment/status/SHA | NOT VERIFIED |
| Git repository and branch | NOT VERIFIED; repository main source alone is not deployment evidence |
| Framework/runtime/build settings | NOT VERIFIED; PR #11 Next/Node local results are historical local evidence |
| Actual function memory/duration/body/concurrency limits | NOT VERIFIED |
| Environment variable names and target scopes | BLOCKED; no environment listing or value retrieval attempted |
| Preview/production separation | NOT VERIFIED |
| Domains/aliases | NOT VERIFIED; owner-declared hostname was not fetched as a workaround |
| Deployment protection | NOT VERIFIED |
| Compatibility with proposed schema | BLOCKED until actual source/config identity verified; legacy-vs-new risk established by repository and DB metadata |

Source-required names include ADMIN_ENABLED/ENVIRONMENT/SITE_ORIGIN/SUPABASE_URL/
SUPABASE_PUBLISHABLE_KEY/RATE_LIMIT_SECRET; CATALOG_ENABLED/ENVIRONMENT/SITE_ORIGIN/
SUPABASE_URL/SUPABASE_PUBLISHABLE_KEY/MEDIA_ENABLED/INDEXING_ENABLED;
CATALOG_WORKER_ENABLED/ENVIRONMENT/SITE_ORIGIN/SUPABASE_URL/PUBLISHABLE_KEY/KEY_ID/
SECRET; ORDER_REQUESTS_ENABLED/GATEWAY_KEY_ID/GATEWAY_SECRET/TRUSTED_IP_SOURCE;
and optional ANALYTICS_ENABLED. This is a candidate-side checklist, **not a list
of missing production variables**. Existing production names/scopes are unknown.
Do not use a decrypt=false response as a guarantee of names-only output: plain
variables can still have values. Future inspection needs a genuinely names/scopes-
only projection or owner-redacted metadata, never values.

## Precise owner-side access steps

Use the current Vercel integration's owning-team authorization flow for
`team_aLiRohDtAAZqq656cMy1Hwzz`; review/approve the existing app's team access and
complete provider SSO if prompted. A fresh single-use consent link can be generated
through authorize_team_access when requested; none was created in this strictly
read-only inspection. Do not reconnect blindly, switch to another team, share a
token or change deployment settings. Then retry only the same scoped identity
read, verify exact project/name/team, and resume permitted metadata inspection.

## Documentation publication blocker

The new inspection branch is not in the repository's explicit Git deployment
exclusions. Vercel's [documented rule](https://vercel.com/docs/project-configuration/git-configuration)
is that unspecified branches default to true. Actual Git/ignore configuration is
unavailable behind the 403. Therefore a branch push is held to avoid triggering
an unauthorized Preview. No skip-commit convention was assumed. The exact minimal
repository guard proposed for separate approval is shown in README; it would
require an exception to the documentation-only scope. No configuration was changed.

[Non-secret access failure](evidence/vercel-access.json).
