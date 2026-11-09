# Backup and restore readiness

**NOT VERIFIED / Gate 2 execution BLOCKED.** No backup was created, listed through
a privileged inventory endpoint, exported/downloaded, copied or restored. No
Storage objects or Auth/customer records were read. No RPO/RTO is claimed.

Observed plan: Free in the authorized project's organization. Current
[Supabase backup documentation](https://supabase.com/docs/guides/platform/backups)
describes user-facing automatic daily backups for Pro/Team/Enterprise, recommends
regular manual exports/off-site copies for Free, and states **Storage object bytes
are not included in database backups**. Do not assume Free has downloadable daily
backups/PITR. This plan entitlement is not proof that no manual/private backup
exists: actual backup inventory, retention and restore access are NOT VERIFIED.
Current tools expose no safe backup-list/Auth-settings read route; no privileged
credential was extracted to work around that limitation.

No bucket metadata rows returned on this project at Gate 1. Recheck authorized
bucket inventory at backup time; record an empty manifest if still empty. Do not
omit the binary-archive step merely because no buckets exist today. Existing
legacy image_url columns can reference external assets, but actual URLs/records
were not read, so source/rights/recovery coverage remain unknown.

## No-third-project recovery option — proposed only

Use an owner-approved private, sufficiently sized existing operator machine or
isolated local VM/container environment, with encrypted storage and no ERP or
public connectivity. Restore exact PostgreSQL 17 schema/data/ACL/roles/extensions
and reviewed Auth/Storage metadata; separately verify approved binary archives.
The previous 7.9 GiB executor could not fit the full official local image, so it
must not be assumed suitable for a full production restore. Determine capacity
and service compatibility before copying real data. No new billable VM/project is
authorized, and a generic PostgreSQL restore is not hosted Auth/CDN certification.

Gate 2 must separately authorize exact source/data scope (including any personal
Auth data), trusted operator, least-privilege secure access, encryption destination,
retention/access/deletion policy, object archive scope, isolated restore target,
verification method, resource budget and incident/recovery ownership. Private
credentials and dumps stay out of chat/reports/GitHub. Custom-role passwords and
provider-managed Auth/signing configuration may require separate operator recovery
procedures; do not infer their coverage from a SQL dump.

ERP isolation must be resolved from authorized e-commerce/owner evidence before a
backup that might copy shared ERP data. Otherwise stop. Gate 2 does not authorize
production restore, migrations, key rotation, deployment or feature activation.
