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

## Documentation publication safeguard — resolved by limited exception

The owner approved one branch-only repository exclusion on 9 November 2026
(Asia/Karachi). `git.deploymentEnabled` now maps exactly
`development/production-gate1-inspection` to false. All nine prior exclusions and
all other config values are preserved; no true or wildcard rule can override it.
No tracked independent CI deployment or active custom push/commit hook was found.

The [official rule](https://vercel.com/docs/project-configuration/git-configuration)
and local exact-match/config-preservation checks verify native Git-trigger
prevention before first push. [Safety evidence](evidence/deployment-safety.json)
binds that check to the config SHA256. This is not a provider-settings mutation,
manual-deployment authorization or proof that the historical 403 is resolved.
No production environment variable, domain, project setting or deployment was
accessed or changed by the exception. Gate 2 remains unapproved.

[Non-secret access failure](evidence/vercel-access.json).
