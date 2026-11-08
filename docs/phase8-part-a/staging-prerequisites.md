# Future Part B prerequisites — preparation only

Part A grants no permission to create/access a real Supabase project, host,
Google property, account, key or scheduler. Do not provide real credentials in
chat, Git, PRs or these files. The existing template remains placeholder-only:
[ops/staging/environment.example](../../ops/staging/environment.example).

| Configuration names | Future requirement |
| --- | --- |
| `STAGING_PROJECT_REF`, `PRODUCTION_PROJECT_REF`, `PRODUCTION_SITE_ORIGIN` | Explicit separate project identity and production deny targets; operator verifies console/DNS/aliases independently |
| `ADMIN_ENABLED`, `ADMIN_ENVIRONMENT`, `ADMIN_SITE_ORIGIN`, `ADMIN_SUPABASE_URL`, `ADMIN_SUPABASE_PUBLISHABLE_KEY`, `ADMIN_RATE_LIMIT_SECRET` | Isolated staging-only HTTPS/anonymous-key configuration, approved operator provisioning and private shared-throttle secret |
| `CATALOG_ENABLED`, `CATALOG_ENVIRONMENT`, `CATALOG_SITE_ORIGIN`, `CATALOG_SUPABASE_URL`, `CATALOG_SUPABASE_PUBLISHABLE_KEY`, `CATALOG_MEDIA_ENABLED` | Same isolated project/origin and anonymous public-view client; actual media access only after explicit staging permission |
| `CATALOG_INDEXING_ENABLED` | Keep false; production release constant remains false |
| `CATALOG_WORKER_ENABLED`, `CATALOG_WORKER_ENVIRONMENT`, `CATALOG_WORKER_SITE_ORIGIN`, `CATALOG_WORKER_SUPABASE_URL`, `CATALOG_WORKER_PUBLISHABLE_KEY`, `CATALOG_WORKER_KEY_ID`, `CATALOG_WORKER_SECRET` | Separately authorized narrow machine key and independent schedule; no human cookie/service-role browser key |
| `ORDER_REQUESTS_ENABLED`, `ORDER_GATEWAY_KEY_ID`, `ORDER_GATEWAY_SECRET` | Separate private signed order capability, approved test contacts/data only |
| `ORDER_TRUSTED_IP_SOURCE` | `none` until actual overwritten-header/proxy contract is verified. `vercel` additionally depends on the platform-supplied `VERCEL=1`; never trust arbitrary forwarded IP headers |
| `ANALYTICS_ENABLED`, `GA4_MANUAL_EVENTS_ONLY_CONFIRMED`, `GA4_MEASUREMENT_ID` | Keep analytics off and ID unset here; owner real property/manual-only approval is separate |
| Legacy `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Not the active catalog/Admin configuration. Local build supplies only loopback/dummy overrides; never put a privileged key in `NEXT_PUBLIC_*` |

The offline check normalizes origins, verifies separate declared project references,
anonymous key shape, independent secret shape, enabled signing-key identifiers,
noindex/analytics-disabled settings and development deployment gates. It does not
connect to a service, test credentials or prove ownership. Placeholders must fail
runtime validation until the owner separately approves/configures Part B.

Before Part B, obtain specific approval for:

1. A dedicated isolated Supabase project and staging HTTPS hostname, with secure
   time-bounded operator access. No customer data or production account copying.
2. Full migration/backup/restore rehearsal on that target, after actual schema,
   grants, extensions and provider Auth/Storage ownership are inspected.
3. Trusted synthetic Admin, read-only Editor and ordinary test-account provisioning;
   verified TOTP enrollment, identity-checked recovery, absolute/inactivity session
   settings, JWT/refresh revocation tests and provider anti-abuse decisions.
4. Private `catalog-private` and `catalog-imports` Storage checks, immutable original/
   derivative/import-source recovery, anonymous denial and publication withdrawal
   around actual Storage/CDN delivery. Never expose service-role credentials.
5. Private worker/order signing-key provisioning and rotation, staging-only schedule,
   bounded throughput/concurrency and independently delivered missed-run/backlog
   alerts. Templates are not installed jobs or operational monitoring.
6. Actual hosting request/body/memory/duration/concurrency limits and an approved
   load-test budget. Next's 12 MiB proxy setting does not establish provider limits;
   current handlers allow 10 MiB images/8 MiB imports and imports request 120 s.
   Direct parser RSS already consumes substantial memory. Select a compatible
   runtime or separately review private direct-upload/processing architecture;
   do not weaken validation or silently reduce requirements to fit an unknown host.
7. Independently verified encrypted DB/ACL/role and separate private binary backups,
   restore ownership, measured recovery objectives, log-sink permissions, incident
   responsibility and approved customer-request retention/erasure policy.
8. Genuine manufacturer images/models/descriptions/specifications and verified
   prices/stock through Admin later; approved commercial policies. Keep sample
   inventory Draft and daily-rate building materials quotation-only.
9. Owner Google/DNS/GA4/GBP/Merchant prerequisites only when separately authorized.
   No ID/token is invented here; no sitemap submission or indexing activation.

Use [Phase 7 real-service acceptance matrix](../phase7/staging-runbook.md) for the
future tests. Part B should document actual outcomes and skipped cases separately
from these local contracts. Any production merge, migration, deployment, public
feature activation or indexing still requires its own subsequent authorization.
