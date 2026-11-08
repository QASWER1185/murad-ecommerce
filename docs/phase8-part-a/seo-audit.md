# Technical SEO readiness

Production indexing remains hard-disabled. No Google account, Search Console,
Business Profile, Merchant Center, hosted robots endpoint or sitemap submission
was accessed. The audit covers code, pure eligibility tests and local HTTP output.

| Surface | Verified architecture / local checks | Remaining release decision |
| --- | --- | --- |
| Home | Business/Lahore title/description, trusted canonical, H1, internal category/brand links, verified Store JSON-LD and Open Graph | Explicit homepage indexing policy; final canonical domain and sharing image |
| Category/brand | Reusable crawlable SSR templates, route-specific editable metadata, H1/breadcrumbs, approved public content | Genuine useful collection copy and final content approvals |
| Products | Stable clean slug, manufacturer/SKU/model/specs when supplied, optional price and verified stock, related public links | Real photos/models/descriptions/prices/stock supplied and explicitly reviewed through Admin |
| Canonical/duplicates | Valid trusted-origin canonical; filters/search/query-bearing and page>1 noindex, canonical collection base | Review conservative pagination policy against actual catalog size before indexing |
| Structured data | BreadcrumbList; Store with supplied address/phones; Product/Offer share indexing policy; missing price/unknown stock/quotation behavior tested | Real supporting data plus separately authorized external validation; no invented GTIN/MPN/reviews/ratings/offers |
| Sitemap/robots | Shared eligible-route policy; empty sitemap and `Disallow: /` locally while release gate is closed | Separate indexing release approval; split sitemap before exceeding 50,000 routes |
| 404/308 | Missing/private/out-of-range routes have real 404; slug history redirects only to currently public destinations | Repeat through actual staging origin/CDN |
| Images | Supplied alt, dimensions, responsive verified derivatives; private originals; lossless approved static companions | Managed images currently noindex; review image indexing headers alongside approved page/media release |
| Merchant readiness | Testable missing-data/policy report, no live feed and no quotation-only fixed offer | Owner commercial/shipping/returns/tax/identifier decisions and actual eligible feed/account authorization |
| Admin/search/requests | Noindex/private routes; no customer/order/draft data in sitemap or public SEO | Keep exclusions after any future release |

Local tests verify title/canonical/H1/robots and parse emitted JSON-LD.
Eligibility checks approval/completeness, not semantic originality: real catalog
metadata uniqueness and useful genuine descriptions still require owner/content
review after actual inventory is supplied. No mass content is auto-generated. Positive
Product/Offer cases are synthetic pure-policy tests; live eligible markup is not
enabled. This is not Google Rich Results validation or an indexing/ranking claim.

The approved business details remain M Murad Sons Building Material Store,
Adda Plot, Al Kabir Town, Raiwind Road, Lahore, Pakistan; main WhatsApp
0321-7165000 and secondary 0308-6235608. Current copy/links/schema agree with the
supplied details. Some approved reference copy remains fixed; any future CMS
address/number change needs a full NAP/display/schema consistency check.

See [Phase 7 SEO and owner checklist](../phase7/seo-and-google.md) for account,
DNS, structured-data, GA4 manual-only and indexing-release prerequisites. Part A
does not enable them or invent verification/measurement IDs. Owner Google access
is a future prerequisite, not a request to provide credentials now.
