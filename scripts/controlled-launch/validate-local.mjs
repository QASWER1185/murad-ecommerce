// Controlled launch preparation: isolated local regression only. No hosted target
// credentials, provisioning, provider API, migration or deployment is permitted.
import {spawn,execFileSync} from 'node:child_process';
import {mkdirSync,writeFileSync,readFileSync,copyFileSync,existsSync} from 'node:fs';
if(execFileSync('git',['branch','--show-current'],{encoding:'utf8'}).trim()!=='development/controlled-launch-prep')throw Error('Controlled local branch required');
const dir='work/controlled-launch-review';mkdirSync(dir,{recursive:true});
const tasks=[
 ['build','npm',['run','build']],['typescript','npx',['tsc','--noEmit']],['lint','npm',['run','lint']],
 ['audit-all','npm',['audit','--json']],['audit-production','npm',['audit','--omit=dev','--json']],
 ...['test:phase2','test:phase3:unit','test:phase4:unit','test:phase5:unit','test:phase6:unit','test:phase7:unit','test:phase8:unit','test:phase8:db','test:phase8:compat','test:phase7:db','test:phase3:e2e','test:phase4:e2e','test:phase5:e2e','test:phase6:e2e','test:phase7:e2e','test:phase7:capacity','test:phase8b:unit'].map(name=>[name,'npm',['run',name]]),
 ['capacity-memory','node',['scripts/phase7/capacity.mjs']],['configuration-static','npm',['run','check:staging','--','--static']],
];
const requested=process.argv.slice(2);if(requested.some(n=>!tasks.some(t=>t[0]===n)))throw Error('Unknown local validation task');
const selected=requested.length?tasks.filter(t=>requested.includes(t[0])):tasks;
let results=requested.length&&existsSync(`${dir}/results.json`)?JSON.parse(readFileSync(`${dir}/results.json`)).filter(r=>!requested.includes(r.task)):[];
const inherited={...process.env};
for(const name of Object.keys(inherited))if(/^(ADMIN_|CATALOG_|ORDER_|ANALYTICS_|GA4_|SUPABASE_|VERCEL_)/.test(name)||['DOCKER_HOST','DOCKER_CONTEXT','DOCKER_TLS','DOCKER_TLS_VERIFY','DOCKER_CERT_PATH'].includes(name))delete inherited[name];
const env={...inherited,NEXT_TELEMETRY_DISABLED:'1',ADMIN_ENABLED:'false',CATALOG_ENABLED:'false',ORDER_REQUESTS_ENABLED:'false',ANALYTICS_ENABLED:'false',CATALOG_WORKER_ENABLED:'false',CATALOG_INDEXING_ENABLED:'false',NEXT_PUBLIC_SUPABASE_URL:'http://127.0.0.1:54321',NEXT_PUBLIC_SUPABASE_ANON_KEY:'phase8-local-only'};
for(const [name,command,args] of selected){
 console.log(`Starting ${name}`);let log='';const start=Date.now();
 const code=await new Promise((resolve,reject)=>{const child=spawn(command,args,{env,stdio:['ignore','pipe','pipe']});for(const stream of [child.stdout,child.stderr])stream.on('data',b=>{log+=b;});child.once('error',reject);child.once('exit',resolve);});
 writeFileSync(`${dir}/${name.replaceAll(':','-')}.log`,log);
 results.push({task:name,exitCode:code,elapsedMs:Date.now()-start});
 writeFileSync(`${dir}/results.json`,JSON.stringify(results,null,2)+'\n');console.log(`${name}: ${code===0?'passed':'FAILED'}`);
 if(code!==0){console.error(log.slice(-7000));process.exitCode=1;break;}
 if(name==='test:phase7:e2e')for(const file of ['browser-performance','accessibility','seo','visual-comparison'])copyFileSync(`work/phase7-review/${file}.json`,`${dir}/${file}.json`);
 if(name==='test:phase7:db')copyFileSync('work/phase7-review/rehearsal.json',`${dir}/rehearsal.json`);
 if(name==='test:phase7:capacity')copyFileSync('work/phase7-review/catalog-capacity.json',`${dir}/catalog-capacity.json`);
 if(name==='capacity-memory')copyFileSync('work/phase7-review/capacity.json',`${dir}/capacity.json`);
}
