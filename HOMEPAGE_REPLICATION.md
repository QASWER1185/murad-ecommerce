# Approved homepage replication

Implemented on `homepage/reference-replication` using `public/homepage-approved-reference.png`, added by the repository owner. The supplied reference is 1199 × 1312 pixels.

## Implementation

- Replaced the previous fixed-height Bento homepage with the approved header, category navigation, bathroom hero, nine category tiles, eight brand cards, six visible product cards, two promotional banners, service benefits, and footer.
- Extracted 61 assets from the supplied reference. Store logos, product photographs, category photographs, brand marks, icons, the hero, banners, skyline, and gold footer wave use this reference. No stock photography, generated replacement artwork, or emoji were introduced.
- Kept searchable inventory, category/brand/collection filtering, product scrolling, wishlist controls, cart quantities/removal/totals, and WhatsApp ordering. Existing Supabase client, category queries, schema, and migrations are unchanged.
- Restored normal document scrolling. Mobile layouts keep the same content and artwork, with category/brand grids, a horizontal product rail, stacked banners, and a stacked footer.
- Scoped homepage styling in a CSS module. Limited the existing Tailwind loader to the global stylesheet so it does not discard CSS-module exports. Bundled the local Roboto font with its OFL license; footer text uses Arial to match the reference's glyph widths.

## Asset provenance and reproduction

`public/homepage/provenance.json` records the reference SHA-256, original dimensions, and crop bounds. The original uploaded reference remains unchanged.

To reproduce the extracted assets, with Pillow installed:

```sh
python scripts/extract-homepage-assets.py public/homepage-approved-reference.png
npm run build
npm run lint
```

The extraction script removes adjacent label fragments and the flat background from icon crops. Footer text/logo areas are reconstructed from their text-free edge pixels so the original skyline and wave can sit behind live HTML links. The full store logo and marketing banners retain the reference's own lettering.

## Verification

- Production build: passed.
- ESLint: passed with zero errors and eight existing unused-variable warnings in legacy components.
- Chromium checks: passed for product order, asset availability, search/empty results, category/collection filters, carousel scrolling, wishlist, cart additions/quantities/totals, WhatsApp order URL contents, dialog Escape, responsive header/footer reachability, and the live Supabase sanitary category page.
- No browser runtime errors. No horizontal document overflow at 320, 390, 768, 1024, 1199, or 1440 CSS pixels.
- Captured desktop and mobile production screenshots and a side-by-side comparison with the original reference. Reviewed successive captures and corrected visible crop, sizing, font, alignment, and icon/background differences.
- At the reference viewport, document height is 1312 pixels. The header ends at y=141, hero at y=407, promotional banners occupy y=959–1094, benefits end at y=1162, and footer ends at y=1312. The hero crop is pixel-identical to the supplied reference at this size.

Local live-Supabase verification used `NODE_USE_ENV_PROXY=1` for this managed environment's outbound proxy; production configuration was not changed.

## Remaining differences and source limitations

This is a close recreation of the approved layout, not a claim that the entire page is a bit-for-bit screenshot. Live HTML text, borders, shadows, some one-pixel alignments, and antialiasing differ slightly from the flattened reference. Original editable font/design files and higher-resolution product photos were not supplied, so extracted artwork retains the supplied image's native resolution.

Only one approved hero slide was supplied. Its arrows/dots remain part of the approved banner artwork; additional slides were not invented. Existing catalog items beyond the six reference products remain searchable/orderable; missing photos for those extra items were not replaced with unrelated images.

No deployment or merge into `main` was performed.
