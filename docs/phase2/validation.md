# Phase 2 validation and remaining risks

## Reproducible checks

```bash
npm run test:phase2
npm run lint
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321 NEXT_PUBLIC_SUPABASE_ANON_KEY=phase2-local-not-a-real-key npm run build
git diff origin/main -- src/app src/components public
```

The build command overrides the existing public Supabase configuration with a localhost-only target. It compiles existing routes without using the production Supabase service. The UI diff command must be empty for this phase.

### Coverage

- Policy tests: Draft/review/archived/stale approval visibility, admin/editor boundaries, 32 combinations of SQL eligibility/environment/preview/filter metadata-sitemap agreement, malformed/duplicate canonicals, missing fields, optional-price indexing versus Offer eligibility, and real content timestamps.
- Database tests: transaction opt-in guard, unknown policy/grant rejection, preservation of all original seed product fields, all legacy records Draft/unverified, no raw anonymous catalog access, no user/admin self-promotion, no ordinary-user preview, editor read-only access, mandatory versioned review/approval, rollback of invalid indexing approval, verified price/stock masking, public and non-indexable publication, positive complete-product indexing, dependent category withdrawal, quotation-only price suppression, published edit protection, private media isolation even with broad existing storage policies, immutable objects, placeholder verification rejection, immutable revisions, audit/outbox records, canonical slug history, redirects hidden after withdrawal, archive version validation, category hierarchy cycles and normalized duplicate SKUs.
- Compatibility matrix: fresh latest-main schema and a second fresh schema with the exact optional model/type/finish column shapes from Draft PR #2. PR #2 remains unmerged.
- Test database: digest-pinned PostgreSQL 17 Alpine, local Docker socket, no network and no host ports. SQL tests use lightweight `auth.uid`/Auth-user/Storage-table contracts, not live Supabase services.

## Results

Validated on 2026-11-07:

| Check | Result |
| --- | --- |
| TypeScript publication/SEO policy tests | 6 passed, including 32 metadata/sitemap context combinations |
| Latest-main migration/RLS/workflow fixture | 67 assertions passed |
| PR #2 optional-column compatibility fixture | 67 assertions passed in a separate fresh database |
| `npm run lint` | Exit 0; 0 errors, 8 existing warnings in unchanged files |
| Next.js 16.4.5 optimized build with localhost Supabase overrides | Passed compilation, TypeScript and static generation |
| `git diff --check` | Passed |
| App/component/artwork diff against main | Empty |

Passing the SQL suite proves policy/function behavior for the tested PostgreSQL schemas. It does not certify production credentials, the remote schema, Storage HTTP behavior or end-to-end Supabase JWT authentication.

Existing lint warnings in unchanged homepage/footer/cart files are reported rather than changing approved components. Generated policy-test JavaScript is excluded from lint and git.

No visual screenshot comparison was required for this database-only phase: approved app/component/artwork files are byte-for-byte unchanged from main. No browser-visible admin, preview, product or sitemap route was introduced.

## Security boundaries and release blockers

| Actor | Public views | Raw catalog / previews | Draft changes / media upload | Review / publish | Role assignment |
| --- | --- | --- | --- | --- | --- |
| Anonymous | Published safe projections | Denied | Denied | Denied | Denied |
| Ordinary authenticated user | Published safe projections | No rows / RPC denied | Denied | Denied | Denied |
| Editor | Published safe projections | Allowed | Denied | Denied | Denied |
| Administrator | Published safe projections | Allowed | Allowed on Drafts; insert-only media | Explicit RPCs | Denied |
| Trusted database owner/operator | Operational access | Privileged | Privileged | Privileged | Explicit operator action |

1. **Not deployable independently:** the current storefront/PR #2 read raw tables. Coordinated adapter and genuine catalog publication are required before any migration release. All existing rows remain Draft. The opt-in guard and development-branch Vercel deployment exclusion reduce accidental release risk.
2. **Full Supabase staging validation remains required:** actual Auth session/JWT validation, PostgREST grants/view behavior, private Storage upload/signing, binary MIME/dimension validation, actual database ownership/default privileges and production-scale locking were not exercised against a remote service. No production connection was made.
3. **Privileged credentials remain powerful:** a database owner and Supabase service-role bypass can change data outside RLS. Do not give these credentials to the future browser admin. Limit trusted server access, rotate credentials through the owner's process, and add MFA/session hardening to the Phase 3 login. No service-role key or privileged client is added here.
4. **Public media serving is future work:** all new originals stay private. There is no anonymous signing RPC. Phase 4 needs binary validation, safe object names, immutable replacements and a public media handler that rechecks published attachment eligibility, with cache controls preventing withdrawn images from remaining accessible. Signed preview URLs are bearer credentials; keep expiry short and never put them in public metadata.
5. **Cache delivery is future work:** outbox records are durable, but there is no processor/webhook or cache revalidation integration. A later release must invalidate dependent routes synchronously for unpublish/archive, retry failed outbox work and test stale-cache behavior. Database privacy alone cannot withdraw a previously cached HTML response.
6. **Application authorization is a foundation:** `server-access.ts` uses `auth.getUser()` and database-owned roles, but session cookies/SSR client construction, CSRF/origin validation, login rate limits and the admin/preview routes belong to Phase 3. Keep preview responses private/no-store and unindexed. SQL assertions simulate already-authenticated role identities; they do not validate JWT signatures.
7. **Human facts require human review:** a trusted admin can attest false content. Constraints prevent accidental publication, not a malicious privileged reviewer. No seeded sample is verified. No ratings/reviews/warranties or automatic commercial claims were introduced.
8. **Imports are records, not an importer:** before accepting files, implement parsing limits, malware/file validation, formula-safe exports, column mapping, SKU normalization, error preview, duplicate handling and explicit approved application of price changes. Imported products stay Draft by default. Do not directly write Published rows from a worker.
9. **Revision editing and audit retention:** snapshots exist at submission, publication and return-to-Draft; all catalog mutations also generate full before/after audit rows. Continuous live-page availability during edits needs a staged-revision workflow later. Define access/retention for sensitive import/audit payloads and monitor their storage growth.
10. **SEO integration is deferred:** live robots/sitemap/metadata/product-schema routes, Google verification and actual indexing rollout belong to later approved phases. Helpers default to indexing disabled. Production origin and owner opt-in must come from trusted server configuration; never infer them from an untrusted request host or query parameter.

Phase 2 stops here. Phase 3 development, staging access, production migrations, merging and deployment each remain subject to the owner's next approval.
