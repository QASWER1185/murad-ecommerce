# Owner Google setup and Phase 6 SEO/analytics verification

No Google account/property was created, no verification token was invented, no sitemap was submitted, and production indexing remains disabled.

## GA4 owner checklist

1. In the owner's Google account, select/create the actual business GA4 property and web data stream for the verified canonical domain. Copy its real Measurement ID into the hosting environment, not a source file or chat message.
2. Before enabling the integration, disable Enhanced Measurement automatic page views/history changes, site search, form interaction and automatic outbound/form collection in that data stream. This implementation emits manual events only; it must not be combined with an unreviewed GTM container, auto form tracker, Ads/user-ID enrichment or another duplicate GA snippet.
3. Review privacy choices and lawful deployment requirements for the store. Keep analytics optional. Honor DNT/GPC, verify consent withdrawal and disable Google Signals/advertising personalization. No product enquiry should depend on analytics consent.
4. In an explicitly authorized **staging** environment, configure:

```dotenv
ANALYTICS_ENABLED=true
GA4_MEASUREMENT_ID=<actual-owner-measurement-id>
GA4_MANUAL_EVENTS_ONLY_CONFIRMED=true
```

The confirmation flag records that the manual-only configuration was reviewed. Without it (or without a valid ID), no script loads. Production is hard-disabled in code, even if flags are set. Do not use the test suite's mock ID as a real property.
5. Inspect browser network requests and GA DebugView with test products/contact fixtures. Confirm no name, phone, note, address, request reference, raw search text, admin path, query/hash or referrer is transmitted. Script requests use no-referrer and event `page_location` uses a path template such as `/product/[slug]`, with a fixed title and empty referrer.
6. Confirm exactly one implementation emits these manual events. Configure `order_request_submitted` and, if useful, `quotation_request` as **lead/request** key events. Never rename them to purchase or attach invented revenue. No actual purchase event is implemented.
7. Retest denied consent, withdrawal, GPC/DNT, admin navigation and provider/script failure before considering production approval. Provider delivery and property settings cannot be certified by the local script stub.

| User action | Event | Allowed facts |
| --- | --- | --- |
| Public product view | `view_item` | Public product UUID |
| Select product link | `select_item` | Public product UUID |
| Shared cart addition/increase | `add_to_cart` | UUID, quantity delta |
| Shared cart removal/decrease | `remove_from_cart` | UUID, quantity delta |
| Review a new request | `begin_order_request` | Item count |
| Server acknowledges persisted request | `order_request_submitted` | Item count; deduplicated per browser-tab intent |
| Persist quotation/mixed request | `quotation_request` | Item count |
| Open actual WhatsApp contact | `whatsapp_click` | Main/secondary/other classification |
| Perform site search | `search` | Result count, query-length bucket; no search term |

Only this closed event/parameter whitelist is accepted by application tracking. Pre-consent events are discarded rather than buffered. Consent storage and sent-intent markers contain no customer fields. Receipt recovery is not a purchase. Provider/network blockers may suppress optional analytics without blocking an order request; request persistence is the authoritative business record.

## Search Console owner checklist

- Confirm the actual canonical HTTPS domain and redirect behavior before entering `CATALOG_SITE_ORIGIN`. Use a domain property/DNS verification when possible. The owner must complete domain verification; no fake meta token exists here.
- Keep production page/media/indexing gates off while testing. Current robots disallows crawling, all eligible page metadata stays noindex and the sitemap is intentionally empty. Admin, private order APIs, receipt recovery, drafts, unfinished content and search/filter pages remain excluded.
- In authorized staging, verify server-rendered product content, real HTTP 404 for private/missing routes, public-only 308 history, canonical URLs, breadcrumbs, internal links, publication withdrawal and mobile usability. Revalidate the complete Phase 5 SEO regression suite.
- Supply genuine descriptions, metadata, permanent slugs, alt text and verified media through Admin before reviewing indexability. Product/Offer markup must use actual supporting values; no ratings/reviews or fictitious availability/offer values are generated.
- After separate production indexing approval, change the release gate through a reviewed PR, verify robots and sitemap eligibility against the same policy, and validate actual structured data with Google Rich Results Test/Schema tools. Only then submit the eligible sitemap and inspect representative public URLs in Search Console.
- Confirm the final production home/directory indexing policy, pagination strategy and verification configuration during the release review; this phase does not silently enable them. Never submit private receipt/customer/order URLs.

No rankings, indexing schedule, rich result, delivery or sales outcome is guaranteed. Real catalog quality and eligibility remain the basis for future indexing.
