# Controlled launch preparation — local candidate for review

**PASS: 24 existing local regression tasks + 9 real local Auth/PostgREST groups +
2 new isolation guard tests. Production launch remains BLOCKED.** This is not a
hosted staging or production security certification. No production or Muraderp ai
resource was accessed or modified in this phase. No merge, deployment, provider
provisioning, Google access, notification or billable infrastructure operation.

Branch: `development/controlled-launch-prep`, based on Phase 8B commit
`e35633164bba10621093a4a5da375d83adf372d6`. Draft PR targets
`development/phase8-real-staging`. All earlier PRs remain Draft/unmerged.
Evidence timestamps are UTC; report timezone is Asia/Karachi.

| Area | Actual result |
| --- | --- |
| Build / TypeScript / lint / dependency audits | PASS; zero build/type/lint errors, eight retained legacy warnings; zero known npm audit findings |
| Existing Phases 2–8B regressions | PASS; 24 runner tasks, including 55 unit groups and 71 browser groups across the existing suites |
| New isolation tests | PASS; two guard groups: published-port rewrite and foreign/privileged/host-network rejection |
| Real local Auth / PostgREST | PASS; nine groups including real JWT/refresh/expiry, trusted identities, roles/RLS, Draft RPC, actual Admin SSR login and TOTP/AAL2 |
| Official full CLI stack | BLOCKED; PostgreSQL distribution image exhausted executor disk during layer registration; no real Storage HTTP service in fallback |
| Media/import Storage coverage | Real parsers/Sharp/PostgreSQL/RLS + simulated HTTP/binary archive contracts; not real Storage/CDN certification |
| Migration compatibility | PASS; twelve historical files unchanged; fresh/legacy/PR #2 optional-column fixtures retain sample IDs and unverified Draft state |
| Approved visuals | PASS; four current Home/Sanitary captures exactly match Part A raw pixels; all 19 PR #2 Sanitary assets byte-identical |
| Mobile LCP | Target unmet: home 3.728 s; Sanitary 3.452 s local medians; no speedup claim |
| XLSX memory | 380.6 MiB process peak for 10,000×40 direct parser fixture; hosted headroom unverified |
| Accessibility | Contrast findings retained on approved storefront; no unauthorized palette change or WCAG certification |
| Live release | BLOCKED by protected dependencies, actual schema/recovery/provider acceptance, production-mode gates and separate owner authorization |

## Read the evidence

- [Integration/PR review](integration-review.md)
- [Actual local Supabase service scope](local-supabase-results.md)
- [Migrations and preservation](migration-rehearsal.md)
- [Security results and limitations](security-results.md)
- [Storefront, media/import and order flows](storefront-and-orders.md)
- [Performance/memory and alternate import design](performance-results.md)
- [SEO readiness](seo-readiness.md)
- [Future cutover runbook](production-cutover-runbook.md)
- [Backup/recovery](backup-and-recovery.md)
- [Objective release gates](release-gates.md)
- [Required future owner approvals](owner-approval-checklist.md)
- [Remaining blockers](remaining-blockers.md)
- [Phase 9 planning only](phase9-product-onboarding.md)

Statuses: **PASS** executed and evidenced in its stated local scope; **FAIL** an
executed check/target failed; **BLOCKED** required capability/approval unavailable;
**NOT RUN** deliberately not attempted, with reason. Historical setup failures are
retained in the service report; local passes are never relabeled hosted passes.

## Reproduce safely

Requirements: Node 22+, locked npm dependencies, managed local Docker Unix socket,
Chromium. No remote URL, provider login, `.env.local` credential, tunnel or link.

```sh
npm run verify:controlled-launch
node --test tests/controlled-launch/isolation.test.mjs
node scripts/controlled-launch/audit-repository.mjs
node scripts/controlled-launch/lean-local-supabase.mjs
node scripts/controlled-launch/collect-evidence.mjs
```

The full official attempt is `node scripts/controlled-launch/local-supabase.mjs`.
It requires substantially more available disk than this executor; it now checks
free disk/time and returns blocked exit 2 rather than consuming the filesystem.
Do not rerun it here simply to repeat the known limitation. All Docker resources
are disposable, uniquely named, local-only and removed by the helper. The lean
setup publishes no container port; its HTTP gateway binds only `127.0.0.1:55321`.

The existing runner executes build, TypeScript, lint, both dependency audits and
all regression tasks sequentially, writes exact task/exit/time records and stops
on failure. Specific tasks can be selected by name for a justified retest. Logs,
sessions, synthetic uploads/workbooks, service keys and database dumps remain in
ignored `work/controlled-*` or existing phase fixture directories, never reports.

## Changes and captures

No storefront/Next runtime, approved design, historical migration or dependency
version was changed. Added local test/audit/evidence helpers, isolation tests,
14 reports and reviewed aggregate evidence; corrected local Auth bootstrap order,
role search path and test transport; disabled Git auto-deployment for this branch.
See the [full changed-file inventory](evidence/file-inventory.json).

Captures contain synthetic local fixtures only:

| Desktop | Mobile |
| --- | --- |
| [Homepage](screenshots/home-desktop.png) | [Homepage](screenshots/home-mobile.png) |
| [Sanitary](screenshots/sanitary-desktop.png) | [Sanitary](screenshots/sanitary-mobile.png) |
| [Admin with real local Auth](screenshots/admin-real-local-desktop.png) | [Admin with real local Auth](screenshots/admin-real-local-mobile.png) |

[Machine-readable summary](evidence/summary.json), [final checks](evidence/final-checks.json), [test tasks](evidence/test-results.json)
and [real local service checks](evidence/real-local-services.json) distinguish the
execution layers. **Stop after preparation; Phase 9 and production release are not
started.** Owner reviews this candidate and separately approves exact live actions.
