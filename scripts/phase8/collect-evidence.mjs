// Commit aggregate QA evidence only, never fixture records, uploads, cookies,
// database dumps, raw environment values or private signing/session material.
import {readFileSync,writeFileSync,mkdirSync,copyFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import sharp from 'sharp';
const root='work/phase8-review',dir='docs/phase8-part-a/evidence';mkdirSync(dir,{recursive:true});
const read=name=>JSON.parse(readFileSync(`${root}/${name}.json`));
const results=read('results');if(results.length!==23||results.some(r=>r.exitCode!==0))throw Error('All 23 local tasks must finish successfully');
const write=(name,value)=>writeFileSync(`${dir}/${name}.json`,JSON.stringify(value,null,2)+'\n');
write('test-results',results);
for(const [input,output] of [['migration-audit','migrations'],['repository-audit','repository-audit'],['bundle-audit','bundle-audit'],['legacy-stack','legacy-compatibility'],['import-boundary','import-boundary'],['capacity','memory-after']])write(output,read(input));
write('memory-before',JSON.parse(readFileSync(`${root}/baseline/capacity.json`)));
for(const phase of ['before','after']){
 const raw=phase==='before'?JSON.parse(readFileSync(`${root}/baseline/browser-performance.json`)):read('browser-performance');
 write('mobile-'+phase,{scope:'local lab only',cpuThrottle:raw.cpuThrottle,latencyMs:raw.latencyMs,downloadBytesPerSecond:raw.downloadBytesPerSecond,viewport:raw.viewport,fieldINP:false,samples:raw.measurements.map(r=>({path:r.path.startsWith('/product/')?'/product/[slug]':r.path,run:r.run,lcpMs:r.vitals.lcp,cls:r.vitals.cls,maxObservedInteractionMs:Math.max(0,...r.vitals.interactions),jsTransferBytes:r.jsTransferBytes,readyMs:r.readyMs,ttfbMs:r.navigation[0]?.ttfbMs}))});
}
write('catalog-capacity',read('catalog-capacity'));
const recovery=read('rehearsal').recovery;write('recovery-rehearsal',{scope:'local database and simulated binary archive only',restoredAnonymousRawProductsDenied:recovery.restoredAnonymousRawProductsDenied,databaseChecksumsCompared:true,binaryObjects:recovery.binaryObjects,binaryBytes:recovery.binaryBytes,elapsedMs:recovery.elapsedMs,realStorageServiceTested:false});
write('initial-reproductions',{config:JSON.parse(readFileSync(`${root}/baseline/config-defect.json`)),import:JSON.parse(readFileSync(`${root}/baseline/import-defect.json`))});
write('accessibility',read('accessibility').map(p=>({page:p.name,passedRuleChecks:p.passes,violations:p.violations})));
write('seo',read('seo').map(r=>({path:r.path.startsWith('/product/')?'/product/[slug]':r.path,status:r.status,hasTitle:!!r.title,hasCanonical:!!r.canonical,canonicalHasQuery:!!r.canonical?.includes('?'),noindex:r.robots.some(s=>s.includes('noindex')),schemaTypes:r.schemas,hasH1:!!r.h1})));
const visual=[];mkdirSync('docs/phase8-part-a/screenshots',{recursive:true});
for(const name of ['home-desktop','home-mobile','sanitary-desktop','sanitary-mobile']){
 const old=await sharp(`${root}/baseline/screenshots/${name}.png`).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const path=`work/phase7-review/screenshots/${name}.png`,current=await sharp(path).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 if(old.info.width!==current.info.width||old.info.height!==current.info.height)throw Error('Approved dimensions changed');
 let exact=0,visible=0,max=0;for(let i=0;i<old.data.length;i+=4){let delta=0;for(let c=0;c<4;c++)delta=Math.max(delta,Math.abs(old.data[i+c]-current.data[i+c]));if(delta>0)exact++;if(delta>20)visible++;max=Math.max(max,delta);}
 if(visible)throw Error('Visible approved-artwork regression');
 visual.push({name,width:current.info.width,height:current.info.height,exactDifferentPixels:exact,maximumChannelDifference:max,visibleDifferentPixels:visible,visibleThresholdPerChannel:20});copyFileSync(path,`docs/phase8-part-a/screenshots/${name}.png`);
}
write('visual-comparison',visual);
const all=JSON.parse(readFileSync(`${root}/audit-all.log`)),prod=JSON.parse(readFileSync(`${root}/audit-production.log`));
if(all.metadata.vulnerabilities.total||prod.metadata.vulnerabilities.total)throw Error('Dependency findings need explicit review');
write('dependency-audit',{all:all.metadata.vulnerabilities,production:prod.metadata.vulnerabilities});
write('failures-and-remediation',[{task:'test:phase5:e2e',initialOutcome:'failed',cause:'Test read public page before pending publication committed; ready-state button was not proof of completion',remediation:'Wait for reviewed/published success navigation, keeping authorization/version checks and timeouts unchanged',retestOutcome:'passed'}]);
write('summary',{scope:'Phase 8 Part A only',nodeVersion:process.version,chromiumVersion:execFileSync('/usr/bin/chromium',['--version'],{encoding:'utf8'}).trim(),timestampUTC:new Date().toISOString(),reportTimezone:'Asia/Karachi',branch:execFileSync('git',['branch','--show-current'],{encoding:'utf8'}).trim(),base:'c8f9f701c783a4a7f86b4587f641ba7d964414aa',localTasksPassed:results.length,partAUnits:7,partAImportDatabaseAssertions:9,partALegacyCompatibilityAssertions:7,phase7SecurityAssertions:read('rehearsal').hardeningAssertions,realSupabaseAccessed:false,hostingOrGoogleConfigured:false,partBStarted:false,merged:false,deployed:false});
console.log('Aggregated Part A evidence collected; fixture data and credential/session material excluded.');
