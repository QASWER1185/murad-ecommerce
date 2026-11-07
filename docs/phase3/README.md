# Phase 3 — secure admin dashboard

Review branch: `development/admin-dashboard`, based on Phase 2 commit `2308dd687443b11049ec2762dddcc819b01f2910` from `development/seo-commerce`. Its Draft PR targets that Phase 2 branch, not main. Sanitary Draft PR #2 and Phase 2 Draft PR #3 remain unmerged.

No production Supabase connection, production migration, Auth settings change, initial administrator provisioning or deployment was performed. Vercel Git deployment is disabled for both development branches. Phase 4 has not started. Approved homepage/category/layout components and artwork remain unchanged.

## Implemented

- Responsive navy, white and restrained gold `/admin` workspace: overview with actual database counts, sidebar/mobile navigation, recent products, paginated product tables, name/SKU/model search, status/brand/category filters and private previews.
- Request-scoped Supabase SSR clients, `auth.getUser()` verification, database-owned role checks at protected layouts, every data entry point and every mutation. Roles never come from user metadata or form fields. Editors can read/preview only; administrators can manage Drafts, review and approve publication.
- Email/password login and POST-only logout. No registration, invitation or role-assignment endpoint. Auth refresh is persisted through the Next.js 16 `proxy.ts`; server rendering never relies on unvalidated cookie contents. Session cookies are HttpOnly, SameSite Strict, `/admin` scoped, Secure on HTTPS and bounded to eight hours per cookie issuance. Logout calls provider-local-session revocation and clears browser cookies.
- Exact configured-origin and CSRF validation on mutations, unpredictable HttpOnly CSRF cookies rotated on login/logout, bounded form bodies, duplicate-field rejection, server-side validation, sanitized database errors and shared PostgreSQL login throttling. Browser forms display pending states and server errors without discarding edits.
- Manual Draft creation/editing: SKU/model, brand/category, genuine descriptions, JSON text specifications, optional PKR price/quantity, unknown stock by default, online/quotation mode, product type/finish, SEO title/description, canonical path and permanent slug.
- Atomic `save_product_draft` RPC locks the record and checks its expected version. Ordinary direct product INSERT/UPDATE grants are removed, so product authoring goes through the reviewed RPC boundary. No RPC accepts role, approval, publication or verification stamps in its product JSON.
- Separate submit, explicit factual review, explicit publication and optional indexing approval actions. Return-to-Draft withdraws public visibility; archive and permanent URL rename use existing versioned Phase 2 RPCs. Existing revisions are displayed. No unsupported reviews, ratings, prices, stock or warranties are generated.
- Per-gallery-image Draft alt text editing uses a versioned RPC, invalidates review and keeps original media private/immutable. Public image metadata falls back to the original verified alt text when no override exists. Binary serving/upload/replacement is not activated.
- Catalog, settings and import-history read views plus clearly disabled Phase 4 upload/import/banner controls. These boundaries do not claim unfinished functionality is working.
- Shared Phase 2 SQL/TypeScript indexing policy drives the eligibility indicator. All admin/preview pages carry robots noindex/nofollow and private/no-store headers. A catalog eligibility indicator does not enable production Google indexing.

## Screenshots

Screenshots were captured against the actual local Next.js build with synthetic test accounts and the repository's existing sample records in a disposable database. These samples remain Draft/unverified; screenshots do not represent verified production inventory.

| Desktop | Mobile |
| --- | --- |
| [Overview](screenshots/overview-desktop.png) | [Overview](screenshots/overview-mobile.png) |
| [Product editor](screenshots/editor-desktop.png) | [Product editor](screenshots/editor-mobile.png) |
| [Login](screenshots/login-desktop.png) | [Product list](screenshots/products-mobile.png) |

The desktop viewport is 1440 × 1000; mobile is 390 × 844. Full-page captures include content below the initial viewport. Mobile overview, product list and editor assertions verify no page-level horizontal overflow; tables and navigation have their own intentional horizontal scrolling. Screenshots were visually inspected.

## Validation

| Check | Result |
| --- | --- |
| Phase 3 configuration/CSRF/form policy unit tests | 4 passed |
| Phase 3 PostgreSQL authorization/save/alt-text/throttling checks | 27 assertions passed |
| Browser authentication, permissions, workflow and responsive groups | 15 passed |
| Phase 2 publication/SEO regression tests | 6 passed |
| Phase 2 main-schema + PR #2-column regression fixtures | 67 + 67 assertions passed |
| Optimized Next.js build and TypeScript | Passed with localhost storefront overrides and admin disabled at build time |
| Lint | Exit 0; no errors, 8 existing warnings in unchanged storefront files |

Browser coverage includes anonymous denial, ordinary-user denial despite forged `user_metadata`, rejection of forged session cookies, read-only Editor enforcement, administrator login, cookie flags, CSRF/origin rejection, malformed input, extra workflow-field rejection, Drafts without images/prices, duplicate SKU rejection, stale version rejection, search/filter links, private previews, explicit review/publish separation, rejection of incomplete indexing approval, public withdrawal, SSR token refresh, rate limiting, logout and mobile controls.

The tests run the real application and Supabase SSR SDK against **local HTTP Auth/PostgREST contracts backed by real isolated PostgreSQL RLS**, not a real GoTrue/PostgREST/Storage deployment. JWT signatures, GoTrue deployment settings and Storage HTTP/binary handling still need separately authorized full-stack staging tests. There is no fixture bypass or test identity switch in application code.

Reproduce after `npm ci`, with a local Docker daemon, the pinned PostgreSQL image and Chromium available:

```bash
npm run test:phase3:unit
npm run test:phase2
npm run lint
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321 NEXT_PUBLIC_SUPABASE_ANON_KEY=phase3-local-test-key ADMIN_ENABLED=false npm run build
npm run test:phase3:e2e
```

`test:phase3:e2e` creates a unique network-disabled PostgreSQL container, exposes no database ports, starts the HTTP fixture and Next.js on loopback, runs Chromium tests, regenerates screenshots and removes its own container/volume. It does not read `.env` credentials for database connections. The explicit runtime admin variables always override existing production-oriented storefront settings. The fixture uses synthetic users only and is never imported by the application.

## Remaining scope and release blockers

1. **Legacy storefront adapter:** current main and PR #2 still read raw catalog tables. Do not apply restrictive Phase 2/3 migrations independently to the live store. Adapt product/category/brand queries to public views, nullable prices and verified availability while preserving approved layouts. Genuine catalog review and a coordinated release remain mandatory.
2. **Authorized full-stack staging validation:** real Supabase Auth/JWT/refresh/revocation behavior, PostgREST RPC/view grants and private Storage need explicit staging authorization. Initial trusted administrator provisioning remains a separate operator action. No accounts were provisioned outside disposable fixtures.
3. **Cache/media withdrawal and redirects:** the invalidation outbox exists, but its processor and storefront cache integration do not. Public media eligibility checks, secure binary processing and the HTTP permanent redirect handler are also pending. Do not release publishing to a cached live storefront before these controls work.
4. **Phase 4:** CSV/XLSX parsing/template/mapping/preview/duplicate resolution and import execution; secure image upload, inspection, galleries/replacement and private/public delivery; brand logos and homepage banner editing. History and UI integration boundaries exist, execution controls are disabled. Taxonomy/settings authoring interfaces also remain pending.
5. **Operational hardening:** HTTPS deployment configuration, provider MFA/session/password recovery policy, edge-level abuse protection, monitoring, backup/restore and failure-injection testing need review before a production release. The database throttle is shared across workers but has a deliberate global budget; a public attacker can consume that budget, causing temporary login denial. Provider access tokens may outlive logout until their configured expiry; browser cookie clearance alone is not token revocation certification.
6. **Workflow limitation retained from Phase 2:** live products must be withdrawn to Draft before editing. A staged revision that keeps the old page live is not implemented. Taxonomy lists are bounded to 1,000 options and import history to 50 recent jobs; future large-taxonomy lookup/history pagination should replace these bounded views when needed.

Recommended next step: review this isolated Draft PR, then authorize Phase 4 image/import implementation. Separately authorize a staging environment before real Supabase service validation. Do not merge or deploy these branches as part of this review.

See [operator and security guide](operator-guide.md) and [complete changed-file inventory](files.md). **Development stops after Phase 3.**
