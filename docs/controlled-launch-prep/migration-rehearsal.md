# Migration rehearsal and compatibility

**PASS — local only.** Twelve source migrations are unchanged, hash-matching Phase
7. No historical SQL was edited and no forward migration was needed. Exact order,
SHA256 and session-guard presence are in [the matrix](evidence/migrations.json).

| Fixture | Executed result |
| --- | --- |
| Fresh disposable database/full latest stack | Existing Phase 3–8 fixtures install all 12 migrations; real local Auth-schema subset also installs all 12 |
| Legacy main schema with six samples | Phase 2 current-main fixture: 67 assertions; initial/seed schema remains source-compatible; guarded workflow/cutover validated |
| PR #2 optional model/type/finish columns | Phase 2 compatibility: 67 assertions; full latest-stack Phase 8 compatibility adds seven preservation/private-key/public-access assertions |
| Import source errors/history | Nine Phase 8 boundary assertions plus Phase 4 56 assertions, including 600-row interruption/conflict/retry |
| Public catalog/withdrawal/leases | Phase 5 49 database assertions |
| Orders/gateway/snapshots/idempotency | Phase 6 62 database assertions |
| MFA/machine worker/security/recovery | Phase 7 51 hardening assertions plus 27 foundation assertions in its fixture |

The fresh/legacy cases intentionally use the repository's initial legacy schema
and source samples, not a dump of production. Current hosted schema/history was
**NOT RUN / unauthorized**. Source compatibility is not evidence of live drift.

Tests enforce per-connection `app.catalog_cutover_approved=yes`, reject unexpected
legacy policies/column grants, verify rollback on failed guards, preserve original
sample IDs/values, default all samples to unverified Draft, deny anonymous raw
reads/self-assigned roles/writes and separate public visibility from indexability.
Real local JWT/PostgREST checks additionally verify actual Auth IDs/foreign keys,
role projection, AAL1 denial and AAL2 permitted Draft writes.

Local recovery restored the synthetic PostgreSQL DB and checked checksums/counts,
order history and anonymous raw denial. The binary archive round-trip uses fixture
bytes, **not a real Storage service**. No operational RPO/RTO is claimed.

Evidence: [legacy preservation](evidence/legacy-compatibility.json),
[import errors](evidence/import-boundary.json), [recovery](evidence/recovery.json),
[test task outcomes](evidence/test-results.json). Never replay the legacy seed on a
populated live database; the future cutover requires its actual history first.
