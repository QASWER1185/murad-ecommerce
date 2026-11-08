# Phase 5 visual preservation

The reference design remains the uploaded approved homepage and sanitary imagery. This phase changes data access, security and shopping functions; it does not replace either page with a screenshot background.

## Sources and reproducibility

- Homepage before captures were taken from the existing Phase 4 optimized Next.js build, at desktop 1200 × 900 and mobile 390 × 844, before changing its data binding. The actual full-page dimensions are 1200 × 1312 and 390 × 2070. Local baseline captures are kept under ignored `work/phase5-baseline`; the comparison strips below retain the visible evidence for review.
- The original homepage assets in `public/homepage` are unchanged. The Sanitary stylesheet and every extracted `public/sanitary` asset are byte-for-byte copies from Draft PR #2 (`shopping/sanitary-section`), with its source provenance retained. No raw-table loader or migration from that PR was merged.
- Sanitary comparison uses `public/sanitary-category-approved-reference.png` (1024 × 1536), PR #2's review captures (1024 × 1596 and mobile 390 × 3230) and the current local application. The main current desktop screenshot is 1200 px wide; a separate 1024 px comparison capture matches the source viewport.
- Screenshots are actual browser-rendered components. Test gallery pictures are clearly synthetic solid-color rasters or explicit missing-image states. They are not substitutes for manufacturer photographs in production.

## Visible differences that follow real data

- Homepage sample product names, photographs, fixed prices, ratings/review counts and the bestseller badge have been removed from the live catalog binding. The existing database samples are preserved privately. The feature rail keeps its approved six-card desktop / two-card mobile geometry. Without approved inventory it shows an empty state, not fabricated sample cards.
- The first homepage tab reads **Featured**, replacing the unsupported **Best Sellers** claim. No sales-history/rating source exists. New Arrivals sorts by publication date; the Deals tab contains no invented promotions. The reserved rating row retains card spacing without rendering a rating.
- Supabase product images replace only the product image areas after explicit verification/publication. Owner-approved CMS assets may replace their existing banner/logo slots. Approved hero, category tiles, static brand artwork, promotional art, benefits and footer graphics remain in place by default.
- The Sanitary sidebar uses only published brands and actual catalog facets. Unsupported reference counts and stock claims are not copied. Native GET submission, an explicit Apply filters control, accurate unknown-availability wording, a small Sort submission control and pagination provide crawlable/server-rendered behavior. These functional controls differ from PR #2's immediate client-only filtering.
- Product count, title lengths, image availability and number of rows change total catalog height. The local test catalog contains 15 sanitary items and uses pagination; PR #2's prior fixture/reference differs. Promotional/footer sections follow the real results rather than a fixed sample-height spacer.
- Other category/brand templates keep the same navy/white/gold system and show a neutral image-awaiting state when no approved collection asset exists. The Sanitary bathroom hero is not falsely reused as product photography for pipes or building materials.

## Comparison artifacts

- [Homepage desktop before / after](screenshots/home-comparison-desktop.png)
- [Homepage mobile before / after](screenshots/home-comparison-mobile.png)
- [Sanitary reference / current at 1024 px](screenshots/sanitary-comparison.png)
- [Machine-readable region checks](comparison.json)

The page-level mobile overflow checks passed at 390 px. Before/after review identified a text-alignment difference introduced by replacing category buttons with real links; `text-align:center` restores the original label alignment. Brand links inherit the original border, height and responsive rules, rather than newly styled cards. The hero and default banner/footer image regions are unchanged; final pixel-region measurements are recorded in `comparison.json`.

Differences caused by unpublished inventory, missing manufacturer assets, truthful commercial presentation and the added functional filtering/pagination are disclosed above. No production catalog was populated or visually approved on the owner's behalf.
