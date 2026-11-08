# Backup and recovery

**Local rehearsal:** see [migration evidence](migration-rehearsal.md).
**Production backup/restore: NOT RUN and not authorized.** No RPO/RTO is certified.

Before any future live change, authorize the exact e-commerce-only source,
operator, encrypted private destination and isolated restore target. Establish that
none shares a Muraderp ai dependency. Do not copy production data into development
or a new service just to perform a rehearsal.

Required recovery set:

- Consistent PostgreSQL schema/data, grants, roles, policies, extensions/version,
  migration ledger, workflow/revision/audit/import/order/outbox records.
- Independent original/derivative/product/brand/banner and private import-source
  binary archive, object metadata and checksums. A DB dump is not a Storage backup.
- Auth configuration and identity/session/key recovery procedure approved by the
  provider/operator. Local fixture users are not production recovery credentials.
- Private signing-key custody/rotation, narrowly scoped machine identity,
  environment manifest without public secret values and compatible app commit.
- Retention, encryption, access logging, deletion policy and recovery owner.

Verify the archive by restoring an isolated approved target, checking object bytes,
row/version counts, order snapshots/history, RPCs, RLS and private/public delivery.
Check withdrawn items do not reappear and stale worker events cannot broaden
visibility. Reconcile records created after the snapshot before reopening.
Record actual timestamps, observed loss window and owner-accepted bounds.

Local PostgreSQL dump/restore and fixture-binary round-trips demonstrate only their
stated local contracts. They do not prove hosted Auth recovery, provider backup
coverage, Storage version retention, CDN purge or an operational recovery time.
