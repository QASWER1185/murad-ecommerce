import {startFixture} from '../phase3/local-fixture.mjs';
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
const f=await startFixture({legacyPr2Columns:true});let assertions=0;
try{
 const equal=(query,value)=>{assert.equal(f.sql(query),String(value));assertions++;};
 equal('SELECT count(*) FROM public.products p JOIN public.phase8_legacy_snapshot s USING(id) WHERE to_jsonb(p) @> s.data;',6);
 equal("SELECT count(*) FROM public.products p JOIN public.phase8_legacy_snapshot s USING(id) WHERE publication_status='draft' AND NOT identity_verified AND NOT content_verified AND price_verified_at IS NULL AND stock_verified_at IS NULL;",6);
 equal(f.as(null,'SELECT count(*) FROM public.catalog_products_public;'),0);
 equal('SELECT count(*) FROM app_private.catalog_worker_keys;',0);
 equal('SELECT count(*) FROM app_private.order_gateway_keys;',0);
 assert.throws(()=>f.sql(f.as(null,'SELECT * FROM public.products;')),/permission denied/);assertions++;
 assert.throws(()=>f.sql(f.as('ordinary',"INSERT INTO app_private.user_roles(user_id,role) VALUES(auth.uid(),'admin');")),/permission denied/);assertions++;
 const result={scope:'disposable local PostgreSQL only',migrations:12,legacyProductsPreserved:6,legacySamplesRemainUnverifiedDrafts:true,assertions,foundationAssertions:f.assertions};
 mkdirSync('work/phase8-review',{recursive:true});
 writeFileSync('work/phase8-review/legacy-stack.json',JSON.stringify(result,null,2)+'\n');console.log(result);
}finally{await f.close();}
