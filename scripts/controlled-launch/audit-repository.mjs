// Offline repository/configuration audit. No Supabase/hosting/Google connections.
import {readFileSync,readdirSync,existsSync,mkdirSync,writeFileSync} from 'node:fs';
import {execFileSync,spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const dir='work/controlled-launch-review';mkdirSync(dir,{recursive:true});
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
if(git('branch','--show-current')!=='development/controlled-launch-prep')throw Error('Controlled launch branch required');
const hash=b=>createHash('sha256').update(b).digest('hex');
const migrationFiles=readdirSync('supabase/migrations').filter(f=>f.endsWith('.sql')).sort();
const migrations=migrationFiles.map((file,i)=>{const bytes=readFileSync('supabase/migrations/'+file);const base=execFileSync('git',['show',`origin/development/staging-readiness:supabase/migrations/${file}`]);return{order:i+1,file,sha256:hash(bytes),unchangedFromPhase7:hash(bytes)===hash(base),explicitCutoverGuard:bytes.includes(Buffer.from('app.catalog_cutover_approved'))};});
if(migrations.length!==12||migrations.some(m=>!m.unchangedFromPhase7))throw Error('Unexpected migration drift');
const source=git('ls-files','-co','--exclude-standard').split('\n').filter(f=>f.startsWith('src/')&&/\.(tsx?|css)$/.test(f));
const missing=[];let checked=0;
for(const file of source){const text=readFileSync(file,'utf8');for(const m of text.matchAll(/\/(homepage|sanitary|fonts)\/[a-z0-9_.-]+\.(png|webp|woff2)/gi)){checked++;if(!existsSync('public'+m[0]))missing.push({file,asset:m[0]});}}
for(const match of readFileSync('src/components/home/reference-assets.ts','utf8').matchAll(/"([a-z0-9-]+)"/g)){checked++;if(!existsSync(`public/homepage/${match[1]}.png`))missing.push({file:'reference-assets.ts',asset:match[1]});}
for(const match of readFileSync('src/components/sanitary/catalog-options.ts','utf8').matchAll(/(?:asset|card): '([^']+)'/g)){checked++;if(!existsSync(`public/sanitary/${match[1]}.png`))missing.push({file:'catalog-options.ts',asset:match[1]});}
if(missing.length)throw Error(JSON.stringify(missing));
const chain=['origin/main','origin/development/seo-commerce','origin/development/admin-dashboard','origin/development/product-import-media','origin/development/storefront-integration','origin/development/orders-analytics','origin/development/staging-readiness','origin/development/phase8-preflight','origin/development/phase8-real-staging'];
const ancestry=chain.slice(1).map((head,i)=>({base:chain[i],head,baseSha:git('rev-parse',chain[i]),headSha:git('rev-parse',head),ancestor:spawnSync('git',['merge-base','--is-ancestor',chain[i],head]).status===0}));
if(ancestry.some(r=>!r.ancestor))throw Error('Stack ancestry changed');
// merge-tree writes Git objects only; it does not merge branches/worktrees.
const pr2=spawnSync('git',['merge-tree','--write-tree','origin/development/phase8-real-staging','origin/shopping/sanitary-section'],{encoding:'utf8',maxBuffer:1024*1024});
const conflicts=[...new Set((pr2.stdout.match(/CONFLICT.*? in ([^\n]+)/g)||[]).map(s=>s.slice(s.lastIndexOf(' in ')+4)))];
writeFileSync(`${dir}/migration-audit.json`,JSON.stringify(migrations,null,2)+'\n');
writeFileSync(`${dir}/repository-audit.json`,JSON.stringify({scope:'offline repository only',sourceFiles:source.length,staticAssetReferencesChecked:checked,missingAssets:missing,ancestry,sanitaryPR2Simulation:{exitCode:pr2.status,conflictPaths:conflicts,semanticReviewStillRequired:true}},null,2)+'\n');
const leaks=[];let bundles=0;
function walk(path){for(const f of readdirSync(path,{withFileTypes:true})){const full=path+'/'+f.name;if(f.isDirectory())walk(full);else if(f.name.endsWith('.js')){bundles++;if(/CATALOG_WORKER_SECRET|ORDER_GATEWAY_SECRET|ADMIN_RATE_LIMIT_SECRET|ADMIN_SUPABASE/.test(readFileSync(full,'utf8')))leaks.push(full);}}}
walk('.next/static/chunks');if(leaks.length)throw Error('Private configuration dependency in public bundle');
writeFileSync(`${dir}/bundle-audit.json`,JSON.stringify({scope:'static browser chunks',checkedChunks:bundles,privateEnvironmentNameFindings:leaks},null,2)+'\n');
console.log(JSON.stringify({migrationFiles:migrations.length,migrationsUnchanged:true,assetReferences:checked,missingAssets:0,publicChunks:bundles,privateConfigFindings:0,pr2ConflictPaths:conflicts}));
// Inspect actual public bundle strings as well as private configuration names.
const credentialFindings=[];
function inspectTokens(path){for(const entry of readdirSync(path,{withFileTypes:true})){const file=path+'/'+entry.name;if(entry.isDirectory())inspectTokens(file);else if(entry.name.endsWith('.js')){const text=readFileSync(file,'utf8');if(/sb_secret_[A-Za-z0-9_-]{20,}/.test(text))credentialFindings.push({file,type:'secret-key-marker'});for(const match of text.matchAll(/eyJ[A-Za-z0-9_-]+\.([A-Za-z0-9_-]+)\.[A-Za-z0-9_-]+/g))try{if(JSON.parse(Buffer.from(match[1],'base64url').toString()).role==='service_role')credentialFindings.push({file,type:'privileged-jwt'});}catch{}}}}
inspectTokens('.next/static/chunks');
writeFileSync(`${dir}/credential-audit.json`,JSON.stringify({scope:'public browser bundle contents only',checkedChunks:bundles,findings:credentialFindings},null,2)+'\n');
if(credentialFindings.length)throw Error('Privileged credential marker found in browser output; values withheld');
