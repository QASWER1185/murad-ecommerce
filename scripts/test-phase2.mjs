// The runner never reads .env files, accepts database URLs, or publishes ports.
// Docker uses an explicit local socket, preventing inherited remote daemon URLs.
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import assert from 'node:assert/strict';
const container = `murad-phase2-${randomUUID().slice(0,8)}`;
const docker = ['--host=unix:///var/run/docker.sock'];
const env = { ...process.env };
for (const key of ['DOCKER_HOST','DOCKER_CONTEXT','DOCKER_TLS','DOCKER_TLS_VERIFY','DOCKER_CERT_PATH']) delete env[key];
function run(args, input) {
  const result = spawnSync('docker',[...docker,...args],{input,encoding:'utf8',env,maxBuffer:4*1024*1024});
  if (result.status !== 0) throw new Error(result.stderr || result.stdout || String(result.error));
  return result.stdout.trim();
}
function sql(text) { return run(['exec','-i',container,'psql','-U','postgres','-v','ON_ERROR_STOP=1','-qAt'],text); }
let assertions=0;
function equal(query,expected) { assert.equal(sql(query),String(expected),query); assertions++; }
function denied(query,fragment) { assert.throws(()=>sql(query),fragment,query); assertions++; }
const admin='00000000-0000-0000-0000-000000000001';
const editor='00000000-0000-0000-0000-000000000002';
const outsider='00000000-0000-0000-0000-000000000003';
function as(user,query) { return `SET ROLE authenticated; SET request.jwt.claim.sub='${user}'; ${query}`; }
try {
  run(['run','-d','--name',container,'--label','murad.phase=2','--network','none','-e','POSTGRES_HOST_AUTH_METHOD=trust','postgres:17-alpine@sha256:3540c0362c809df084ffac0ae69fe794515f9de92692f02178bcdce0ef0302ac']);
  let initialized=false;
  for(let i=0;i<100;i++) {
    const ready=spawnSync('docker',[...docker,'exec',container,'pg_isready','-U','postgres'],{env,stdio:'ignore'});
    if(ready.status===0 && run(['logs',container]).includes('init process complete')) { initialized=true; break; }
    await new Promise(resolve=>setTimeout(resolve,500));
  }
  assert(initialized,'Local PostgreSQL did not finish initialization');
  assert.equal(run(['inspect','--format','{{.HostConfig.NetworkMode}}',container]),'none');
  const bootstrap=readFileSync('tests/phase2/bootstrap.sql','utf8'); sql(bootstrap);
  const migrationNames=['20261106055003_initial_ecommerce_schema.sql','20261106064811_seed_initial_products.sql'];
  for(const name of migrationNames) sql(readFileSync(`supabase/migrations/${name}`,'utf8'));
  const withPr2 = process.argv.includes('--with-pr2-columns');
  if (withPr2) sql('ALTER TABLE public.products ADD COLUMN model text, ADD COLUMN product_type text, ADD COLUMN finish text;');
  sql('GRANT SELECT ON public.products,public.categories,public.brands TO anon,authenticated; CREATE TABLE public.test_legacy_snapshot AS SELECT id,to_jsonb(p) AS data FROM public.products p;');
  const foundation=readFileSync('supabase/migrations/20261108000100_catalog_foundation.sql','utf8');
  denied(foundation,/Catalog cutover not approved/);
  equal("SELECT count(*) FROM information_schema.columns WHERE table_name='products' AND column_name='publication_status';",0);
  equal('SELECT count(*) FROM public.products;',6);
  sql('CREATE POLICY unexpected_policy ON public.products FOR SELECT USING (true);');
  denied(`SET app.catalog_cutover_approved='yes'; ${foundation}`,/Unrecognized legacy catalog policies/);
  sql('DROP POLICY unexpected_policy ON public.products;');
  sql('GRANT UPDATE(name) ON public.products TO authenticated;');
  denied(`SET app.catalog_cutover_approved='yes'; ${foundation}`,/Unrecognized legacy column grants/);
  sql('REVOKE UPDATE(name) ON public.products FROM authenticated;');
  sql(`SET app.catalog_cutover_approved='yes'; ${foundation}`);
  sql(`SET app.catalog_cutover_approved='yes'; ${readFileSync('supabase/migrations/20261108000200_catalog_workflow.sql','utf8')}`);
  equal('SELECT count(*) FROM public.products p JOIN public.test_legacy_snapshot s USING(id) WHERE to_jsonb(p) @> s.data;',6);
  equal("SELECT count(*) FROM public.products WHERE publication_status='draft' AND NOT identity_verified AND NOT content_verified AND price_verified_at IS NULL AND stock_verified_at IS NULL;",6);
  equal('SET ROLE anon; SELECT count(*) FROM public.catalog_products_public;',0);
  denied('SET ROLE anon; SELECT * FROM public.products;',/permission denied/);
  denied(as(outsider,'SELECT * FROM app_private.user_roles;'),/permission denied/);
  sql(`INSERT INTO app_private.user_roles(user_id,role) VALUES('${admin}','admin'),('${editor}','editor');`);
  equal(as(outsider,'SELECT count(*) FROM public.products;'),0);
  equal(as(editor,'SELECT count(*) FROM public.products;'),6);
  denied(as(editor,"INSERT INTO public.products(name,slug) VALUES('forbidden','forbidden');"),/row-level security/);
  denied(as(admin,`INSERT INTO app_private.user_roles VALUES('${outsider}','admin',now());`),/permission denied/);
  denied(as(admin,"INSERT INTO public.products(name,slug,publication_status) VALUES('bad','bad','published');"),/permission denied/);
  denied(as(outsider,'SELECT public.catalog_admin_preview(gen_random_uuid());'),/Authorized catalog preview/);
  denied('SET ROLE anon; SELECT public.catalog_admin_preview(gen_random_uuid());',/permission denied/);
  // The fixture database is synthetic; no production IDs or credentials are used.
  const pid=sql("INSERT INTO public.products(name,slug,sku,description,seo_title,seo_description,price,stock_status) VALUES('Local test product','local-test-product','LOCAL-1','Verified local test description','Local test title','Local test meta',12345,'in_stock') RETURNING id;").split('\n')[0];
  const version=()=>Number(sql(`SELECT version FROM public.products WHERE id='${pid}';`));
  denied(as(admin,`SELECT public.submit_catalog_review('product','${pid}',NULL);`),/Stale/);
  equal(as(editor,`SELECT (public.catalog_admin_preview('${pid}')->>'sku');`),'LOCAL-1');
  denied(as(editor,`SELECT public.submit_catalog_review('product','${pid}',${version()});`),/administrator required/);
  denied(as(admin,`SELECT public.publish_catalog_entity('product','${pid}',${version()},false);`),/current-version review/);
  sql(as(admin,`SELECT public.submit_catalog_review('product','${pid}',${version()});`));
  denied(as(admin,`SELECT public.publish_catalog_entity('product','${pid}',${version()},false);`),/current-version review/);
  denied(as(admin,`SELECT public.review_catalog_entity('product','${pid}',${version()},'{"identity":"true"}');`),/Invalid verification/);
  sql(as(admin,`SELECT public.review_catalog_entity('product','${pid}',${version()},'{"identity":true,"content":true}');`));
  denied(as(admin,`SELECT public.publish_catalog_entity('product','${pid}',${version()},true);`),/Indexing requirements/);
  sql(as(admin,`SELECT public.publish_catalog_entity('product','${pid}',${version()},false);`));
  equal(`SET ROLE anon; SELECT count(*) FROM public.catalog_products_public WHERE id='${pid}';`,1);
  equal(`SET ROLE anon; SELECT count(*) FROM public.catalog_routes_public WHERE id='${pid}' AND is_indexable;`,0);
  equal(`SET ROLE anon; SELECT price IS NULL AND availability='unknown' FROM public.catalog_products_public WHERE id='${pid}';`,'t');
  equal(as(admin,`UPDATE public.products SET name='should not change' WHERE id='${pid}'; SELECT name FROM public.products WHERE id='${pid}';`),'Local test product');
  denied(as(admin,`UPDATE public.products SET identity_verified=true WHERE id='${pid}';`),/permission denied/);
  denied(as(editor,`UPDATE public.product_revisions SET snapshot='{}';`),/permission denied/);
  denied(as(admin,`DELETE FROM public.products WHERE id='${pid}';`),/permission denied/);
  denied(as(admin,`SELECT public.rename_catalog_slug('product','${pid}',0,'new-test-slug');`),/Stale/);
  sql(as(admin,`SELECT public.rename_catalog_slug('product','${pid}',${version()},'renamed-local-product');`));
  equal("SET ROLE anon; SELECT destination_path FROM public.catalog_redirects_public WHERE source_path='/product/local-test-product';",'/product/renamed-local-product');
  denied(as(admin,"INSERT INTO public.products(name,slug) VALUES('Reused slug','local-test-product');"),/reserved by permanent/);
  sql(as(admin,`SELECT public.return_catalog_to_draft('product','${pid}',${version()});`));
  equal('SET ROLE anon; SELECT count(*) FROM public.catalog_products_public;',0);
  equal('SET ROLE anon; SELECT count(*) FROM public.catalog_redirects_public;',0);
  denied(as(admin,`UPDATE public.products SET slug='bypass-rename' WHERE id='${pid}';`),/permanent/);
  // Private media and placeholder verification boundaries.
  denied("SET ROLE anon; INSERT INTO storage.objects(bucket_id,name) VALUES('catalog-private','anonymous.png');",/row-level security/);
  denied(as(editor,"INSERT INTO storage.objects(bucket_id,name) VALUES('catalog-private','editor.png');"),/row-level security/);
  sql(as(admin,"INSERT INTO storage.objects(bucket_id,name) VALUES('catalog-private','verified-test.png');"));
  equal('SET ROLE anon; SELECT count(*) FROM storage.objects;',0);
  equal(as(admin,"UPDATE storage.objects SET name='overwrite.png' WHERE name='verified-test.png'; SELECT name FROM storage.objects WHERE name='verified-test.png';"),'verified-test.png');
  equal(as(admin,"DELETE FROM storage.objects WHERE bucket_id='catalog-private'; SELECT count(*) FROM storage.objects;"),1);
  const media=sql("INSERT INTO public.catalog_media(object_name,mime_type,alt_text,width,height,is_placeholder) VALUES('verified-test.png','image/png','Local image',200,200,false) RETURNING id;").split('\n')[0];
  denied(as(editor,`SELECT public.verify_catalog_media('${media}');`),/administrator required/);
  sql(as(admin,`SELECT public.verify_catalog_media('${media}'); INSERT INTO public.product_images(product_id,media_id) VALUES('${pid}','${media}');`));
  equal('SET ROLE anon; SELECT count(*) FROM public.catalog_images_public;',0);
  denied(as(admin,`INSERT INTO public.products(name,slug,sku) VALUES('Duplicate','duplicate',' local-1 ');`),/duplicate key/);
  denied(as(admin,`SELECT public.submit_catalog_review('products;DROP TABLE products','${pid}',${version()});`),/Unknown catalog entity/);
  // Positive indexing fixture: explicit taxonomy review, real-media attestation,
  // optional price, then separately verified commerce fields. All data is local.
  function create(table,fields) { return sql(as(admin,`INSERT INTO public.${table} ${fields} RETURNING id;`)).split('\n')[0]; }
  function entityVersion(table,id) { return Number(sql(`SELECT version FROM public.${table} WHERE id='${id}';`)); }
  function publish(kind,table,id,index=true,commerce=false) {
    const v=entityVersion(table,id);
    sql(as(admin,`SELECT public.submit_catalog_review('${kind}','${id}',${v}); SELECT public.review_catalog_entity('${kind}','${id}',${v},'{"identity":true,"content":true${commerce?',"price":true,"stock":true':''}}'); SELECT public.publish_catalog_entity('${kind}','${id}',${v},${index});`));
  }
  const category=create('categories',"(name,slug,description,seo_title,seo_description) VALUES('Local category','local-category','Useful local category information','Category title','Category description')");
  const brand=create('brands',"(name,slug,description,seo_title,seo_description) VALUES('Local brand','local-brand','Useful local manufacturer information','Brand title','Brand description')");
  denied(as(admin,`SELECT public.submit_catalog_review('category','${category}',NULL);`),/Stale/);
  publish('category','categories',category); publish('brand','brands',brand);
  equal(`SET ROLE anon; SELECT count(*) FROM public.catalog_routes_public WHERE id IN ('${category}','${brand}') AND is_indexable;`,2);
  const complete=create('products',`(name,slug,sku,category_id,brand_id,description,seo_title,seo_description) VALUES('Complete local fixture','complete-local-fixture','LOCAL-COMPLETE','${category}','${brand}','Unique useful local fixture specifications','Complete fixture title','Complete fixture meta description')`);
  sql(as(admin,`INSERT INTO public.product_images(product_id,media_id) VALUES('${complete}','${media}');`));
  publish('product','products',complete);
  equal(`SELECT jsonb_array_length(snapshot->'gallery')=1 AND jsonb_array_length(snapshot->'category_memberships')=1 FROM public.product_revisions WHERE product_id='${complete}' AND workflow_state='published';`,'t');
  denied(as(admin,`SELECT public.rename_catalog_slug('product','${complete}',NULL,'null-version');`),/Stale/);
  equal(`SET ROLE anon; SELECT is_indexable AND price IS NULL AND availability='unknown' FROM public.catalog_products_public WHERE id='${complete}';`,'t');
  equal(`SET ROLE anon; SELECT count(*) FROM public.catalog_images_public WHERE product_id='${complete}';`,1);
  equal(`SET ROLE anon; SELECT count(*) FROM public.catalog_product_categories_public WHERE product_id='${complete}' AND category_id='${category}';`,1);
  denied(as(admin,`INSERT INTO public.product_images(product_id,media_id) VALUES('${complete}','${media}');`),/row-level security/);
  sql(as(admin,`SELECT public.return_catalog_to_draft('product','${complete}',${entityVersion('products',complete)}); UPDATE public.products SET price=2500,stock_status='in_stock' WHERE id='${complete}';`));
  publish('product','products',complete,true,true);
  equal(`SET ROLE anon; SELECT price=2500 AND availability='in_stock' FROM public.catalog_products_public WHERE id='${complete}';`,'t');
  sql(as(admin,`SELECT public.return_catalog_to_draft('product','${complete}',${entityVersion('products',complete)}); UPDATE public.products SET sales_mode='quotation' WHERE id='${complete}';`));
  publish('product','products',complete,true,true);
  equal(`SET ROLE anon; SELECT price IS NULL AND sales_mode='quotation' AND is_indexable FROM public.catalog_products_public WHERE id='${complete}';`,'t');
  sql(as(admin,`SELECT public.return_catalog_to_draft('product','${complete}',${entityVersion('products',complete)}); UPDATE public.products SET sales_mode='online' WHERE id='${complete}'; SELECT public.return_catalog_to_draft('category','${category}',${entityVersion('categories',category)}); UPDATE public.categories SET default_sales_mode='quotation' WHERE id='${category}';`));
  publish('category','categories',category); publish('product','products',complete,true,true);
  equal(`SET ROLE anon; SELECT price IS NULL AND sales_mode='quotation' FROM public.catalog_products_public WHERE id='${complete}';`,'t');
  // Withdrawing a category removes product indexing, not the reviewed product URL.
  sql(as(admin,`SELECT public.return_catalog_to_draft('category','${category}',${entityVersion('categories',category)});`));
  equal(`SET ROLE anon; SELECT NOT is_indexable FROM public.catalog_products_public WHERE id='${complete}';`,'t');
  denied(as(admin,`SELECT public.archive_catalog_entity('product','${complete}',0);`),/Stale/);
  sql(as(admin,`SELECT public.archive_catalog_entity('product','${complete}',${entityVersion('products',complete)});`));
  equal(`SET ROLE anon; SELECT count(*) FROM public.catalog_products_public WHERE id='${complete}';`,0);
  equal(`SELECT count(*)>0 FROM app_private.audit_log WHERE entity_id='${complete}' AND actor_id='${admin}';`,'t');
  equal(`SELECT count(*)>0 FROM app_private.invalidation_events WHERE entity_id='${complete}' AND processed_at IS NULL;`,'t');
  const placeholder=create('catalog_media',"(object_name,mime_type,alt_text,width,height) VALUES('placeholder.png','image/png','Placeholder',200,200)");
  denied(as(admin,`SELECT public.verify_catalog_media('${placeholder}');`),/real image/);
  denied(as(admin,`UPDATE public.catalog_media SET verified_at=now() WHERE id='${placeholder}';`),/permission denied/);
  const child=create('categories',`(name,slug,parent_id) VALUES('Child','child','${category}')`);
  denied(as(admin,`UPDATE public.categories SET parent_id='${child}' WHERE id='${category}';`),/hierarchy cycle/);
  sql("INSERT INTO storage.buckets(id,name,public) VALUES('unrelated-public','unrelated-public',true); INSERT INTO storage.objects(bucket_id,name) VALUES('unrelated-public','unrelated.jpg');");
  equal("SET ROLE anon; SELECT count(*) FROM storage.objects WHERE bucket_id='unrelated-public';",1);
  equal('SELECT count(*) FROM public.test_legacy_snapshot;',6);
  console.log(`PostgreSQL 17 (${withPr2?'PR #2 optional-column fixture':'latest-main fixture'}): ${assertions} assertions passed; migration guard, legacy preservation, RLS, workflow, views, media and redirects. Container network=none; no host ports.`);
} finally {
  // Exact ephemeral target generated above; never touch other containers/data.
  run(['rm','-f','-v',container]);
}
