# Actual local Supabase services

**PASS — real local GoTrue/PostgREST subset. BLOCKED — full official CLI stack and
real Storage HTTP.** No remote project, credentials or production data was used.

## Official CLI attempt

Installed/discovered pinned Supabase CLI **3.0.0** through npm exec; inspected its
`--help`, `init`, `start` and `services` help. Initialized a fresh ignored local
workdir with unique `murad-controlled-*` project ID; no `link`, login, remote DB
flag or provider operation. Disabled migrations/seed auto-run so session guards
would be applied explicitly. Selected only necessary local services.

The official `supabase/postgres:17.11.0.011` image failed layer registration with
**no space left on device** in the 7.9 GiB executor; observation reached 92% used,
about 650 MiB free. A registry retry also returned rate-exceeded. Interrupted only
that disposable startup, then removed its resources. Future helper runs now have
1 GiB free-space and 15-minute bounds. The full stack is **BLOCKED**, not PASS;
no repeated failed image pull is needed to establish the limitation.

## Reduced real-service setup

Using already available images, ran:

| Component | Actual implementation / result |
| --- | --- |
| Database | PASS: pinned PostgreSQL 17 alpine; real SQL/roles/RLS/transactions; not the Supabase PostgreSQL distribution/extensions bundle |
| Auth | PASS: official GoTrue `v2.197.0`; actual migrations/users/JWT/sessions/TOTP |
| API | PASS: official PostgREST `v16.5`; actual token verification and RLS calls |
| HTTP gateway | Local reverse proxy with Docker stdin TCP relay into the private network; no Auth/SQL simulation |
| Storage | BLOCKED: no real HTTP/binary service in this subset; only disclosed SQL schema fixture used to install catalog migrations |
| Realtime/Edge/Studio/SMTP/CDN | NOT RUN: excluded; email delivery is Noop, no provider recovery/email certification |

No container port is published. A unique internal Docker network denies outside
egress; the HTTP gateway binds only `127.0.0.1:55321`, Next only
`127.0.0.1:3200`. No public tunnel or host networking. Independent ephemeral local
secrets/roles use ignored mode-0600 files. Auth signup is disabled; trusted local
operator creates only Admin/Editor/ordinary synthetic users. All per-run containers,
volumes/network and app are cleaned up.

**Nine real-service groups PASS:** ordered migrations/Draft-ID preservation;
trusted identity creation; getUser/refresh/invalid-token and RLS roles; actual
correctly signed expired JWT rejection and signup denial; Draft RPC creation;
Next Admin SSR login/session-cookie boundaries; desktop/mobile Admin captures and
Draft 404; TOTP challenge/AAL2 RPC policy including AAL1 denial; local logout.
See [full results](evidence/real-local-services.json).

Local bootstrap failures were diagnosed and corrected: auth-role search path,
GoTrue ownership of its initial uid helper, and inherited proxy interception of
loopback health checks. JWT-GUC helper initialization occurs after GoTrue migration,
matching base-service responsibility; no JWT verification is bypassed. Direct
health probing is loopback-only; external HTTPS trust/proxy controls are unchanged.
See [setup remediation](evidence/setup-remediation.json).

The existing broad browser suites still use simulated Auth/Storage/PostgREST HTTP
contracts backed by real PostgreSQL. Do not generalize the nine additional real
local groups into real Storage, full provider recovery/revocation or CDN acceptance.
