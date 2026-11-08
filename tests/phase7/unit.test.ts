import test from "node:test";
import assert from "node:assert/strict";
import { workerConfig, workerEnvelope, workerSignature, verifyWorkerRequest, queueAlert } from "../../src/lib/worker/contracts";
import { productStructuredData, merchantReadiness } from "../../src/lib/seo/structured";
import type { Product } from "../../src/lib/storefront/types";
import type { PublicRoute } from "../../src/lib/catalog/publication";
const env={CATALOG_WORKER_ENABLED:'true',CATALOG_WORKER_ENVIRONMENT:'local',CATALOG_WORKER_SUPABASE_URL:'http://127.0.0.1:54321',CATALOG_WORKER_SITE_ORIGIN:'http://127.0.0.1:3100',CATALOG_WORKER_PUBLISHABLE_KEY:'local-only',CATALOG_WORKER_KEY_ID:'synthetic',CATALOG_WORKER_SECRET:'a'.repeat(64)};
test('worker configuration fails closed for production, remote local services and privileged credentials',()=>{
  assert.equal(workerConfig({}),null);
  for(const change of [{CATALOG_WORKER_ENVIRONMENT:'production'},{CATALOG_WORKER_SUPABASE_URL:'https://remote.invalid'},{CATALOG_WORKER_PUBLISHABLE_KEY:'sb_secret_denied'},{CATALOG_WORKER_SECRET:'short'},{CATALOG_WORKER_SITE_ORIGIN:'http://127.0.0.1:3100/path'}]) assert.throws(()=>workerConfig({...env,...change}));
});
test('machine signature binds exact bytes, domain, origin, action and fresh bounded claim',()=>{
  const config=workerConfig(env)!;
  const e=workerEnvelope(config,'claim',{limit:25}),sig=workerSignature(e,config.secret);
  assert(verifyWorkerRequest(e,sig,config));
  assert(!verifyWorkerRequest(e+' ',sig,config));
  assert(!verifyWorkerRequest(e,sig,config,Date.now()+120000));
  for(const change of [{action:'ack'},{origin:'https://bad.invalid'},{limit:26},{v:'order-gateway-v1'},{issued:0}]) {const bad=JSON.stringify({...JSON.parse(e),...change});assert(!verifyWorkerRequest(bad,workerSignature(bad,config.secret),config));}
});
test('queue alerts have explicit backlog age and retry thresholds',()=>{
  assert(!queueAlert({pending:0,oldest_seconds:999,leased:0,retrying:0}));
  assert(queueAlert({pending:1,oldest_seconds:301,leased:0,retrying:0}));
  assert(queueAlert({pending:1,oldest_seconds:1,leased:0,retrying:1}));
});
const route:PublicRoute={id:'synthetic-id',kind:'product',name:'Synthetic fixture',slug:'synthetic-fixture',canonical_path:'/product/synthetic-fixture',seo_title:'Synthetic test title',seo_description:'Synthetic testing only description',is_indexable:true,updated_at:'2026-11-08T00:00:00Z'};
const product={id:route.id,name:route.name,slug:route.slug,is_indexable:true,description:'Synthetic fixture description',sku:null,model:null,brand:null,gallery:[],price:null,currency:'PKR',sales_mode:'online',availability:'unknown'} as unknown as Product;
const ctx={production:true,indexingEnabled:true};
test('structured data shares eligibility, supports missing price without fabricating offers',()=>{
  assert.equal(productStructuredData(product,route,{...ctx,indexingEnabled:false},'https://example.invalid',true),null);
  assert.equal(productStructuredData(product,route,{...ctx,searchOrFilter:true},'https://example.invalid',true),null);
  const data=productStructuredData(product,route,ctx,'https://example.invalid',true)!;
  assert.equal(data['@type'],'Product');assert(!('offers' in data));assert(!('aggregateRating' in data));assert(!('sku' in data));
  assert.equal(productStructuredData({...product,id:'wrong'},route,ctx,'https://example.invalid',true),null);
});
test('offers require real projected positive prices; unknown availability omitted and quotations have no offer',()=>{
  const priced={...product,price:100};
  const data=productStructuredData(priced,route,ctx,'https://example.invalid',true)!;
  assert.equal(data.offers?.price,100);assert(!('availability' in data.offers!));
  assert(!productStructuredData({...priced,sales_mode:'quotation'},route,ctx,'https://example.invalid',true)?.offers);
  assert(!productStructuredData({...priced,price:0},route,ctx,'https://example.invalid',true)?.offers);
});
test('merchant readiness never invents identifiers, shipping/returns policies or feed approval',()=>{
  const result=merchantReadiness(product,route,ctx,true);assert.equal(result.ready,false);assert(result.missing.includes('verified_online_price'));assert(result.missing.includes('verified_availability'));assert(result.missing.includes('manufacturer_identifier_review'));
});
// Preflight must not treat identical staging/production targets as safe.
import { spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
test('staging preflight is offline, rejects production identity and never prints secrets',()=>{
 const value={...process.env,STAGING_PROJECT_REF:'synthetic-local-check',PRODUCTION_PROJECT_REF:'production-deny-target',PRODUCTION_SITE_ORIGIN:'https://production-deny.example.invalid',ADMIN_ENVIRONMENT:'staging',CATALOG_ENVIRONMENT:'staging',CATALOG_WORKER_ENVIRONMENT:'staging',CATALOG_INDEXING_ENABLED:'false',ANALYTICS_ENABLED:'false',ADMIN_RATE_LIMIT_SECRET:randomBytes(32).toString('hex'),ORDER_GATEWAY_SECRET:randomBytes(32).toString('hex'),CATALOG_WORKER_SECRET:randomBytes(32).toString('hex')} as Record<string,string>;
 for(const prefix of ['ADMIN','CATALOG','CATALOG_WORKER']){value[`${prefix}_SUPABASE_URL`]='https://synthetic-local-check.supabase.co';value[`${prefix}_SITE_ORIGIN`]='https://staging-synthetic.test.invalid';}
 value.ADMIN_SUPABASE_PUBLISHABLE_KEY='synthetic-anon';value.CATALOG_SUPABASE_PUBLISHABLE_KEY='synthetic-anon';value.CATALOG_WORKER_PUBLISHABLE_KEY='synthetic-anon';
 const run=(change:Record<string,string>={})=>spawnSync(process.execPath,['scripts/phase7/check-config.mjs'],{env:{...value,...change} as NodeJS.ProcessEnv,encoding:'utf8'});
 const good=run();assert.equal(good.status,0,good.stdout);assert(!good.stdout.includes(value.CATALOG_WORKER_SECRET));
 assert.notEqual(run({STAGING_PROJECT_REF:value.PRODUCTION_PROJECT_REF}).status,0);
 assert.notEqual(run({ADMIN_SUPABASE_URL:'https://production-deny-target.supabase.co'}).status,0);
 assert.notEqual(run({CATALOG_INDEXING_ENABLED:'true'}).status,0);
});
