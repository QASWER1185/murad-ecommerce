# Production release-candidate assessment

**BLOCKED — NOT READY / NOT VALIDATED ON REAL STAGING.** Zero real staging tests
have run. No production deployment, migration, merge or indexing is authorized.

| Gate | Status | Required evidence / owner decision |
| --- | --- | --- |
| Isolated staging and access | BLOCKED | Supabase connected; staging creation failed due to member free-project quota. Resolve eligible quota; Vercel connected but owning-team read is 403 pending provider consent; then verify distinct targets/no customer data |
| Resource budget | BLOCKED | $0 extra charges approved; verify free capacity and bounded non-billable workload/restore capacity |
| Auth/MFA/session security | BLOCKED | Real GoTrue/JWT/refresh/revocation/recovery and AAL2 at app/RPC/RLS/Storage |
| Migrations and compatibility | BLOCKED | Backup, separate restore, reviewed seed history, full guarded staging migration/RLS rehearsal |
| Media/privacy/withdrawal | BLOCKED | Actual Storage/CDN/browser cache withdrawal, private originals and import source denial |
| Import hosting capacity | BLOCKED | Full HTTP XLSX/image RSS/time/body tests; 377–388 MiB earlier parser-only local peak is not hosted capacity |
| Worker operations | BLOCKED | Narrow staging machine identity, nonce/concurrency/retry/leases, alert and withdrawal with worker unavailable |
| Storefront/orders | BLOCKED | Real public views/404/308/quotes/guest privacy/idempotency/concurrency |
| Performance/accessibility | BLOCKED | Hosted LCP/CLS/lab interaction evidence; approved contrast decisions before palette changes |
| Content and business policy | BLOCKED | Genuine images/models/specifications, verified optional prices/stock, retention/shipping/returns/tax decisions |
| Recovery | BLOCKED | Verified DB + binary backups, independent restore and accepted measured recovery/data-loss findings |
| Coordinated release | BLOCKED | Compatible app/DB cutover, reviewed stacked changes, explicit future production authorization |
| Indexing / Google | NOT RUN | Separate future activation after eligibility, canonical/domain/policy review; staging stays noindex |

## Stack, conflicts and future integration sequence

**PASS (source review only):** Part A source commit is present and all 12 migration
files hash-match it. PR #9 was rechecked Draft/unmerged at the same source head.
No earlier branch was merged. Full prior branch/PR source review is retained in
[Part A stacked review](../phase8-part-a/stacked-pr-review.md); that is not a hosted
acceptance test.

Future dependency sequence, after explicit review/authorization, is:
`#3 seo-commerce → #4 admin-dashboard → #5 product-import-media → #6
storefront-integration → #7 orders-analytics → #8 staging-readiness → #9
phase8-preflight → this Part B branch`. Review each PR against its recorded base;
choose either carefully retargeted dependency-order merges or one approved
consolidated release preserving history. Do not let early incomplete stack states
auto-deploy while the compatible final application is not ready. No merge command
has been executed.

Sanitary Draft #2 remains separate. Its seven historical conflict paths are:

- `src/app/brand/[slug]/page.tsx`
- `src/app/product/[slug]/page.tsx`
- `src/components/home/ReferenceStorefront.tsx`
- `src/components/sanitary/SanitaryShop.module.css`
- `src/components/sanitary/catalog-options.ts`
- `src/components/sanitary/shop-state.ts`
- `vercel.json`

Recommend retiring #2 **only after owner confirmation** that selectively integrated
visual components/assets satisfy its accepted scope. Blind merging risks restoring
obsolete raw-table/catalog behavior. No PR is closed or conflict resolved here.

## Proposed cutover and incident boundary — NOT RUN

Do not place restrictive migrations underneath legacy main storefront queries.
Before any future release, test the compatible final application and database
sequence in isolated staging, including backup/restore and maintenance admission
if required. Revalidate fresh-public-request withdrawal independent of the worker.
Only then propose an exact production change window, staged flags, per-session
cutover acknowledgement and operator-owned go/no-go checklist for approval.

On failed smoke/privacy checks: stop rollout, close new order/public-media gates,
withdraw affected publication via trusted controls, retain incident evidence and
use the already rehearsed compatible app/DB/binary recovery path. Do not restore
legacy public queries against restricted schema or relax RLS. Schema recovery and
object recovery must be coordinated; no blanket destructive down-migration is
promised. No production rollback or restoration has been attempted.
