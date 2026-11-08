# Stacked PR and integration assessment

GitHub repository metadata was read for PRs #2–#8; each was open, Draft, unmerged
and individually mergeable against its current target. No hosting/Supabase/Google
service was accessed. Local Git ancestry and merge-tree inspection do not merge
branches, touch a database or authorize a release.

| PR | Branch | Target | Head reviewed |
| --- | --- | --- | --- |
| #2 | `shopping/sanitary-section` | `main` | `3585cb5e7d155c6f60081a731c944dd7514e9ae8` |
| #3 | `development/seo-commerce` | `main` | `2308dd687443b11049ec2762dddcc819b01f2910` |
| #4 | `development/admin-dashboard` | Phase 2 | `d9e27ec7bcece95a0e487195d506f700a4c409d7` |
| #5 | `development/product-import-media` | Phase 3 | `bc50bfcd72cd7fbc26c410f6a47bf8e7ae58a2ef` |
| #6 | `development/storefront-integration` | Phase 4 | `7ae9d7985340ec3b6ac5e9b2dbd3e22dc7b72814` |
| #7 | `development/orders-analytics` | Phase 5 | `9df548718d4beac223b052290f70e91dc7c59039` |
| #8 | `development/staging-readiness` | Phase 6 | `c8f9f701c783a4a7f86b4587f641ba7d964414aa` |
| Part A | `development/phase8-preflight` | Phase 7 | Based on #8; new Draft review only |

The Phase 2→7 chain is linear; every base is an ancestor of the next head.
Main's reviewed repository SHA is `c73b01b93c4093edefe1c00e34299a9041ea5bef`.
This statement describes Git source, not the state of any hosted application.

PR #2 is a separate older line. A local `git merge-tree --write-tree` against
Phase 7 found conflicts in:

- `src/app/brand/[slug]/page.tsx`
- `src/app/product/[slug]/page.tsx`
- `src/components/home/ReferenceStorefront.tsx`
- `src/components/sanitary/SanitaryShop.module.css`
- `src/components/sanitary/catalog-options.ts`
- `src/components/sanitary/shop-state.ts`
- `vercel.json`

Even a mechanically resolved merge could reintroduce raw-table queries, old
catalog state or obsolete deployment configuration. Phase 5 already selected
appropriate Sanitary artwork/components and adapted them to the central catalog.
Keep #2 separate; the owner should explicitly decide whether to retire it or
review any genuinely missing change. Do not blindly merge the entire branch.

Future authorized integration: freeze/review exact heads, finish real staging
acceptance, then use a reviewed integration branch or merge/retarget in order
#3→#4→#5→#6→#7→#8→Part A. Recheck diffs when targets move, especially with squash
merges. Git mergeability is not semantic/database compatibility or permission
to release. Apply the coordinated plan in [migration-plan.md](migration-plan.md).
No existing PR was merged, retargeted or marked ready by Part A.
