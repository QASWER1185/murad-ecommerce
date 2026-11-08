// Official CLI, disposable loopback-only services. Never links/reads a remote
// project, dotenv, production credentials or provider account API.
import {spawn,spawnSync} from 'node:child_process';
import {mkdirSync,writeFileSync,statfsSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
import {startDockerProxy} from './docker-loopback-proxy.mjs';
const root=process.cwd(),dir=root+'/work/controlled-supabase';mkdirSync(dir+'/supabase',{recursive:true});
const project='murad-controlled-'+randomUUID().slice(0,8),network=project+'-internal';
const env={...process.env};for(const n of Object.keys(env))if(/^(SUPABASE_|ADMIN_|CATALOG_|ORDER_|VERCEL_)/.test(n)||['DOCKER_HOST','DOCKER_CONTEXT','DOCKER_TLS','DOCKER_TLS_VERIFY','DOCKER_CERT_PATH'].includes(n))delete env[n];
const docker=(args,input)=>{const r=spawnSync('docker',['--host=unix:///var/run/docker.sock',...args],{env,input,encoding:'utf8',maxBuffer:8*1024*1024});if(r.status)throw Error('Local Docker operation failed: '+args[0]);return r.stdout.trim();};
const config=`project_id = "${project}"
[api]
enabled = true
port = 55321
schemas = ["public", "graphql_public"]
extra_search_path = ["public", "extensions"]
[db]
port = 55322
shadow_port = 55320
major_version = 17
[db.migrations]
enabled = false
[db.seed]
enabled = false
[realtime]
enabled = false
[studio]
enabled = false
[local_smtp]
enabled = true
port = 55324
[storage]
enabled = true
file_size_limit = "50MiB"
[auth]
enabled = true
site_url = "http://127.0.0.1:3200"
additional_redirect_urls = ["http://127.0.0.1:3200"]
enable_signup = false
[auth.email]
enable_signup = false
enable_confirmations = false
[auth.mfa.totp]
enroll_enabled = true
verify_enabled = true
[edge_runtime]
enabled = false
[analytics]
enabled = false
`;
writeFileSync(dir+'/supabase/config.toml',config,{mode:0o600});
const proxy=await startDockerProxy(dir+'/docker.sock',project);
const cliEnv={...env,DOCKER_HOST:'unix://'+dir+'/docker.sock'};
const cli=(args)=>new Promise((resolve,reject)=>{const p=spawn('npm',['exec','--yes','--package=supabase@3.0.0','--','supabase',...args,'--workdir',dir],{env:cliEnv,detached:true,stdio:['ignore','pipe','pipe']});let out='';const started=Date.now();let aborted=false;const limit=setInterval(()=>{const fs=statfsSync(root);if(!aborted&&(Number(fs.bavail)*Number(fs.bsize)<1024**3||Date.now()-started>15*60*1000)){aborted=true;try{process.kill(-p.pid,'SIGINT');}catch{}}},1000);p.stdout.on('data',b=>out+=b);p.stderr.on('data',b=>out+=b);p.on('error',reject);p.on('exit',code=>{clearInterval(limit);resolve({code,out,aborted});});});
const result={scope:'official local Supabase only; not hosted certification',cliVersion:'3.0.0',project,network,serviceStatus:'BLOCKED',loopbackEnforcedBeforeContainerCreation:true,productionAccessed:false,checks:[]};
try{
 docker(['network','create','--internal','--label','murad.controlled=true','--opt','com.docker.network.bridge.host_binding_ipv4=127.0.0.1',network]);
 const start=await cli(['start','--network-id',network,'--exclude','realtime,imgproxy,postgres-meta,studio,edge-runtime,logflare,vector,supavisor']);
 writeFileSync(dir+'/start-private.log',start.out,{mode:0o600});
 result.startExitCode=start.code;result.boundedAbort=start.aborted;
 if(start.code!==0){process.exitCode=2;result.failure='Official CLI start failed; see ignored private startup log for diagnostic details';returnResult();}
 else {
  const cs=docker(['ps','--filter','name='+project,'--format','{{.Names}}']).split('\n').filter(Boolean);
  for(const name of cs){const info=JSON.parse(docker(['inspect',name]))[0];for(const list of Object.values(info.HostConfig.PortBindings||{}))for(const b of list||[])if(b.HostIp!=='127.0.0.1')throw Error('Non-loopback port binding');}
  const status=await cli(['status','--output','json']);writeFileSync(dir+'/status-private.json',status.out,{mode:0o600});
  if(status.code)throw Error('Official local status failed');
  result.serviceStatus='PASS';result.containers=cs;result.publicBindings='127.0.0.1 only';
  const {runLocalServiceTests}=await import('./local-service-tests.mjs');await runLocalServiceTests({result,dir,docker,project,env});
  returnResult();
 }
}catch(e){result.failure=e.message;returnResult();process.exitCode=1;}
finally{
 // Only resources containing this invocation's fresh unique project identifier.
 const stopped=await cli(['stop','--no-backup']);result.stopExitCode=stopped.code;
 const remaining=docker(['ps','-aq','--filter','name='+project]).split('\n').filter(Boolean);for(const id of remaining)docker(['rm','-fv',id]);
 try{docker(['network','rm',network]);}catch{}
 await proxy.close();result.cleanedUp=true;returnResult();
}
function returnResult(){writeFileSync(dir+'/results.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({serviceStatus:result.serviceStatus,startExitCode:result.startExitCode,failure:result.failure,checks:result.checks.length,cleanedUp:result.cleanedUp}));}
