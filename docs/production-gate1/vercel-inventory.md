# Vercel production inventory — access restored

**PASS — e-commerce team/project and current production deployment metadata.**
The original 403 is retained as [historical evidence](evidence/vercel-access.json),
not as a current blocker. After owner team consent, exact scoped reads succeeded.
No project, deployment, variable, token, domain or provider setting was changed.

| Field | Current observed value |
| --- | --- |
| Project | murad-ecommerce / prj_OXReC9drbCnKpRDc1KdPrLyMvbFU |
| Owning team | team_aLiRohDtAAZqq656cMy1Hwzz |
| Framework / current project Node setting | nextjs / 26.x |
| Production deployment | dpl_JBtpFzJHEfCJud4eAH2UfFhijUWa |
| Production alias | https://murad-ecommerce.vercel.app |
| Provider target / state | production / READY; no errorCode reported |
| Git source | QASWER1185/murad-ecommerce, main |
| Deployed SHA | c73b01b93c4093edefe1c00e34299a9041ea5bef |
| Other aliases on that record | murad-ecommerce-kelidexpipes-5464s-projects.vercel.app; murad-ecommerce-git-main-kelidexpipes-5464s-projects.vercel.app |

The deployment was resolved by the canonical production alias, rather than assuming
the newest production-target record was the active alias. [Fresh sanitized
metadata](evidence/vercel-current-inspection.json) and [final assessment](final-readiness-assessment.md)
record source/identity and limitations. READY confirms provider build/deployment
completion; no build-log audit or application/security acceptance test was run.

## Environment names/scopes — no values

The preceding access check used the non-decrypting project listing and emitted/
persisted only an allowlist of variable names and target scopes. It returned:

| Name | Target |
| --- | --- |
| NEXT_PUBLIC_SUPABASE_URL | production |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | production |

No variable value is included in this report/evidence. Inherited/team/system
variables were not audited; this is not a guarantee of the complete effective
environment. Candidate ADMIN_*, CATALOG_*, worker/order settings were not shown in
this project-level result, but effective absence is not proven. No new environment
query was needed for the final assessment. A decrypt=false flag alone is not a
names-only guarantee; values must remain excluded from all emitted evidence.

## Remaining verification limits

- Full candidate Node 26 runtime acceptance is NOT VERIFIED. Next 16.4.5 requires
  node >=20.9.0 and Vercel documents 26.x support; see the compatibility evidence.
- Current project Node setting does not prove the older build's Node major;
  per-deployment historical Node runtime was not returned by inspected metadata.
- Function memory/duration/body/concurrency/pool headroom, build configuration,
  effective/inherited environment and deployment protection remain NOT VERIFIED.
- Production aliases are verified on the current deployment record. Preview
  environment separation and custom environments were not exhaustively inspected.
- Deployed source uses legacy raw-table reads; compatible app/schema cutover is
  required before the ten missing migrations and new features are activated.

## Documentation branch deployment safeguard

The limited owner-approved exact rule
`development/production-gate1-inspection: false` remains unchanged. Nine prior
exclusions and all other configuration were preserved; no true/wildcard override
or tracked deployment workflow was found. [Safety evidence](evidence/deployment-safety.json)
records the documented Git-trigger prevention. It does not authorize a manual
build/deploy or Gate 2. No provider project setting was mutated.
