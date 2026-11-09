# Post-launch business website improvements

Candidate branch: `development/post-launch-polish`, based on production main
`c75049ba894b772973bca3f967121f994ae80bad`. No production changes performed.

## Completed

- Added About and Contact pages using only the verified store name, address,
  categories and the two existing WhatsApp/telephone contacts. Visiting times,
  delivery charges, returns, stock, models and prices are not invented.
- Added a shared business-only SEO allowlist for **Home, About and Contact**.
  Metadata, canonical/OG URLs, proxy headers, robots and XML sitemap agree.
  Query-bearing copies, empty collection/brand pages and directories, search,
  Privacy, products and private routes stay noindex. Previews fail closed.
- Reused the approved homepage header/footer logos on inner pages, retained
  their aspect ratios/native sizes, removed enlarged brand-logo presentation,
  and stopped stretching the inner footer decoration over the full mobile height.
- Corrected category symbols using existing approved category artwork. Sanitary
  keeps its existing bathroom symbol; Electrical and Building Materials no longer
  show it. Existing image files are byte-for-byte unchanged.
- Improved mobile contact labels and 44px tap areas. Navigation wraps into visible
  links instead of concealing categories in a horizontal strip.
- Search now matches actual existing brand/category names, including Porta,
  Electrical and Building Materials, with query-aware no-match enquiries.
- Replaced the inactive social-icon block with real information links. Added
  About/Contact/Privacy navigation and corrected release-specific privacy copy.
- No separate approved slider banners exist. The homepage is one banner using
  the existing artwork: its framing excludes the painted arrows/dots; a navy
  overlay covers baked text and the copy/WhatsApp CTA are accessible HTML.
  This intentionally changes the hero crop and enquiry label, not its theme or
  section geometry. No generated images or substitute photography are used.
- Replaced shopping/deal CTAs and unverified delivery/return assurances with
  enquiry wording. The shared red Deals button is now a contrasting gold/navy
  WhatsApp enquiry control.

## Validation

Node 26.13.0: production build, explicit TypeScript and full lint passed.
Lint has zero errors and the same eight pre-existing unused-variable warnings in
unmodified components. Eight focused local test groups passed; see [results](results.json).

The test runs the built app with an isolated backend trap and deliberately
conflicting catalog/Admin/order/media enable flags. It checks the exact three-URL
sitemap and metadata/header agreement, preview/flag-off profiles, XSS-safe search,
verified contacts, enquiry destinations, navigation, empty inventory, private
route denials, category icons, desktop/390px/320px layouts and accessibility.
WCAG A/AA scans of mobile Home, Porta and Contact report no violations in the
tested tags. No backend/external requests or browser errors; no messages sent.

Local candidate screenshots (not a deployed preview):
[Desktop home](screenshots/home-desktop.png) · [Mobile home](screenshots/home-mobile.png) ·
[Materials](screenshots/materials-mobile.png) · [Contact](screenshots/contact-mobile.png) ·
[About](screenshots/about-desktop.png).

## Approval and release requirements

This PR is **not merged or deployed**. The development branch is explicitly
excluded from Vercel Git deployments; all previous exclusions are preserved.

After the owner separately approves this exact PR and deployment, add only the
proposed Production flag in [the manifest](../../ops/production/post-launch.environment.example):
`BUSINESS_INDEXING_ENABLED=true`. Vercel must supply `VERCEL_ENV=production`;
do not create or change that platform variable. Leave the existing empty-catalog,
catalog/shopping/media/indexing/Admin/orders/worker/analytics settings unchanged.

The new business flag enables no catalog/database/Auth/Storage integrations.
Supabase schema, RLS, accounts, ERP and Google Cloud are untouched. The ten deferred
database migrations are not part of this work. Catalog remains empty and all
shopping, payments and Admin activation stays disabled.

After an approved release, check public metadata/robots/sitemap and submit the
three-page sitemap through the owner's Google Search Console. No Google account
changes or Search Console submission are included in this PR.

Verified social URLs and original higher-resolution brand logos were not supplied.
Inactive social placeholders are removed; current approved artwork is reused at
suitable sizes. These are not launch blockers or fabricated substitutes.

For a code-only recovery, use the recorded prior production deployment/commit
`c75049ba894b772973bca3f967121f994ae80bad`; remove only the newly added business
indexing flag if restoring its absent prior state. No database rollback is needed.
