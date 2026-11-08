import {spawn} from 'node:child_process';
import {randomBytes} from 'node:crypto';
import {startFixture} from './phase3/local-fixture.mjs';
import {seedCatalog} from '../tests/phase5/fixture.mjs';
import {orderFixture} from '../tests/phase6/fixture.mjs';
import {workerFixture} from '../tests/phase7/database.mjs';
import {readinessBrowserTests,measureBrowser} from '../tests/phase7/browser.mjs';
const f=await startFixture();let app,logs='';
try{
 const s=await seedCatalog(f),o=orderFixture(f,s),w=workerFixture(f);
 const env={...process.env,ADMIN_ENABLED:'true',ADMIN_ENVIRONMENT:'local',ADMIN_SITE_ORIGIN:w.origin,ADMIN_SUPABASE_URL:f.url,ADMIN_SUPABASE_PUBLISHABLE_KEY:'local-test-publishable-key',ADMIN_RATE_LIMIT_SECRET:randomBytes(32).toString('hex'),CATALOG_ENABLED:'true',CATALOG_ENVIRONMENT:'local',CATALOG_SITE_ORIGIN:w.origin,CATALOG_SUPABASE_URL:f.url,CATALOG_SUPABASE_PUBLISHABLE_KEY:'local-test-publishable-key',CATALOG_MEDIA_ENABLED:'true',CATALOG_INDEXING_ENABLED:'false',ORDER_REQUESTS_ENABLED:'true',ORDER_GATEWAY_KEY_ID:o.keyId,ORDER_GATEWAY_SECRET:o.secret,ANALYTICS_ENABLED:'false',GA4_MEASUREMENT_ID:'',CATALOG_WORKER_ENABLED:'true',CATALOG_WORKER_ENVIRONMENT:'local',CATALOG_WORKER_SITE_ORIGIN:w.origin,CATALOG_WORKER_SUPABASE_URL:f.url,CATALOG_WORKER_PUBLISHABLE_KEY:'local-test-publishable-key',CATALOG_WORKER_KEY_ID:w.keyId,CATALOG_WORKER_SECRET:w.secret,NEXT_PUBLIC_SUPABASE_URL:f.url,NEXT_PUBLIC_SUPABASE_ANON_KEY:'local-test-publishable-key'};
 app=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port','3100'],{env,stdio:['ignore','pipe','pipe']});
 for(const stream of [app.stdout,app.stderr])stream.on('data',b=>{logs=(logs+b).slice(-30000);});
 let ready=false;for(let i=0;i<100;i++){if(app.exitCode!==null)throw Error(logs);try{if((await fetch(w.origin+'/admin/login')).ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,300));}if(!ready)throw Error('Local app unavailable');
 await readinessBrowserTests(f,s,w);
 // Restore the local withdrawn fixture for comparable measurements.
 s.publish('product',s.products[0].id);
 if(process.env.READINESS_QUICK!=='true')await measureBrowser();else console.log('QUICK SUBSET: accessibility and browser performance skipped; not a completion result.');
 if(logs.includes(w.secret)||logs.includes(o.secret))throw Error('Machine credential leaked into app logs');
 console.log('Phase 7 logs: machine credentials absent; fixed operational event codes only.');
}catch(error){console.error(logs);throw error;}finally{app?.kill('SIGTERM');await f.close();}
