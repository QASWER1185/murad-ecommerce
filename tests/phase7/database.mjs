import assert from "node:assert/strict";
import { createHmac, randomBytes, randomUUID } from "node:crypto";
export function workerFixture(f, keyId = "synthetic-phase7") {
  const secret = randomBytes(32).toString("hex"), origin = "http://127.0.0.1:3100";
  f.sql(`INSERT INTO app_private.catalog_worker_keys(key_id,signing_secret,origin) VALUES('${keyId}','${secret}','${origin}');`);
  const envelope = (action, fields = {}) => {
    const p_envelope = JSON.stringify({ v: "catalog-worker-v1", key_id: keyId, origin, action, nonce: randomUUID(), issued: Math.floor(Date.now()/1000), ...fields });
    return { p_envelope, p_signature: createHmac("sha256",secret).update(`catalog-worker-v1:${p_envelope}`).digest("hex") };
  };
  const query = args => f.as(null,`SELECT public.catalog_worker_gateway(${f.literal(args.p_envelope)},${f.literal(args.p_signature)});`);
  const rpc = (action, fields) => JSON.parse(f.sql(query(envelope(action,fields))));
  return { secret, keyId, origin, envelope, query, rpc };
}
export async function hardeningDatabaseTests(f, s) {
  let checks = 0;
  const check = (value, message) => { assert(value,message); checks++; };
  const denied = (fn, pattern = /permission denied|DENIED|administrator|preview/) => { assert.throws(fn,pattern);checks++; };
  check(f.sql('SELECT count(*) FROM app_private.catalog_worker_keys;') === '0', 'migration provisions no worker secret');
  const w = workerFixture(f), q = f.literal;
  check(f.sql("SELECT proconfig @> ARRAY['enable_nestloop=off','jit=off'] FROM pg_proc WHERE oid='public.catalog_storefront(text,text,jsonb)'::regprocedure;")==='t','Planner tuning is scoped to the public RPC');
  const args={p_kind:'category',p_slug:'sanitary',p_query:{}};
  const tuned=s.rpc('catalog_storefront',args,null);
  try {
    f.sql('ALTER FUNCTION public.catalog_storefront(text,text,jsonb) RESET enable_nestloop;ALTER FUNCTION public.catalog_storefront(text,text,jsonb) RESET jit;');
    assert.deepEqual(s.rpc('catalog_storefront',args,null),tuned,'Planner strategy must not change public DTOs');checks++;
  } finally {f.sql('ALTER FUNCTION public.catalog_storefront(text,text,jsonb) SET enable_nestloop=off;ALTER FUNCTION public.catalog_storefront(text,text,jsonb) SET jit=off;');}

  for (const role of [null,"ordinary","editor","admin"]) {
    denied(()=>f.sql(f.as(role,'SELECT * FROM app_private.catalog_worker_keys;')));
    denied(()=>f.sql(f.as(role,'SELECT * FROM app_private.catalog_security_policy;')));
    denied(()=>f.sql(f.as(role,'UPDATE app_private.catalog_security_policy SET require_mfa=false;')));
  }
  const signed = w.envelope("stats");
  denied(()=>f.sql(w.query({...signed,p_signature:'0'.repeat(64)})),/WORKER_DENIED/);
  denied(()=>f.sql(w.query({...signed,p_envelope:signed.p_envelope.replace('stats','claim')})),/WORKER_DENIED/);
  denied(()=>f.sql(w.query(w.envelope('stats',{issued:Math.floor(Date.now()/1000)-121}))),/WORKER_EXPIRED/);
  denied(()=>f.sql(w.query(w.envelope('stats',{origin:'https://wrong.invalid'}))),/WORKER_DENIED/);
  for (const action of ['publish','role','orders','media']) denied(()=>w.rpc(action),/WORKER_DENIED/);
  f.sql(w.query(signed));denied(()=>f.sql(w.query(signed)),/WORKER_REPLAY/);
  denied(()=>w.rpc('claim',{limit:26}),/Bounded/);
  f.sql("UPDATE app_private.invalidation_events SET processed_at=now(),lease_until=NULL,lease_token=NULL;");
  f.sql("INSERT INTO app_private.invalidation_events(entity_type,entity_id) SELECT 'product',gen_random_uuid() FROM generate_series(1,40);");
  const peer=workerFixture(f,'synthetic-phase7-peer');
  const results = await Promise.all([f.asyncSql('BEGIN;'+w.query(w.envelope('claim',{limit:25}))+"SELECT pg_sleep(0.15);COMMIT;"), f.asyncSql(peer.query(peer.envelope('claim',{limit:25})))]);
  const [a,b] = results.map(JSON.parse), all=[...a,...b];
  check(all.length===40,'concurrent workers claim every event once');
  check(new Set(all.map(e=>e.id)).size===40,'SKIP LOCKED leases do not overlap');
  check(all.every(e=>Object.keys(e).sort().join(',')==='id,token'),'worker never receives catalog/customer records');
  const event=all[0];
  check(w.rpc('ack',{...event,token:randomUUID(),outcome:'ok'})===false,'forged lease cannot ack');
  check(w.rpc('ack',{...event,outcome:'retry'})===true,'retry stores only fixed safe error');
  check(w.rpc('claim',{limit:25}).length===0,'retry backoff prevents immediate hot loop');
  f.sql(`UPDATE app_private.invalidation_events SET lease_until=now()-interval '1 second' WHERE id=${event.id};`);
  const reclaimed=w.rpc('claim',{limit:1})[0];
  check(reclaimed.id===event.id && reclaimed.token!==event.token,'crash/retry gets fresh token');
  check(w.rpc('ack',{...event,outcome:'ok'})===false,'old token cannot erase newer lease');
  check(w.rpc('ack',{...reclaimed,outcome:'ok'})===true,'current lease ack succeeds');
  const newId=f.sql("INSERT INTO app_private.invalidation_events(entity_type,entity_id) VALUES('product',gen_random_uuid()) RETURNING id;");
  check(w.rpc('ack',{...reclaimed,outcome:'ok'})===false,'duplicate ack is harmless');
  check(f.sql(`SELECT processed_at IS NULL FROM app_private.invalidation_events WHERE id=${newId};`)==='t','ack cannot erase concurrently enqueued change');
  const outstanding=all[1];
  f.sql(`UPDATE app_private.invalidation_events SET lease_until=now()-interval '1 second' WHERE id=${outstanding.id};`);
  check(w.rpc('ack',{...outstanding,outcome:'ok'})===false,'expired lease cannot ack');
  check(w.rpc('stats').pending===40,'aggregate pending health');
  f.sql(`UPDATE app_private.catalog_worker_keys SET active=false WHERE key_id='${w.keyId}';`);
  denied(()=>w.rpc('stats'),/WORKER_DENIED/);
  f.sql(`UPDATE app_private.catalog_worker_keys SET active=true WHERE key_id='${w.keyId}';`);
  f.sql('UPDATE app_private.catalog_security_policy SET require_mfa=true;');
  check(JSON.parse(f.sql(f.as('admin','SELECT public.catalog_session_access();'))).mfa_required===true,'MFA policy visible only as own access status');
  check(f.sql(f.as('admin','SELECT count(*) FROM public.products;'))==='0','AAL1 admin cannot read raw drafts');
  check(f.sql(f.as('editor','SELECT count(*) FROM public.products;'))==='0','AAL1 editor cannot read raw drafts');
  denied(()=>s.rpc('save_product_draft',{product_id:null,expected_version:null,input:{name:'Denied',slug:'denied',specifications:{}}}),/administrator/);
  denied(()=>f.sql(f.as('admin',`SELECT public.catalog_admin_preview(${q(s.products[0]?.id || s.first)});`)),/preview|uuid/);
  check(f.sql(f.as('admin','SELECT app_private.is_admin();','aal2'))==='t','AAL2 trusted administrator permitted');
  check(f.sql(f.as('editor','SELECT app_private.is_admin();','aal2'))==='f','AAL2 editor remains read-only');
  check(f.sql(f.as('ordinary','SELECT app_private.is_staff();','aal2'))==='f','AAL2 never grants ordinary user a role');
  check(f.sql(f.as('admin','SELECT count(*)>0 FROM public.products;','aal2'))==='t','AAL2 role can read drafts under RLS');
  denied(()=>f.sql(f.as('ordinary',"INSERT INTO app_private.user_roles VALUES(auth.uid(),'admin',now());",'aal2')));
  f.sql('UPDATE app_private.catalog_security_policy SET require_mfa=false;');
  check(f.sql("SELECT count(*)>=2 FROM app_private.audit_log WHERE entity_type='catalog_security_policy' AND action='SECURITY_UPDATE';")==='t','MFA activation/deactivation audited');
  check(f.sql(`SELECT count(*) FROM app_private.audit_log WHERE entity_type='catalog_worker_keys' AND (coalesce(before_data::text,'')||coalesce(after_data::text,'')) LIKE ${q('%'+w.secret+'%')};`)==='0','worker credential audit never records signing secrets');
  console.log(`Phase 7 database security: ${checks} assertions passed (real local PostgreSQL/RLS; synthetic Auth contract).`);
  return { checks, worker:w };
}
