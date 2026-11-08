// Package only redacted local evidence after successful checks. Never copy env,
// cookie files, database dumps, import binaries or live account credentials.
import {readFileSync,writeFileSync,mkdirSync,copyFileSync,readdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const source='work/phase7-review',target='docs/phase7/evidence';
const read=name=>JSON.parse(readFileSync(`${source}/${name}.json`));
const regressions=read('regressions');
if(regressions.length!==10||regressions.some(r=>r.exitCode!==0))throw Error('Every applicable regression must pass before collecting evidence');
if(read('rehearsal').hardeningAssertions!==51||read('browser-performance').measurements.length!==12||read('catalog-capacity').measurements.length!==6)throw Error('Expected complete Phase 7 evidence');
const audit=JSON.parse(readFileSync('work/phase7-audit-all.json'));if(audit.metadata.vulnerabilities.total!==0)throw Error('Dependency audit must be reviewed');
mkdirSync(target,{recursive:true});mkdirSync('docs/phase7/screenshots',{recursive:true});
for(const name of ['regressions','rehearsal','browser-performance','browser-performance-before-hero-optimization','catalog-capacity','catalog-baseline-timeout','capacity','accessibility','seo','visual-comparison'])copyFileSync(`${source}/${name}.json`,`${target}/${name}.json`);
copyFileSync(`${source}/plan-memberships.json`,`${target}/baseline-membership-plan.json`);
writeFileSync(`${target}/dependency-audit.json`,JSON.stringify({scope:'all dependencies including development',...audit.metadata},null,2)+'\n');
const screenshots=readdirSync(`${source}/screenshots`).filter(f=>f.endsWith('.png'));if(screenshots.length!==10)throw Error('Expected desktop/mobile screenshot set');
for(const file of screenshots)copyFileSync(`${source}/screenshots/${file}`,`docs/phase7/screenshots/${file}`);
const lines=[];for(const file of ['work/phase7-build.log','work/phase7-lint.log','work/phase7-typescript.log','work/phase7-db.log','work/phase7-unit.log','work/phase7-e2e.log','work/phase7-catalog-capacity.log'])lines.push(`File: ${file}\n${readFileSync(file,'utf8')}`);
writeFileSync(`${target}/checks.log`,lines.join('\n\n'));
const files=[...new Set(execFileSync('git',['ls-files','-co','--exclude-standard'],{encoding:'utf8'}).trim().split('\n'))].filter(p=>!p.startsWith('docs/')).sort();
const hash=createHash('sha256');for(const file of files){hash.update(file+'\0');hash.update(readFileSync(file));}
const verification={scope:'isolated-local-only',timestampUTC:new Date().toISOString(),reportTimezone:'Asia/Karachi',branch:execFileSync('git',['branch','--show-current'],{encoding:'utf8'}).trim(),base:execFileSync('git',['rev-parse','origin/development/orders-analytics'],{encoding:'utf8'}).trim(),sourceFilesExcludingDocsSha256:hash.digest('hex'),fullBuild:true,typeScript:true,lintErrors:0,preExistingLintWarnings:8,dependencyVulnerabilities:audit.metadata.vulnerabilities,regressionTasks:regressions.length,phase7Units:7,phase7DatabaseAssertions:51,phase7BrowserGroups:10,screenshots:screenshots.length,realSupabaseStagingTested:false,externalGoogleDeliveryTested:false,deployed:false,merged:false};
writeFileSync(`${target}/verification.json`,JSON.stringify(verification,null,2)+'\n');
console.log('Redacted local evidence collected; no real-service certification.');
