# SEO and mobile accessibility readiness

**PASS — local technical SEO checks. Production indexing remains disabled.** No
Google service, sitemap submission, property setup or ranking claim occurred.

Real Next SSR/Chromium checks verify one H1, titles, canonical URLs without filter
queries, breadcrumbs/internal links, visible product HTML, Draft 404 and permanent
308 only while destinations are published. Search/filter/Admin and unfinished
content stay noindex. Local robots disallows all; sitemap is intentionally empty
under closed production/indexing gates. Shared publication/indexability rules are
covered by Phase 2/5/6/7 units/SQL/browser tests.

Category/brand/product structures use the central public catalog. Product/Offer
markup is absent when real supporting data or production eligibility is missing;
no fake aggregateRating/review, prices, availability or commercial offer is emitted.
Business schema/contact copy retains the approved M Murad Sons name, Lahore
address and both WhatsApp numbers. Meaningful image metadata/galleries and approved
reference artwork are preserved; private catalog media avoids shared optimizer
caching that could bypass publication withdrawal.

Mobile routes have no horizontal overflow in tested widths; keyboard cart dialog
focus/Escape behavior passes. Four approved Home/Sanitary captures exactly match
Part A; Admin desktop/mobile captures additionally use real local GoTrue.

**FAIL — retained contrast checks:** automated Axe reported `color-contrast`
findings on Home (6 nodes desktop/mobile), Sanitary (7) and product (1). Brand and
Admin pages in this run had no reported violations. Counts can overlap shared
components; they are not a site-wide unique issue total or WCAG certification.
The approved palette/placeholder/Deals treatments were not changed without design
approval. Owner-approved remediation and a focused recheck remain needed.

**BLOCKED before indexing:** real useful product content, canonical production
identity, protected-dependency review, live permission/withdrawal acceptance,
production gate code review and explicit Google/indexing approval. Unfinished or
placeholder-only products must not be submitted for indexing.

[SEO evidence](evidence/seo.json), [Axe findings](evidence/accessibility.json),
[visual evidence](evidence/visual-comparison.json).
