// Read-only preflight. No network, credential output, account or schema changes.
import { readFileSync } from "node:fs";
const failures=[],pending=[];
const need=(ok,label)=>{if(!ok)failures.push(label);};
const env=process.env,staticOnly=process.argv.includes('--static');
const deployment=JSON.parse(readFileSync('vercel.json','utf8'));
need(deployment.git?.deploymentEnabled?.['development/staging-readiness']===false,'Development branch deployment must be disabled');
need(/productionReleaseApproved = false/.test(readFileSync('src/lib/storefront/config.ts','utf8')),'Production public-media/indexing release gate must remain closed');
if(!staticOnly){
  for(const prefix of ['ADMIN','CATALOG','CATALOG_WORKER']) need(env[`${prefix}_ENVIRONMENT`]==='staging',`${prefix} must explicitly select staging`);
  const services=['ADMIN_SUPABASE_URL','CATALOG_SUPABASE_URL','CATALOG_WORKER_SUPABASE_URL'];
  const sites=['ADMIN_SITE_ORIGIN','CATALOG_SITE_ORIGIN','CATALOG_WORKER_SITE_ORIGIN'];
  for(const key of [...services,...sites]){try{const u=new URL(env[key]);need(u.protocol==='https:'&&!u.username&&!u.password&&u.pathname==='/'&&!u.search&&!u.hash&&!/REPLACE|EXAMPLE/i.test(u.hostname),`${key}: explicit isolated HTTPS origin required`);}catch{need(false,`${key}: missing origin`);}}
  for(const key of services)try{need(new URL(env[key]).hostname===`${env.STAGING_PROJECT_REF}.supabase.co`,`${key}: must match the declared staging project reference`);}catch{}
  need(!!env.PRODUCTION_SITE_ORIGIN && env.PRODUCTION_SITE_ORIGIN!==env.ADMIN_SITE_ORIGIN,'Declare the production site origin as a deny target; staging must differ');
  need(new Set(services.map(k=>env[k])).size===1,'Use the same isolated Supabase instance for all subsystems');
  need(new Set(sites.map(k=>env[k])).size===1,'Use the same isolated application origin for all subsystems');
  need(env.STAGING_PROJECT_REF && env.STAGING_PROJECT_REF !== env.PRODUCTION_PROJECT_REF,'Explicit staging project identity must differ from production');
  need(!!env.PRODUCTION_PROJECT_REF,'Production project reference required as a deny target (never credentials)');
  for(const key of ['ADMIN_SUPABASE_PUBLISHABLE_KEY','CATALOG_SUPABASE_PUBLISHABLE_KEY','CATALOG_WORKER_PUBLISHABLE_KEY']){
    const value=env[key]||'';let safe=!!value&&!/REPLACE/i.test(value)&&!value.startsWith('sb_secret_');
    if(value.split('.').length===3)try{safe &&=JSON.parse(Buffer.from(value.split('.')[1],'base64url').toString()).role==='anon';}catch{safe=false;}
    need(safe,`${key}: unprivileged publishable key required`);
  }
  for(const key of ['ADMIN_RATE_LIMIT_SECRET','ORDER_GATEWAY_SECRET','CATALOG_WORKER_SECRET'])need(/^[a-f0-9]{64,128}$/.test(env[key]||'')&&!/^([a-f0-9])\1+$/.test(env[key]||''),`${key}: independent random private secret required`);
  need(new Set(['ADMIN_RATE_LIMIT_SECRET','ORDER_GATEWAY_SECRET','CATALOG_WORKER_SECRET'].map(k=>env[k])).size===3,'Secrets must be independent');
  need(env.CATALOG_INDEXING_ENABLED!=='true','Staging indexing must remain disabled');
  need(env.ANALYTICS_ENABLED!=='true','Staging real analytics must remain disabled until owner authorization');
  need(!Object.keys(env).some(k=>k.startsWith('NEXT_PUBLIC_')&&/SECRET|SERVICE_ROLE|GATEWAY|WORKER|RATE_LIMIT/.test(k)),'No privileged credentials in NEXT_PUBLIC variables');
  pending.push('Project identity, MFA AAL2 database/provider agreement, Auth/RLS/Storage, scheduler provisioning, backups and hosted limits require separately authorized real staging verification.');
}
console.log(JSON.stringify({scope:staticOnly?'static-local-only':'configuration-only-no-network',passed:!failures.length,failures,pending},null,2));
if(failures.length)process.exitCode=1;
