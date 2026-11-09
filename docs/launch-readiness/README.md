# Direct release: Catalog + WhatsApp only

Owner decision: existing Supabase `ddgjspvdgjpbysylntji`; no staging database.
**GO for release review; NO-GO for production execution before final approval and
verified recovery/content gates.** No production changes have been executed.

## Ready

- Product-specific WhatsApp enquiries, optional verified prices and general contact.
- Production cart/wishlist, checkout, payments and order intake are disabled. An
  environment opt-in cannot enable production shopping. Cart API returns 404;
  order APIs stay unavailable. There is no payment integration.
- Approved artwork, navy/white/gold branding, hero and original card geometry remain.
  Shopping action positions become WhatsApp contacts; inquiry-only mobile cards
  retain the original 236px height.
- Node 26.13.0 build, TypeScript, lint and five NEW profile groups pass; four hero
  comparisons are pixel-identical. Completed commerce suites were not repeated.
  [Results](results.json); screenshots contain synthetic local records only.
- [Production read-only evidence](production-readonly.json): READY at `c73b01b`;
  six legacy products with stored prices, zero image references, no verification
  columns, zero Storage buckets. Stored prices are not verified prices.
- A previously authorized, database-disconnected Vercel preview at `5e54bd8`
  reached READY/HTTP 200. It is not the final inquiry-only release. No further
  preview or production deployment is authorized under the latest owner decision.

## Inventory approval

Use [inventory-approval.csv](inventory-approval.csv) as a review ledger, not an import.

| Classification | Publication rule |
| --- | --- |
| VERIFIED_FOR_LAUNCH | Owner names approved genuine SKUs/identity/description/category/brand; available model/specifications and image rights have evidence. Display price/stock only with dated verification. Explicitly approve missing imagery with indexing off if needed. |
| NEEDS_VERIFICATION | Keep Draft. None of the six legacy products/prices is certified as genuine inventory by this work. |
| SYNTHETIC_DEMO | Local test fixtures/screenshots only; never publish as commercial inventory. |

Name approved SKUs, or explicitly approve an initial enquiry shell with no published
products. No sample is automatically marked verified/published.

## Minimum compatible migration/RLS bundle

Exactly ten pending files, after installed `20261106055003` / `20261106064811`.
[Full filenames, order and hashes](migrations.json):

| Order | Version | Purpose |
| --- | --- | --- |
| 1 | 20261108000100 | Foundation: Draft defaults, private roles/Storage, replace unrestricted raw reads and revoke excessive grants including TRUNCATE |
| 2 | 20261108000200 | Explicit review/publication, versions/revisions |
| 3 | 20261108000300 | Validated Admin operations/throttling |
| 4 | 20261108000400 | Immutable media/galleries |
| 5 | 20261108000500 | Category/brand/content/settings |
| 6 | 20261108000600 | Private import contracts |
| 7 | 20261108000700 | Public catalog projections/RPCs, legacy daily-rate safeguard |
| 8 | 20261108000800 | Private request contracts; no gateway keys/intake activated |
| 9 | 20261108000900 | MFA/authorization and narrow-worker hardening |
| 10 | 20261108001000 | Scoped catalog query configuration |

This is the smallest already-integrated reviewed bundle for this branch: hardened
public projections have dependencies across it. Removing files creates a new
unreviewed migration/security path. Unused Admin/import/order/worker features stay
closed. No eleventh file or legacy seed replay. Each applying connection requires
`app.catalog_cutover_approved='yes'`. Migration 00700 has the reviewed quotation fix.

## Minimum backup / restore gate: NOT performed

Back up only the named e-commerce project's three existing catalog tables with
schema/data/IDs, indexes/constraints/grants/RLS, required role/extension metadata,
migration ledger and affected Storage bucket/policy metadata. Current bucket
inventory is empty; if changed, stop and review binary-archive scope. Exclude Auth
users/passwords/sessions, Vault secrets, provider keys and unrelated projects.

Owner names a trusted operator, encrypted private destination and isolated recovery
host/volume; keys remain separate. No public artifacts. Restore and compare counts,
IDs, schema, permissions and checksums; record snapshot time/duration/acceptance.
This verifies scoped catalog recovery, not whole-project Auth recovery. Actual
backup inventory and isolated restore remain UNVERIFIED; Free plan does not prove
a usable downloadable daily backup. No export or restoration is authorized yet.

## Exact production execution plan: awaits one explicit owner approval

1. Approve the final commit/tree, migration hashes, SKU ledger (or explicitly empty
   catalog), encrypted recovery destination/operator, transition window and abort owner.
2. After explicit export/restore approval, obtain and verify that recovery set.
   STOP on failed recovery or unexpected source/schema/history drift.
3. Apply the [proposed configuration](../../ops/production/catalog-inquiry.environment.example)
   with `CATALOG_ENABLED=false`; preserve legacy public variables. Securely bind an
   anonymous/publishable catalog key, never service_role. No values belong in chat.
4. With explicit merge/deployment approval, deploy the compatible enquiry shell
   FIRST. Disabled catalog makes no DB reads during transition. Verify exact live
   code, contact links and absence of cart/order/payment intake.
5. With explicit DB/RLS approval, apply the ten hashes in order; never replay the
   installed schema/seed. Stop on failure. Verify anonymous raw denial and retained
   unverified Drafts; approve only owner-selected genuine records through workflow.
6. Set `CATALOG_ENABLED=true`, redeploy the SAME reviewed code, and smoke published/
   hidden/404 boundaries, prices, daily-rate enquiries, both contacts and mobile.
   Keep Admin, media, orders, workers, analytics and indexing off. Reopen after PASS.

Abort to the compatible enquiry shell with catalog disabled. A Git-only rollback
to the old raw-table app after RLS changes is unsafe. Any necessary DB restore
uses only the explicitly approved procedure; preserve/reconcile post-snapshot
writes. No destructive down migration or unmeasured recovery-time promise.

[Desktop](screenshots/home-desktop.png) · [Mobile](screenshots/home-mobile.png) ·
[Product](screenshots/product-mobile.png) · [Materials](screenshots/materials-mobile.png).
Final inquiry-only code is not deployed; no ERP/Google Cloud work was performed.
