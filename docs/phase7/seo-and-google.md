# SEO quality and Google release preparation

Production indexing stays disabled in code. No Google account, property,
verification token, feed or sitemap submission has been configured. Current
noindex/empty-sitemap results are intentional safety behavior, not an indexing
failure. Local synthetic eligible fixtures test policy/structured-data logic;
they are not store inventory or data intended for Google.

## Architecture audit

| Surface | Current rule / Phase 7 review |
| --- | --- |
| Homepage | Genuine Lahore business title/description, canonical trusted origin, descriptive H1, internal category/brand links, verified public settings → Store JSON-LD; richer Open Graph description/type/locale added; intentional noindex until explicit home policy approval |
| Category / brand | Anonymous approved public snapshot; unique editable title/description and stable clean slug; canonical base route; H1, BreadcrumbList, published links and bounded GET pagination; thin/unapproved taxonomy noindex |
| Products | Server-rendered name, useful description/specifications, manufacturer/model/SKU only if supplied, approved derivatives/alt; optional price and stock; Draft/private/missing → HTTP 404; approved permanent rename → 308 only while target is public |
| Filters / search / pagination | GET links crawlable; search always noindex; any filter/sort/extra query or page >1 noindex with category/brand canonical pointing to base collection; unfiltered page 1 canonical is self-referencing. This deliberately conservative pagination policy is unchanged; review crawl coverage for large real catalogs before indexing |
| Product / Offer | Pure helper now uses the same publication/indexing policy; Product may describe genuinely eligible unpriced content without inventing an Offer. Offer requires a real projected positive verified price, online mode, valid currency and matching eligible product route; unknown stock adds no availability. Query-bearing product pages pass their noindex context into schema generation. No rating/review/discount/warranty/GTIN invented |
| Store / local business | Verified public business name/address/phones only; no invented hours, postal code, coordinates, review count or social ownership. Store is a LocalBusiness subtype. Address and both WhatsApp contacts remain those supplied by the owner |
| BreadcrumbList | Absolute trusted-origin URLs and ordered visible hierarchy; no private references |
| Sitemap / robots | Shared `isIndexable` eligibility; only approved current canonical routes could enter sitemap, never filters/drafts. Disabled production gate gives empty sitemap and `Disallow: /`. Existing single-sitemap cap is 50,000 routes; split into sitemap index/chunks before exceeding that size |
| Public image delivery | Approved current WebP derivatives with responsive widths, dimensions and supplied alt text; originals/history private, withdrawal checked around fetch, optimizer bypass blocked. Current media `X-Robots-Tag: noindex` is intentional: review media indexing headers together with page/indexing release before Google Images/Merchant activation |
| Admin / requests | Noindex/noarchive private routes, role checks, no order/customer/receipt data in SEO metadata or sitemap |
| Open Graph | Collection/product title/description/canonical URL from approved public projection; homepage now includes description/type/locale. No made-up OG product photo: owner-approved public imagery and final sharing policy still needed |

Managed derivative URLs use opaque media IDs for authorization-safe immutable
version identity. Original descriptive filenames/metadata and verified alt text
remain editable via Admin; filenames do not substitute for meaningful alt text.
The approved reference pixels are unchanged. Three lossless WebP companions and
viewport-aware hero preloads reduce transfer bytes while keeping the PNG originals;
raw RGBA equality and desktop/mobile screenshot comparison verify preservation. Homepage's existing WhatsApp button
now routes to the verified main contact; existing secondary links use public CMS
settings. This changes contact destinations without altering approved geometry.

## Merchant Center readiness

`merchantReadiness` is a testable gap report, **not a generated feed or approval**.
It checks indexing approval, verified online price/currency/mode, availability,
approved image/alt, unique identifier/description and manufacturer identifier
review. Final owner shipping/return/tax/merchant-policy review always remains
explicit. No `identifier_exists=false`, GTIN/MPN, shipping price, return period or
availability is guessed. Quotation-only cement/sand/bajri/bricks are not offered
as fixed-price merchant items. A real feed should be implemented/released only
for verified eligible products after account/domain/policy approval; it must use
the same current public projection and withdrawal rules and avoid cached private
original URLs.

## Owner actions for Phase 8 — not executed

1. Authorize isolated staging access and real-service testing first. Review the
   recorded canonical/noindex/404/308/SSR/Breadcrumb behavior and any outstanding
   accessibility/performance findings before considering production.
2. Supply/confirm the final canonical HTTPS domain, DNS ownership and business
   profile ownership. Owner verifies the actual Search Console domain property
   via DNS; do not paste a fake verification token or grant broad Google access.
3. Upload original authorized images and useful individual descriptions/models/
   specifications through Admin; verify real optional prices/availability and
   appropriate publication/indexing approval. No sample record is auto-promoted.
4. Approve homepage/directory indexing policy, large-catalog pagination strategy,
   image indexing headers, public media release, final business/policy pages and
   sitemap inventory. Review a separate production release-gate code change.
5. After explicit indexing approval and deployment authorization, validate real
   URLs in Google Rich Results Test/Schema validator, inspect canonicals and
   robots on the deployed origin, then submit only the eligible sitemap in Search
   Console. Inspect representative category/brand/product URLs and exclusion
   reports. Do not submit Admin/search/filter/customer/draft pages.
6. Owner selects their actual GA4 property/web stream and Measurement ID, disables
   Enhanced Measurement automatic page/history/search/form/outbound collection,
   advertising/Signals/User-ID enrichment and duplicate tag implementations.
   Follow [the Phase 6 event/consent checklist](../phase6/google-and-analytics.md).
   A separate analytics code-release gate and explicit property configuration
   approval are required. No real ID is supplied by this work.
7. In approved staging with the owner's property authorization, inspect DebugView
   and network payloads: consent required; DNT/GPC and withdrawal honored; fixed
   page templates, no query/referrer/customer name/phone/note/reference/raw search;
   only whitelisted manual events. `order_request_submitted` is a persisted lead
   request, never a paid purchase or revenue. Receipt retries don't duplicate it.
8. Owner links the real Google Business Profile and Merchant Center/domain only
   when account access, genuine products, verified identifiers and commercial
   shipping/returns policies are approved. Independently verify feed diagnostics.

Local browser tests stub Google transport. They verify event construction/privacy,
not actual delivery, property settings, consent-law compliance or Google approval.
There is no ranking, indexing-time, rich-result or sales guarantee.
