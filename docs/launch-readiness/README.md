# WhatsApp storefront launch checklist

Development branch: `development/whatsapp-launch-readiness`, based on
`development/controlled-launch-prep` (`f4deb663`). No production changes approved.

## Completed

- Product-specific WhatsApp links on homepage, category/brand/search cards,
  product details and wishlist; name, available SKU and absolute product URL.
- Published business contacts are used, with the existing verified main/secondary
  fallbacks. Pakistani local-format numbers normalize to working `wa.me` links.
- General floating WhatsApp contact across storefront pages and error/privacy pages.
- Priced online products retain cart/shopping. Missing prices stay enquiry-only.
- Building Materials and descendants are quotation-only, even when a legacy
  category's new sales-mode field defaults to online. Public prices, cart/order
  snapshots and structured data use the same database projection.
- Approved navy/white/gold assets, header and hero preserved. Desktop inquiry fits
  the existing homepage card space; mobile cards grow 20px for the 44px inquiry.
- Ten pending migrations reviewed/prepared in [exact order and hashes](migrations.json).
  Migration `20261108000700` is revised for the legacy quotation safeguard and
  needs review with these new hashes. No additional migration or seed is introduced.
- Source RLS fixes revoke anonymous raw-table/TRUNCATE access, protect Drafts and
  private media, and prevent role self-assignment. Local tests verify these rules;
  production RLS remains unchanged pending explicit approval.

Validation results and limits: [results.json](results.json).
Screenshots use clearly synthetic local records, never commercial inventory.

| Desktop | Mobile |
| --- | --- |
| [Homepage](screenshots/home-desktop.png) | [Homepage](screenshots/home-mobile.png), [Sanitary](screenshots/sanitary-mobile.png) |
| | [Product](screenshots/product-mobile.png), [Building Materials](screenshots/materials-mobile.png) |

Node 26.13.0: build, TypeScript, eight policy tests, eight focused launch groups,
17 storefront browser groups, 49 catalog SQL assertions and legacy sample
preservation pass. Lint: zero errors, eight pre-existing unused-variable warnings.
Eight desktop/mobile header/hero comparisons are pixel-identical to the pre-change
build. WhatsApp popup requests were intercepted; no real message was sent.
Re-run the focused local test with `npm run test:launch:whatsapp` after `npm run build`.
It requires the existing local Docker PostgreSQL image and Chromium. Optional
`--baseline` captures the currently built app before a change; without prior captures,
the report explicitly marks pixel comparison unavailable rather than certifying it.

## Critical blockers / owner actions

- **Inventory:** provide/review original photographs, models, descriptions, prices
  and stock verification in Admin. Existing sample records remain unverified Drafts.
  No manufacturer authenticity or commercial prices were verified by local tests.
- **Hosted acceptance:** provide a separate authorized non-production target for
  real Supabase Auth/Storage/CDN acceptance. The passing tests use networkless
  PostgreSQL and local HTTP fixtures, not a hosted staging deployment.
- **Recovery:** separately authorize a narrowly scoped e-commerce backup and an
  encrypted private isolated restore rehearsal. Neither is performed/approved here.
- **Production activation:** review the exact release commit, migration hashes,
  e-commerce maintenance window, runtime/configuration and required feature gates.
  Admin/order intake, media and indexing gates retain their existing restrictions;
  environment variables alone must not bypass them. Analytics/indexing can stay off.
- **Separate approvals:** production migrations/RLS changes, main merge and Vercel
  deployment each require explicit owner approval. No ERP/Google Cloud work is part
  of this launch change. New-branch Git deployments are disabled in `vercel.json`.

## Exact go-live sequence — proposed, not executed

1. Review the complete stacked candidate plus this change; accept verified inventory
   and hosted acceptance evidence. Approve the production feature-gate changes
   necessary for the chosen public catalog/media launch; keep other features closed.
2. After separate recovery approval, obtain and verify the approved e-commerce-only
   DB/configuration backup and any Storage file archive on an isolated target.
3. Approve an e-commerce maintenance window and stop writes/request intake. Preserve
   existing IDs/data; install no private Drafts under the old public SELECT policies.
4. With explicit migration/RLS approval, reconcile the two installed migrations and
   apply the ten files in `migrations.json` order. Each applying connection must set
   `app.catalog_cutover_approved='yes'`. Never replay the initial schema/seed. Stop on
   a failed transaction or unexpected drift; do not weaken permissions.
5. With separate merge/deployment approval, release the compatible reviewed app and
   approved production configuration. Do not run the legacy raw-table storefront
   against the restricted schema. Keep maintenance until smoke tests pass.
6. Check published/draft/404 boundaries, verified media withdrawal, Admin denial,
   real prices/cart, quotation-only materials and both WhatsApp contacts on mobile
   and desktop. Opening WhatsApp is not a confirmed order/payment. Then reopen.

## Abort / rollback

Keep e-commerce maintenance enabled on failed privacy, schema, media or shopping
checks. Before migration starts, abort without changing the DB. After schema
changes, use the approved compatible app and verified DB/Storage recovery procedure;
a Git-only rollback to the legacy storefront is unsafe. Production restoration
requires its own explicit approval. Preserve evidence and reconcile writes after
the backup cut point; no unmeasured recovery-time/data-loss promise is made.

The existing [detailed cutover procedure](../controlled-launch-prep/production-cutover-runbook.md)
remains supporting material. Its historical unknowns are not a request to restart
ERP investigations. Focus next on inventory, hosted acceptance and owner approvals.
