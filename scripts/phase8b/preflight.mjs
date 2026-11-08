// Deliberately does NOT read .env.local, provider secret managers, or any hosted
// endpoint. Configure explicit staging-only runtime bindings after isolation.
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {assessStagingScope} from './scope.mjs';
const deny=JSON.parse(readFileSync('ops/staging/production-denylist.json'));
const result=assessStagingScope(process.env,deny);
mkdirSync('work/phase8b-review',{recursive:true});
writeFileSync('work/phase8b-review/readiness.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
// 2 means prerequisites blocked/rejected. It is not a failed real staging test.
if(result.status!=='DECLARATION_VALID'||!result.hostedExecutionReady)process.exitCode=2;
