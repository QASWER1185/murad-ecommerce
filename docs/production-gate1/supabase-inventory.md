# Authorized Supabase production inventory

**PASS: identity verified before metadata inspection.**

| Field | Observed non-secret value |
| --- | --- |
| Name / ref | murad-ecommerce / ddgjspvdgjpbysylntji |
| Organization | M Murad Sons / wtvasruaawpaacyyywog |
| Region / status | ap-south-1 / ACTIVE_HEALTHY |
| PostgreSQL | Provider build 17.11.0.018; SQL server_version 17.11 |
| Plan | Free / tier_free, read only for this project's owning organization |
| DB max_connections | 60; configured maximum, not free connections, pool capacity or measured load headroom |

Three queries used BEGIN TRANSACTION READ ONLY, SET LOCAL statement_timeout=5s and
lock_timeout=1s, metadata-only SELECTs with hard LIMITs, then COMMIT. Every result
reported read_only=on. The reported statement_timeout=5000 in the third query is
**our temporary inspection bound**, not the pre-existing production timeout.
No persistent setting, DDL, business record or user session was changed.

## Database objects

Observed schemas: auth, extensions, graphql, graphql_public, public, realtime,
storage, supabase_migrations, vault. The app_private schema is absent. These are
service/schema names; their existence is not evidence of ERP use or isolation.

Public/app_private inventory contains exactly three ordinary tables, all owned by
postgres, RLS enabled and not forced: brands, categories, products. No views,
materialized/foreign tables or public-schema functions returned. Auth functions
and user/session contents were not enumerated. Nineteen total legacy columns,
six indexes and eight constraints are detailed in the bounded evidence.

Installed extensions: pg_stat_statements 1.11, pgcrypto 1.3, plpgsql 1.0,
supabase_vault 0.3.1, uuid-ossp 1.1. No vault contents/configuration secrets read.

## Authorization metadata

- Three SELECT policies are PERMISSIVE, TO PUBLIC, USING(true), one per catalog
  table. There is no publication predicate. No app role/workflow table exists.
- anon/authenticated have table-level SELECT/INSERT/UPDATE/DELETE/REFERENCES/
  TRIGGER/TRUNCATE grants on all three catalog tables. Only SELECT row policies
  returned. This does not demonstrate successful row writes; TRUNCATE is outside
  row RLS. Privilege reduction must be coordinated later, not applied now.
- No explicit per-column ACL entries returned for those tables; schema USAGE is
  granted to anon/authenticated, CREATE is not granted on public/auth/storage.
- anon/authenticated: NOLOGIN, no superuser, no role/database creation, no RLS
  bypass. authenticator: LOGIN, NOINHERIT, membership in anon/authenticated/
  service_role without admin_option. service_role: NOLOGIN, BYPASSRLS.
- Provider postgres: not superuser, LOGIN, CREATEROLE/CREATEDB/BYPASSRLS. Provider
  Auth/Storage admin roles: LOGIN, NOINHERIT, CREATEROLE, no BYPASSRLS. No password
  catalog, role credentials or user-assigned role records were read.

## Auth / Storage / recovery metadata

Auth users and mfa_factors relations exist. **NOT VERIFIED:** actual signup,
providers, MFA enforcement/enrollment, recovery, JWT expiry/revocation and redirect
settings. Relation existence is not an enabled-feature assertion. No Auth login,
user listing, token request or configuration mutation was attempted.

Storage buckets/objects relations have RLS enabled, not forced. No Storage policy
rows or bucket metadata rows returned. No Storage object name, binary, signed URL
or private file was requested. Absence of buckets here does not prove absence of
external assets or establish ERP isolation. Backup time must recheck the manifest.

**NOT VERIFIED:** actual backup inventory/PITR/retention/restore availability. Free
plan metadata and current public backup documentation are available; the actual
backup listing endpoint is not exposed by this connection's current metadata tools.
No export/archive/restore was performed.

Evidence: [identity](evidence/identity.json), [inventory](evidence/database-inventory.json),
[structure/access](evidence/database-structure-and-access.json),
[roles/services](evidence/services-and-roles.json), [plan](evidence/organization-plan.json).
