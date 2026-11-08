# Phase 6 security, schema impact and request contracts

## Configuration and deployment boundary

Order submission is disabled by default and hard-disabled for `CATALOG_ENVIRONMENT=production`. It has no fallback to legacy production or Admin connection settings. An isolated local example is:

```dotenv
ORDER_REQUESTS_ENABLED=true
ORDER_GATEWAY_KEY_ID=<local-key-id>
ORDER_GATEWAY_SECRET=<64-or-more-random-hex-characters>
```

The existing `CATALOG_*` configuration supplies a loopback anonymous client/origin. A separately authorized operator must create the corresponding **private** `app_private.order_gateway_keys` entry with the same ID, secret and exact origin. The migration inserts **no key**. Tests generate an ephemeral random key only inside their disposable, networkless local PostgreSQL database. No real account is provisioned.

Never put the signing secret in `NEXT_PUBLIC_*`, browser code, source-controlled env files or request logs. Administrators/editors have no SELECT/INSERT/UPDATE privilege on the key table and cannot self-provision it. Use a secret manager and a trusted operator for future staging/production setup. Rotation requires coordinated private DB/environment updates and an overlap/incident plan; disabling a key immediately prevents new proofs with that key. Old signed guest capabilities may expire on rotation; retain the owner's existing request records and provide customer follow-up through the store.

## Trust boundaries

1. The browser submits IDs, quantities, opaque preview tokens, minimal contact information, request intent and an idempotency UUID. Unknown price/total/shipping/tax/payment fields are rejected.
2. The application validates the trusted Origin, signed HttpOnly/Strict guest cookie, session-bound CSRF token, form challenge, honeypot and bounded body. Local HTTP is loopback only; staging requires HTTPS/Secure cookies.
3. The application normalizes/validates contact information and signs a short-lived envelope with domain separation for session/contact/IP hashes. SQL verifies the HMAC with a private key and checks origin and timestamp before performing any write. No service-role client or raw anonymous order INSERT exists.
4. The database revalidates the request independently and acquires shared locks on involved categories/ancestors, brands and products in stable order. It reads permitted public projections after those locks, rejects withdrawal/out-of-stock/stale preview tokens, and stores only server-calculated price facts. A concurrent catalog withdrawal must finish before a blocked request can recheck it; the local suite exercises this with overlapping real transactions.
5. Request/items/history tables are admin-only under RLS. Authenticated Editors/ordinary users receive no customer rows, anonymous raw reads are denied, and all direct browser writes remain revoked. Only explicit admin RPCs can update state. There is no public registration, role-assignment, customer-detail or request-list endpoint.

The signed gateway is an application capability, not proof of a human's identity or phone ownership. No phone verification claim is made. A database owner/service role remains a trusted operator outside browser RLS; protect provider IAM, keys and backups accordingly.

## Idempotency and snapshots

The intent UUID is globally unique and receipt access is bound to its original guest capability. An advisory transaction lock serializes duplicate attempts. Reusing a known intent under another/expired guest capability cannot create a second request or reveal its receipt. The canonical payload hash binds the intent, normalized customer fields and sorted selections. Same guest/key/payload returns the original minimal receipt before rechecking a later catalog change; different details with the same key produce a conflict. Concurrent retries create one request, one set of items and one initial history event.

Only the intent UUID and event-deduplication marker can be stored in browser-tab storage; customer fields are never persisted to browser storage. Lost acknowledgements can recover the reference using the same signed guest session and intent key. Other guests cannot recover that receipt from a copied key. An expired/rotated guest cookie cannot recover an old receipt and cannot silently reuse its intent to create a second request. Cleared tab storage or a deliberately new intent is not global person-level deduplication; preserve references and contact the store if uncertain before starting another request.

Snapshots store version 1 schema, catalog product version, published title/slug/SKU/model, availability, verification timestamps, quantity, currency and permitted unit/line prices. Price and subtotal come only from the database, never the client. Gallery/price/specification edits to the catalog do not rewrite submitted snapshots. All items commit atomically; selection errors roll back the request/items/history while preserving rate accounting.

Quotation/unpriced items have `unit_price=NULL` and `line_subtotal=NULL`. Mixed requests group only known subtotals by currency. No zero or invented quotation total, shipping charge, tax, delivery promise, payment method or stock reservation is calculated. An explicitly out-of-stock item cannot create a persistent request; direct WhatsApp availability enquiry remains available.

## Status, history and customer privacy

Only administrators can read the private list/detail/history and mutate status. Updates require the expected version and explicit confirmation. First review transitions from `received` to `in_review` (or cancellation); quotation status requires a quotation/mixed request. Terminal `closed`/`cancelled` requests cannot reopen. Every transition appends a versioned history entry and PII-free audit metadata. None of these statuses creates a purchase, payment, reservation or fulfilled order.

The list displays only needed customer identity; contact/notes are in the protected detail view. Customer searches use POST JSON, not query-string URLs. Public acknowledgements expose only reference/kind/receipt time and do not expose contacts, snapshots, current admin activity or status history. Request routes are no-store/noindex/nofollow/noarchive. Existing Admin noindex/strict session headers remain in force. Root referrer policy prevents request/search URLs from becoming third-party referrers.

Application operational events contain only a fixed code, a route template and status. Raw Error.message/stack, request bodies, headers, phone, name, note, URL query, order/reference ID and IP are excluded. Provider/hosting/PostgREST statement/body logging must also be audited in authorized staging; safe application logging alone cannot certify external infrastructure logs.

## Spam controls and limits

| Boundary | Limit |
| --- | --- |
| JSON submission | 32 KiB application body; SQL signed envelope 64 KiB |
| Product selection | 1–50 unique UUIDs; integer quantity 1–999 |
| Customer name / note | 2–100 characters / optional 500 characters |
| Contact | Normalized E.164; Pakistan local mobile formatting supported |
| Signed guest cookie | HttpOnly, SameSite Strict, host-only, scoped to request API; 24 hours |
| Form challenge | Session-bound; minimum 2 seconds, maximum 30 minutes |
| DB proof | Exact origin; signed timestamp within 120 seconds |
| Rate windows | 5/session/15min; 5/contact/hour; global 100/minute; optional trusted IP 20/15min |
| Admin list | 25 rows/page; search ≤100 characters; bounded page numbers |
| Status/history notes | 500 characters; immutable request/customer snapshots |

Rate keys are HMACs; raw phones/IPs are not stored in limiter tables. Client-supplied forwarded IP headers are ignored by default. `ORDER_TRUSTED_IP_SOURCE=vercel` is considered only with `VERCEL=1`; a future operator must verify that the chosen edge overwrites that header before enabling it. Do not enable an unverified proxy-header contract. Honeypots and elapsed time do not establish human identity. Provider/WAF/CAPTCHA strategy, quota sizing and realistic distributed load testing remain production gates. No live CAPTCHA service is falsely presented as configured.

## Recovery and data impact

One additive guarded migration creates new objects; no existing product, brand, category, media, role, ID or sample publication is changed. Existing catalog RPCs and RLS remain intact. Earlier Phase 2–5 migrations are unchanged. New foreign keys restrict deletion of referenced products/history rather than deleting request records automatically.

A failed migration rolls back its transaction. After commit, use an additive forward fix and preserve private request/item/history records. To stop new requests, disable the gateway key and application flag; do not weaken RLS or delete data. Existing WhatsApp contact and catalog can remain available. Application flags do not revoke data already delivered to an authorized browser.

The owner must approve retention periods, customer correction/redaction handling and private backup access. There is no automatic customer deletion or unreviewed retention policy. Restore rehearsal must include both database history and private Storage binaries from prior phases, replay/retry checks and incident handling; see the [release plan](release-readiness.md).
