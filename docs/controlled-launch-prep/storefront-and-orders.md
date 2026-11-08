# Storefront, authoring, media/import and order flows

**PASS — existing local integration contracts.** Browser is real Chromium against
the optimized Next server; PostgreSQL/RLS, Sharp, parsers, cookies, HTTP and SQL
transactions are real. Broad fixture Auth/Storage/PostgREST HTTP is simulated.
Nine additional groups use actual local GoTrue/PostgREST; they do not cover real
Storage or the entire order flow through hosted services.

| Existing suite | Browser groups / SQL assertions | Coverage |
| --- | --- | --- |
| Phase 3 | 15 / 27 foundation | Login/logout/roles, form validation, Draft save/edit, SEO, explicit review/publish, versions, private previews |
| Phase 4 | 14 / 56 plus foundation | Upload MIME/size/dimensions, responsive variants, galleries/replacement/recovery, private-media contracts, taxonomy/banners/settings, CSV/XLSX mapping/preview/duplicates/blank preservation/price approval/retry |
| Phase 5 | 17 / 49 plus foundation | Ten category/eight brand structures, products/gallery/search/filter/sort/pagination/related, unknown prices/availability, 404/308, withdrawal/cart/wishlist and public-media contracts |
| Phase 6 | 15 / 62 plus foundation | Guest/quote/mixed requests, server snapshots, stale/invalid products, idempotency/concurrency, receipt privacy, Admin status/history, consent/privacy analytics contracts |
| Phase 7 | 10 / dedicated 51 hardening | MFA/worker/nonces/signatures, HTTP cache withdrawal, SEO/keyboard/mobile/visual and lab performance |

Phase 8 out-of-header populated/formula cells remain rejected; source errors survive
SQL preview and cannot create products. Exact task commands/outcomes/timings:
[evidence/test-results.json](evidence/test-results.json).

Approved Homepage/Sanitary artwork, typography, geometry and contacts are unchanged.
Four new captures exactly match Part A raw pixels; all 19 Sanitary assets match #2.
Desktop/mobile screenshots in README contain clearly described synthetic fixtures.
Both WhatsApp links are checked as links only; no message sent.

No products, prices, ratings, reviews, model claims or stock were invented for
production. Samples remain Draft/unverified. Cement/sand/bajri/bricks stay daily-rate
quotation-only. The order feature records requests; it does not take payment,
reserve stock, accept/complete a sale or emit fabricated purchase revenue.
