// Run sequentially: browser fixtures share port 3100. No remote services used.
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
const tasks=['test:phase2','test:phase3:unit','test:phase4:unit','test:phase5:unit','test:phase6:unit','test:phase7:unit','test:phase3:e2e','test:phase4:e2e','test:phase5:e2e','test:phase6:e2e'];
mkdirSync('work/phase7-review',{recursive:true});
const requested=process.argv.slice(2);
if(requested.some(task=>!tasks.includes(task)))throw Error('Unknown regression task');
const selected=requested.length?requested:tasks;
const results=requested.length&&existsSync('work/phase7-review/regressions.json')?JSON.parse(readFileSync('work/phase7-review/regressions.json')).filter(r=>!selected.includes(r.task)):[];
for(const task of selected){
  console.log(`Starting ${task}`);
  const started=Date.now();let log='';
  const code=await new Promise((resolve,reject)=>{const child=spawn('npm',['run',task],{stdio:['ignore','pipe','pipe']});for(const stream of [child.stdout,child.stderr])stream.on('data',b=>{log+=b;process.stdout.write(b);});child.once('error',reject);child.once('exit',resolve);});
  writeFileSync(`work/phase7-review/${task.replaceAll(':','-')}.log`,log);
  results.push({task,exitCode:code,elapsedMs:Date.now()-started});
  writeFileSync('work/phase7-review/regressions.json',JSON.stringify(results,null,2)+'\n');
  if(code!==0){process.exitCode=1;break;}
}
