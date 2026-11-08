# Executed read-only metadata queries

All three calls targeted only the verified project `ddgjspvdgjpbysylntji`.
Local timeout settings apply only within their read-only transaction and do not
represent production defaults. No record-level catalog/Auth/object query was run.

## Transaction 1

```sql
BEGIN TRANSACTION READ ONLY;
SET LOCAL statement_timeout = '5s';
SET LOCAL lock_timeout = '1s';
SELECT jsonb_build_object(
 'read_only',current_setting('transaction_read_only'),
 'server_version',current_setting('server_version'),
 'schemas',(SELECT coalesce(jsonb_agg(nspname),'[]') FROM (SELECT nspname FROM pg_catalog.pg_namespace WHERE nspname NOT LIKE 'pg_%' AND nspname<>'information_schema' ORDER BY nspname LIMIT 60) n),
 'relations',(SELECT coalesce(jsonb_agg(to_jsonb(x)),'[]') FROM (SELECT n.nspname AS schema,c.relname AS name,c.relkind AS kind,c.relrowsecurity AS rls_enabled,c.relforcerowsecurity AS rls_forced,pg_catalog.pg_get_userbyid(c.relowner) AS owner FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname IN ('public','app_private') AND c.relkind IN ('r','p','v','m','f') ORDER BY n.nspname,c.relname LIMIT 120) x),
 'relation_count',(SELECT count(*) FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname IN ('public','app_private') AND c.relkind IN ('r','p','v','m','f')),
 'migration_history_present',to_regclass('supabase_migrations.schema_migrations') IS NOT NULL,
 'auth_users_relation_present',to_regclass('auth.users') IS NOT NULL,
 'auth_mfa_relation_present',to_regclass('auth.mfa_factors') IS NOT NULL,
 'storage_buckets_relation_present',to_regclass('storage.buckets') IS NOT NULL,
 'extensions',(SELECT coalesce(jsonb_agg(to_jsonb(e)),'[]') FROM (SELECT x.extname AS name,x.extversion AS version,n.nspname AS schema FROM pg_catalog.pg_extension x JOIN pg_catalog.pg_namespace n ON n.oid=x.extnamespace ORDER BY x.extname LIMIT 40)e)
) AS metadata;
COMMIT;
```

## Transaction 2

```sql
BEGIN TRANSACTION READ ONLY;
SET LOCAL statement_timeout='5s';
SET LOCAL lock_timeout='1s';
SELECT jsonb_build_object(
 'read_only',current_setting('transaction_read_only'),
 'columns',(SELECT coalesce(jsonb_agg(to_jsonb(x)),'[]') FROM (SELECT table_name,column_name,data_type,is_nullable,column_default FROM information_schema.columns WHERE table_schema='public' AND table_name IN ('products','categories','brands') ORDER BY table_name,ordinal_position LIMIT 100) x),
 'indexes',(SELECT coalesce(jsonb_agg(to_jsonb(x)),'[]') FROM (SELECT tablename,indexname,indexdef FROM pg_catalog.pg_indexes WHERE schemaname='public' AND tablename IN ('products','categories','brands') ORDER BY tablename,indexname LIMIT 40)x),
 'constraints',(SELECT coalesce(jsonb_agg(to_jsonb(x)),'[]') FROM (SELECT c.relname AS table_name,k.conname AS name,k.contype AS kind,pg_get_constraintdef(k.oid) AS definition FROM pg_catalog.pg_constraint k JOIN pg_catalog.pg_class c ON c.oid=k.conrelid JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relname IN ('products','categories','brands') ORDER BY c.relname,k.conname LIMIT 60)x),
 'policies',(SELECT coalesce(jsonb_agg(to_jsonb(x)),'[]') FROM (SELECT schemaname,tablename,policyname,permissive,roles,cmd,qual,with_check FROM pg_catalog.pg_policies WHERE (schemaname='public' AND tablename IN ('products','categories','brands')) OR (schemaname='storage' AND tablename IN ('objects','buckets')) ORDER BY schemaname,tablename,policyname LIMIT 80)x),
 'table_grants',(SELECT coalesce(jsonb_agg(to_jsonb(x)),'[]') FROM (SELECT table_schema,table_name,grantee,privilege_type,is_grantable FROM information_schema.role_table_grants WHERE (table_schema='public' AND table_name IN ('products','categories','brands')) OR (table_schema='storage' AND table_name IN ('objects','buckets')) ORDER BY table_schema,table_name,grantee,privilege_type LIMIT 200)x),
 'public_functions',(SELECT coalesce(jsonb_agg(to_jsonb(x)),'[]') FROM (SELECT p.proname AS name,pg_get_function_identity_arguments(p.oid) AS arguments,pg_get_function_result(p.oid) AS result_type,p.prosecdef AS security_definer,pg_get_userbyid(p.proowner) AS owner,md5(p.prosrc) AS body_hash FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' ORDER BY p.proname,p.oid LIMIT 80)x)
) AS metadata;
COMMIT;
```

## Transaction 3

```sql
BEGIN TRANSACTION READ ONLY;
SET LOCAL statement_timeout='5s';
SET LOCAL lock_timeout='1s';
SELECT jsonb_build_object(
 'read_only',current_setting('transaction_read_only'),
 'bucket_metadata',(SELECT coalesce(jsonb_agg(to_jsonb(x)),'[]') FROM (SELECT id,name,public,file_size_limit,allowed_mime_types FROM storage.buckets ORDER BY id LIMIT 30)x),
 'storage_rls',(SELECT coalesce(jsonb_agg(to_jsonb(x)),'[]') FROM (SELECT c.relname AS name,c.relrowsecurity AS enabled,c.relforcerowsecurity AS forced FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='storage' AND c.relname IN ('objects','buckets') ORDER BY c.relname)x),
 'roles',(SELECT coalesce(jsonb_agg(to_jsonb(x)),'[]') FROM (SELECT rolname,rolsuper,rolinherit,rolcreaterole,rolcreatedb,rolcanlogin,rolbypassrls FROM pg_catalog.pg_roles WHERE rolname IN ('postgres','anon','authenticated','authenticator','service_role','supabase_auth_admin','supabase_storage_admin') ORDER BY rolname LIMIT 10)x),
 'role_memberships',(SELECT coalesce(jsonb_agg(to_jsonb(x)),'[]') FROM (SELECT member.rolname AS member,granted.rolname AS granted_role,m.admin_option FROM pg_catalog.pg_auth_members m JOIN pg_catalog.pg_roles member ON member.oid=m.member JOIN pg_catalog.pg_roles granted ON granted.oid=m.roleid WHERE member.rolname IN ('anon','authenticated','authenticator','service_role') ORDER BY member.rolname,granted.rolname LIMIT 30)x),
 'column_grants',(SELECT coalesce(jsonb_agg(to_jsonb(x)),'[]') FROM (SELECT c.relname AS table_name,a.attname AS column_name,a.attacl::text AS acl FROM pg_catalog.pg_attribute a JOIN pg_catalog.pg_class c ON c.oid=a.attrelid JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relname IN ('products','categories','brands') AND a.attnum>0 AND NOT a.attisdropped AND a.attacl IS NOT NULL LIMIT 30)x),
 'schema_access',(SELECT coalesce(jsonb_agg(to_jsonb(x)),'[]') FROM (SELECT r.rolname AS role,n.nspname AS schema,has_schema_privilege(r.oid,n.oid,'USAGE') AS usage,has_schema_privilege(r.oid,n.oid,'CREATE') AS create_privilege FROM pg_catalog.pg_roles r CROSS JOIN pg_catalog.pg_namespace n WHERE r.rolname IN ('anon','authenticated') AND n.nspname IN ('public','auth','storage') ORDER BY r.rolname,n.nspname LIMIT 10)x),
 'settings',(SELECT coalesce(jsonb_agg(to_jsonb(x)),'[]') FROM (SELECT name,setting,unit FROM pg_catalog.pg_settings WHERE name IN ('max_connections','statement_timeout','server_version') ORDER BY name LIMIT 5)x)
) AS metadata;
COMMIT;
```
