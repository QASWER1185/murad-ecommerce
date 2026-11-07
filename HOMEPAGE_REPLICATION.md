# Homepage reference replication — incomplete draft

Branch: `homepage/reference-replication`.

The responsive layout and storefront interactions are implemented. This is **not a completed pixel-perfect replication**: the embedded reference is visible in the task, but its original image bytes are not accessible in the execution workspace. The repository has no reference artwork and all six Supabase product `image_url` fields are null. No replacement photos, generated artwork, emoji, or substitute icons have been added.

## Required to finish

Supply the original complete reference as an accessible PNG/JPG file. Hero imagery, category and product photos, brand logos, the store emblem, icons, promotional banners, and footer artwork currently have empty reserved areas. Brand names and banner copy are rendered as text while their approved artwork is pending.

`python scripts/extract-homepage-assets.py /path/to/reference.png` extracts individual artwork crops and records their source hash and bounds. It requires Pillow. Crop bounds are prepared from the displayed 1200 × 1312 design and must be reviewed against the original file. The script writes `public/homepage/*.png` and the asset manifest; it does not generate or replace imagery. Marketing banners preserve their approved baked-in text, while product information, search, filtering, and cart controls remain live HTML.

After extraction, review all crops, rebuild, take new desktop/mobile screenshots, and correct any visible differences. A numerical pixel comparison has not been possible without the original file. Do not treat the current screenshots as final design approval.

## Implemented

- Reference section order, navy/gold palette, typography, header/navigation, nine category cards, eight brand cards, six visible product cards, two banners, benefits, and footer.
- Normal document scrolling and responsive layouts at desktop, tablet, and narrow mobile widths.
- Existing searchable catalog and WhatsApp ordering, plus working category/collection filters, product carousel, wishlist, cart quantity controls, removal, and totals.
- Supabase client, schema, migrations, and existing category-page queries remain unchanged.
- The global Tailwind loader is limited to `globals.css` so CSS module exports work correctly.
- Two pre-existing JSX quote lint errors in the previous storefront were corrected; the dependency lockfile now includes the already-declared Supabase dependency.

## Verification

- `npm run build`: passed.
- `npm run lint`: passed, zero errors; eight existing unused-variable warnings in unchanged legacy components.
- Chromium browser checks passed: product order, search/empty results, filters, carousel, wishlist, cart quantities/totals, WhatsApp order URL contents, dialog Escape, footer reachability, and live Supabase sanitary-category rendering.
- No browser runtime errors. No horizontal document overflow at 320, 390, 768, or 1200 CSS pixels.
- Desktop and mobile draft screenshots captured in the local `work/` directory. At 1200 pixels wide, the document is 1312 pixels tall; header ends at y=141, hero at y=407, banners occupy y=959–1094, benefits end at y=1162, and footer ends at y=1312.
- Local Supabase browser verification used `NODE_USE_ENV_PROXY=1` for this managed environment's outbound proxy. No production configuration was changed.

No deployment was performed. Changes remain on a local branch; nothing has been pushed or published.
