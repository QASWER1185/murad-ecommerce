# Sanitary shopping section — review draft

This implementation is **not ready for final visual approval** until the verified inventory and product photographs are supplied. The reference is `public/sanitary-category-approved-reference.png` (1024 × 1536). Its sample inventory is not treated as verified database data.

## Screenshots

- [Desktop](desktop.png)
- [Mobile](mobile.png)
- [Approved reference beside implementation](comparison.png)
- [Browser check results](test-results.json)

## Implemented

- `/category/sanitary`, then four separate shopping routes: `/brand/porta`, `/brand/faisal-sanitary`, `/brand/dell-ceramics`, `/brand/imported-china`.
- Product detail links at `/product/[slug]` for sanitary products that actually exist in Supabase.
- A single server-side Supabase catalog query shared by all these pages, with current prices, descriptions, availability and brand associations. No duplicate hardcoded product catalog.
- Brand/type/price/availability/finish filters, product search, sorting, wishlist, persistent section cart, quantity changes, removal, totals, and WhatsApp order composition.
- Two separate green WhatsApp contacts in both header and footer: `0321-7165000` → `https://wa.me/923217165000`, and `0308-6235608` → `https://wa.me/923086235608`.
- Real responsive components with the reference's navy/white/gold design system. Extracted assets are limited to decorative hero, logos, icons, promotional artwork and brand navigation cards; the page is not a full screenshot background. Provenance is in `public/sanitary/provenance.json`.
- Homepage appearance preserved: a 1199 × 1312 before/after pixel comparison found no changed pixels. Only the existing Sanitary entry actions now navigate to the new category page.
- A nullable metadata migration is prepared for `model`, `product_type` and `finish`. It seeds no facts and has **not been applied** to the live database. The page also works with the current schema.

## Verified data gaps / remaining work

The current Supabase sanitary inventory contains only these three records:

| Product | Database price | Database brand | Photo URL |
| --- | ---: | --- | --- |
| Porta Fancy Commode | PKR 15,000 | Porta | Missing |
| Faisal Sanitary Wash Basin | PKR 8,000 | Faisal Sanitary | Missing |
| Dura Max U-PVC Pipe 3 inch | PKR 1,200 | Imported China | Missing |

- The approved image shows 16 visible sample cards and a “24 Products” label. These do not exist as verified database inventory, and its sample prices differ from the database. Counts/prices/stock have not been fabricated or overwritten to match the raster design.
- All three current `image_url` values are null. Product cards show an explicit missing-photo placeholder. Reference photos have not been assigned to different/unverified models.
- No verified model or finish values exist. Model text is omitted. Finish currently supports “Not specified”; verified finish options populate from the database once supplied. Named finishes such as Chrome/Matte Black cannot be demonstrated with the current records.
- Dell has no inventory, so its page shows a truthful empty state. The Imported page currently includes the pipe because that is its database association. The database owner should review the pipe's category/brand assignment.
- The photographic gallery, product-grid density, sample sidebar counts and final visual comparison remain incomplete because of these gaps. Live typography, source-photo resolution, some spacing, and unverified reference marketing/legal links also differ. No fake ratings or warranties are added. Sidebar filters apply immediately.
- The new section's cart/wishlist persist across its category, brand and product pages. The legacy homepage cart/catalog are unchanged and do not share this new section's storage; unifying that legacy hardcoded inventory requires verified SKU mappings.
- Decorative social marks have no invented external profile URLs. Account links provide account/order assistance through WhatsApp; no new authentication or payment backend is claimed.

To finish: provide verified SKU records and matching product photo URLs/models/finishes through the existing Supabase workflow. Then repeat the screenshot comparison and approve the final design before merge/deployment.

## Validation

- `npm run build`: passed for the combined category, four brand routes and product route.
- `npm run lint`: zero errors; eight existing unused-variable warnings in legacy files.
- Chromium checks passed against actual Supabase records: brand/type intersections, price ranges, empty results, finish-not-specified, stock filter, both price sorts, search, wishlist, product links, cart totals/quantity persistence across pages, all four brand pages, and both WhatsApp numbers.
- Responsive checks at 320, 390, 768, 1024 and 1440 pixels: no horizontal document overflow; both header contacts remain visible. No browser runtime errors.
- Product images, sample model data and named finish selection cannot be validated until genuine catalog values are supplied.

## Deployment guard

`vercel.json` disables Git auto-deployment **only** for `shopping/sanitary-section`, following Vercel's published configuration schema. This permits a review branch without starting a preview deployment. Other branches retain their existing default behavior. No database migration, merge into `main`, or production deployment is authorized or performed in this task.
