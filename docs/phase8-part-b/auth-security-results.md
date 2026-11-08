# Real Auth, MFA and session results

**Overall: BLOCKED — not executed on real staging.**

The owner now authorizes creating isolated staging in existing accounts at no
additional cost. Supabase is connected; one project creation attempt was rejected
by its member-wide active free-project quota. Vercel is connected, but owning-team metadata returned 403 pending consent. No
staging project or HTTPS hostname has been created or verified.
No production fallback is permitted.

| Check | Status | Evidence / reason |
| --- | --- | --- |
| Trusted operator provisions synthetic staging identities | BLOCKED | Supabase free-project quota prevents creation; Vercel owning-team access awaiting provider consent; no isolated test target |
| Admin login/logout and real JWT validation | BLOCKED | Supabase free-project quota prevents creation; Vercel owning-team access awaiting provider consent; no isolated test target |
| Session refresh, expiry and revocation | BLOCKED | Supabase free-project quota prevents creation; Vercel owning-team access awaiting provider consent; no isolated test target |
| Admin/Editor separation and ordinary/anonymous denial | BLOCKED | Supabase free-project quota prevents creation; Vercel owning-team access awaiting provider consent; no isolated test target |
| Login limits, CSRF and Origin rejection | BLOCKED | Supabase free-project quota prevents creation; Vercel owning-team access awaiting provider consent; no isolated test target |
| TOTP enrollment and identity-checked recovery rehearsal | BLOCKED | Supabase free-project quota prevents creation; Vercel owning-team access awaiting provider consent; no isolated test target |
| MFA enabled only after enrollment/recovery | BLOCKED | Supabase free-project quota prevents creation; Vercel owning-team access awaiting provider consent; no isolated test target |
| AAL2 enforcement at app/RPC/RLS/private Storage boundaries | BLOCKED | Supabase free-project quota prevents creation; Vercel owning-team access awaiting provider consent; no isolated test target |

**NOT RUN:** No hosted Auth account was created, session/token obtained, TOTP
enrolled, recovery performed or provider setting modified. Existing credentials
in production Vercel/Supabase secret stores do not establish staging access here.

Required next inputs: see [staging-environment.md](staging-environment.md).
Statuses are defined in [README.md](README.md); detailed ledger is in evidence.
