// Generate an honest blocked execution ledger. Never substitutes local fixtures
// for hosted results. No provider/network client is loaded by this script.
import {readFileSync,writeFileSync,mkdirSync,readdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {assessStagingScope} from './scope.mjs';
const root='docs/phase8-part-b',evidence=root+'/evidence';mkdirSync(evidence,{recursive:true});
const deny=JSON.parse(readFileSync('ops/staging/production-denylist.json'));
const current=assessStagingScope(process.env,deny);
const candidate=assessStagingScope({STAGING_PROJECT_REF:deny.supabaseProjectRefs[0],CATALOG_SUPABASE_URL:deny.supabaseOrigins[0],CATALOG_SITE_ORIGIN:deny.applicationOrigins[0],STAGING_HOSTING_ENVIRONMENT:'production'},deny);
if(candidate.status!=='REJECTED')throw Error('Production candidate must be rejected');
const sha=b=>createHash('sha256').update(b).digest('hex');
const base='264cc217ede7e6246dbe4554629089677b92d9d5';
const migrations=readdirSync('supabase/migrations').filter(f=>f.endsWith('.sql')).sort().map((file,i)=>{const b=readFileSync('supabase/migrations/'+file),previous=execFileSync('git',['show',`${base}:supabase/migrations/${file}`]);if(sha(b)!==sha(previous))throw Error('Unexpected migration change');return {order:i+1,file,sha256:sha(b),unchangedFromPartA:true};});
if(migrations.length!==12)throw Error('Expected twelve unchanged Part A migrations');
const groups=[
 ['migration-results.md','Migration and RLS results',[
 'Verified staging PostgreSQL version, extensions and migration history','Existing schema/grants/policies inspected','Verified staging backup before mutation','Restore into a separate isolated target','Safe legacy-seed decision for fresh versus populated database','Guarded ordered migrations with session acknowledgement','Structures/indexes/foreign keys validated','Real anonymous/ordinary/Editor/Admin RLS tests','Existing IDs/sample Draft and verification state retained']],
 ['auth-security-results.md','Real Auth, MFA and session results',[
 'Trusted operator provisions synthetic staging identities','Admin login/logout and real JWT validation','Session refresh, expiry and revocation','Admin/Editor separation and ordinary/anonymous denial','Login limits, CSRF and Origin rejection','TOTP enrollment and identity-checked recovery rehearsal','MFA enabled only after enrollment/recovery','AAL2 enforcement at app/RPC/RLS/private Storage boundaries']],
 ['media-import-results.md','Real Storage and import results',[
 'JPEG/PNG/WebP/AVIF actual content/size/dimension checks','Private immutable originals and responsive variants','Gallery order/primary/alt/replacement/history recovery','Unauthorized/private/historical access denial','Withdrawal through HTTP/Storage/CDN/browser caches','CSV/XLSX templates, upload, mapping and preview','Duplicate/missing taxonomy/blank preservation and price approval','Part A unheaded populated/formula cell regression','Bounded batches/interruption/retry/version conflict/history','Private import-source access','Hosted workbook/image RSS, body limits and duration']],
 ['storefront-results.md','Real public storefront results',[
 'Product add/edit/Draft/review/publish/return-to-Draft/withdraw through real Admin',
 'SKU/model/taxonomy/specification/SEO/price-stock verification and revision history',
 'Permanent slugs, redirects and anonymous Draft 404',
 'Homepage and approved Sanitary desktop/mobile layouts','Imported products, kitchen sinks/faucets, hobs/ranges, hoods and geysers','Pipes/fittings, tanks, electrical and quotation-only building materials','Eight brand page templates and product details','Search/sorting/pagination/related products','Optional verified prices and unknown availability','Cart and wishlist revalidation','Draft product 404 and explicit review/publication separation','Withdrawal from collections/related/cart/public media']],
 ['orders-results.md','Real order and quotation results',[
 'Synthetic guest submission and server-calculated snapshots','Current availability/version revalidation','Duplicate/concurrent intent prevention','Reference generation and owner-bound receipt recovery','Quotation-only and mixed requests without invented prices','Admin-only status/history and customer privacy','Rate limits and unauthorized request rejection','Order-gateway signing and key rotation']],
 ['worker-monitoring-results.md','Real worker and monitoring results',[
 'Dedicated narrow machine identity and private key custody','No human-cookie or browser service-role dependency','Signature age, domain binding and nonce replay rejection','Concurrent claims/ack leases and crash recovery','Retry/backoff and invalidation acknowledgement','Withdrawal remains effective when worker is delayed/offline','Approved cadence/budget staging-only scheduler','Missed-run/backlog/failed-run monitoring']],
 ['performance-results.md','Actual hosted performance results',[
 'Homepage/Sanitary/brand/product mobile LCP and CLS','INP or clearly qualified measurable lab interactions','Approved-layout mobile usability','Real database latency and connection-pool capacity','Approved 2000+ synthetic catalog and pagination','Bounded concurrent searches and requests','Actual image/XLSX memory and function duration','Actual gateway body limits and hosting concurrency']],
 ['seo-accessibility-results.md','Real SEO and accessibility results',[
 'SSR/H1/category/brand/product metadata and canonical','BreadcrumbList/Product/Offer/Store JSON-LD using actual eligible data','Internal links and actual HTTP 404/308','Pagination and search/filter noindex','Private Draft exclusion and responsive image metadata','Staging robots/noindex and sitemap eligibility','Keyboard/modal focus/Escape and mobile layouts','Approved contrast findings rechecked without unauthorized palette changes']],
 ['backup-recovery-results.md','Actual backup and recovery results',[
 'Staging DB backup and independently restored schema/data','Separate private Storage original/derivative/import binary backup','Product revision and order-history recovery','RLS/role/permission restoration','Worker queue recovery and credential rotation','Measured recovery duration and observed data-loss window']],
];
const ledger=[];
const add=(id,scope,status,check,reason)=>ledger.push({id,scope,status,check,reason});
add('LOCAL-01','local repository','PASS','Part A base/source and required reports reviewed',`Source ${base}; no hosted operation`);
add('LOCAL-02','local repository','PASS','All twelve migration files match Part A','Repository SHA256 comparison only; no migrations executed');
add('LOCAL-03','local safety policy','PASS','Supplied Production/Main candidate is rejected',candidate.rejected.join(', '));
add('PROVIDER-01','provider management metadata','PASS','Supabase connected; existing owner organization and Free plan verified','M Murad Sons / wtvasruaawpaacyyywog; production project identity metadata only');
add('PROVIDER-02','provider management metadata','PASS','Live new-project cost quote obtained','$0/month; does not establish remaining free project quota');
add('PROVIDER-03','provider staging provisioning','FAIL','Create murad-ecommerce-staging once','Provider rejected: organization member QASWER1185 at 2 active free project limit; no staging project created');
add('PROVIDER-04','provider staging provisioning','BLOCKED','Retry project provisioning','Eligible free slot unavailable; no existing project pause/delete or paid upgrade authorized');
add('PROVIDER-05','provider management metadata','PASS','Vercel connected and existing project listed','murad-ecommerce / prj_OXReC9drbCnKpRDc1KdPrLyMvbFU; no settings or secret reads');
add('PROVIDER-06','provider management metadata','FAIL','Read owning Vercel team plan/identity','403 forbidden: connection lacks owning-team grant; provider consent link requested');
add('PROVIDER-07','provider authorization','BLOCKED','Approve Vercel team access','User must complete provider-returned single-use consent link; do not bypass or reconnect');
add('ISOLATION-01','real staging','BLOCKED','Verify a separate staging project and HTTPS target','Supabase connected, but creation rejected by active free-project quota; Vercel owning-team access awaiting provider consent; no isolated target to verify');
let id=1;
for(const [file,title,checks] of groups){
 const rows=checks.map(check=>{const row={id:'HOSTED-'+String(id++).padStart(3,'0'),scope:'real staging',status:'BLOCKED',check,reason:'Supabase free-project quota prevents creation; Vercel owning-team access awaiting provider consent; no isolated test target'};ledger.push(row);return row;});
 let content=`# ${title}\n\n**Overall: BLOCKED — not executed on real staging.**\n\nThe owner now authorizes creating isolated staging in existing accounts at no\nadditional cost. Supabase is connected; one project creation attempt was rejected\nby its member-wide active free-project quota. Vercel is connected, but owning-team metadata returned 403 pending consent. No\nstaging project or HTTPS hostname has been created or verified.\nNo production fallback is permitted.\n\n| Check | Status | Evidence / reason |\n| --- | --- | --- |\n`;
 for(const row of rows)content+=`| ${row.check} | ${row.status} | ${row.reason} |\n`;
 if(file==='migration-results.md')content+='\n**NOT RUN:** No database connection, schema inspection, backup, restore, seed or\nDDL/RLS change was attempted. All 12 source files are unchanged. Legacy seed must\nnot run against an existing populated DB without a reviewed safe plan. See\n[ordered source matrix](evidence/migrations.json) and\n[Part A cutover plan](../phase8-part-a/migration-plan.md).\n';
 if(file==='auth-security-results.md')content+='\n**NOT RUN:** No hosted Auth account was created, session/token obtained, TOTP\nenrolled, recovery performed or provider setting modified. Existing credentials\nin production Vercel/Supabase secret stores do not establish staging access here.\n';
 if(file==='media-import-results.md')content+='\n**NOT RUN:** No binary/source upload or live import occurred. Application limits\nremain 10 MiB originals, 24 MP, 8 MiB spreadsheets and 10,000 rows/40 columns.\nNo limit was reduced to hide an unmeasured hosting restriction.\n';
 if(file==='orders-results.md')content+='\n**NOT RUN:** No actual WhatsApp message or payment was sent; external-recipient\nmessages need separate authorization. Requests must never be represented as paid,\naccepted, reserved or completed purchases. No order/customer data was written.\n';
 if(file==='worker-monitoring-results.md')content+='\n**NOT RUN:** No machine/order key was provisioned, cron installed or test alert\nsent. The existing disabled schedule example remains a plan, not an operational\nservice. Cadence, identity, alert recipient and resource limits are still needed.\n';
 if(file==='performance-results.md')content+='\n**No hosted metric is available:** LCP/CLS/INP, RSS, concurrency, timeouts, body\nlimits and connection-pool capacity are unmeasured. New billable usage is forbidden. Provider quota and a bounded non-billable test\nbudget have not been verified. One $0-quoted project creation was rejected by\nfree quota; no load test was attempted.\n\nHistorical local-only context: Part A measured homepage/Sanitary LCP above 2.5 s\nand about 377–388 MiB direct XLSX parser peak RSS. These are **not Part B hosted\nresults**. See [Part A measurements](../phase8-part-a/performance-report.md).\n';
 if(file==='seo-accessibility-results.md')content+='\n**NOT RUN:** No sitemap submission, production indexing, Google property setup\nor design color correction. Existing production gates remain closed. Historical\nlocal checks are [Part A evidence](../phase8-part-a/seo-audit.md), not real staging PASS.\n';
 if(file==='backup-recovery-results.md')content+='\n**No RPO/RTO claimed.** No DB dump, Storage archive, restore, credential rotation\nor recovery timer exists for real staging. The earlier fixture round-trip is\nlocal/simulated Storage evidence and is not promoted to a hosted recovery result.\n';
 content+='\nRequired next inputs: see [staging-environment.md](staging-environment.md).\nStatuses are defined in [README.md](README.md); detailed ledger is in evidence.\n';
 writeFileSync(`${root}/${file}`,content);
}
for(const [name,reason] of [['Production DB migration/deployment/main merge','Explicitly prohibited by Part B'],['Production indexing/Google sitemap submission','Explicitly prohibited'],['Actual external WhatsApp test messages','No separate recipient authorization'],['Phase 9 or Phase 10 execution','Planning only; later authorization required']])add('EXCLUDED-'+String(ledger.length),'excluded','NOT RUN',name,reason);
const summary={reportTimezone:'Asia/Karachi',timestampUTC:new Date().toISOString(),sourcePartA:base,overallStatus:'BLOCKED',releaseCandidateAssessment:'NOT READY / NOT VALIDATED ON REAL STAGING',hostedRequestsAttempted:0,realStagingTestsExecuted:0,liveStagingIdentityVerified:false,stagingProjectRef:null,stagingHostname:null,productionIdentifiersSource:'Owner declared Production/Main; organization/project identity metadata verified, no database/customer data read',providerManagementRequestsAttempted:10,providerMetadataReads:5,vercelMetadataAttempts:3,vercelConsentLinkRequests:1,stagingProvisioningAttempts:1,stagingProvisioningFailures:1,productionMetadataRead:true,provisionedAccountsOrKeys:false,hostedDeploymentPerformed:false,productionTouched:false,phase9Or10Started:false,statusCounts:Object.fromEntries(['PASS','FAIL','BLOCKED','NOT RUN'].map(status=>[status,ledger.filter(r=>r.status===status).length]))};
for(const [name,data] of [['execution-status',summary],['check-ledger',ledger],['readiness',current],['production-candidate-rejection',{scope:'offline local check only',status:candidate.status,rejected:candidate.rejected,hostedRequestsAttempted:0}],['migrations',migrations]])writeFileSync(`${evidence}/${name}.json`,JSON.stringify(data,null,2)+'\n');
console.log(JSON.stringify(summary,null,2));
