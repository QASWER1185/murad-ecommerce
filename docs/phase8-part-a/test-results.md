# Local validation results and reproduction

Run from the repository with Node 22+ and npm, local Docker Unix socket and Chromium at
`/usr/bin/chromium`. Existing dependencies are sufficient; no new package is added.

```sh
npm ci
npm run verify:phase8-part-a
node scripts/phase8/audit-repository.mjs
```

The runner fixes build services to loopback/dummy values and disables features;
each existing e2e harness then injects its own isolated local configuration. It
never accepts a hosted database URL or invokes a deployment/remote migration.
Browser suites run sequentially because they share port 3100. PostgreSQL containers
use a unique name, explicit local socket and `--network none`, no published DB
port, and cleanup in `finally`.

For a reproducible subset after a failure, specify task names, for example:

```sh
npm run verify:phase8-part-a -- test:phase5:e2e test:phase6:e2e
npm run test:phase8:unit
npm run test:phase8:db
npm run test:phase8:compat
```

The aggregate task results are in `evidence/test-results.json`. New Part A tests:
seven unit groups; nine SQL import-boundary assertions; seven full-stack legacy-
compatibility assertions plus the existing 27-assertion foundation in each fixture.
Existing Phase 2–7 counts and final statuses are summarized in README/evidence.

The full pass includes optimized Next.js build, TypeScript, lint, full/production
NPM audits, Phase 2 legacy/PR #2 compatibility, Phase 3 Auth/Admin, Phase 4 media/
imports, Phase 5 public catalog, Phase 6 order/privacy/analytics, Phase 7 machine
worker/MFA/recovery/SEO and browser/capacity checks. A static audit checks all 12
unchanged migrations, branch ancestry, local #2 merge conflicts, approved assets
and public browser bundles. Performance and accessibility results have their own
limits and are not represented as blanket pass/certification.

## Failure found and corrected during Part A

The first Phase 5 browser run failed on an independent public GET immediately
after clicking Publish. The test treated a visible Return-to-Draft button as
publication completion, but that button already exists while Ready for Review.
The public request correctly returned 404 before the transaction committed.
The test now waits for the actual reviewed/published success navigation. Its
rerun passed; no authorization/publication rule, version check or timeout was
weakened. The failed attempt is reported here rather than hidden as a code exploit.

## Coverage limitations / deliberately unexecuted checks

- Auth/PostgREST/Storage HTTP contracts and users are synthetic; SQL/RLS, Next.js,
  SDK client, Sharp/parser and browser are real. No real Supabase service test.
- Google script transport is stubbed/blocked. No actual GA4 delivery/property,
  Search Console, external rich-results validation, sitemap submission or indexing.
- No actual CDN, provider MFA/recovery/revocation, hosted limits/load/backup/alerts,
  operator account/key provisioning or remote migration/deployment.
- Chromium desktop/mobile viewport and keyboard samples only; no claim of Safari,
  real-device/assistive-technology coverage, field INP or complete accessibility.
- No real inventory or customer records imported. No payment/fulfilment workflow
  exists or is claimed by request persistence.

Full logs, generated source files, database contents, synthetic spreadsheet/image
inputs and Auth/session material remain under ignored `work/phase8-*` / existing
fixture work paths. Only reviewed aggregate evidence and marked visual captures
are committed; no generated catalog dump, credential or customer dataset is added.
