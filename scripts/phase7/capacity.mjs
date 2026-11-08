// Synthetic bounded-capacity probe. No product writes or network requests.
import { mkdirSync,readFileSync,writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url),mode=process.argv[2];
const dir='work/phase7-review';mkdirSync(dir,{recursive:true});
if(mode==='parse'){
  const {readSpreadsheet}=require('../../work/phase4-tests/src/lib/imports/spreadsheets.js');
  const bytes=readFileSync(`${dir}/capacity.xlsx`);global.gc?.();
  const baseline=process.memoryUsage().rss,start=performance.now();
  const data=await readSpreadsheet(bytes,'capacity.xlsx');
  console.log(JSON.stringify({probe:'xlsx',rows:data.rows.length,columns:data.headers.length,inputBytes:bytes.length,elapsedMs:performance.now()-start,baselineRssBytes:baseline,processMaxRssBytes:process.resourceUsage().maxRSS*1024,rssBytes:process.memoryUsage().rss}));
}else if(mode==='image'){
  const {processImage}=require('../../work/phase4-tests/src/lib/media/images.js');
  const bytes=readFileSync(`${dir}/capacity.jpg`);global.gc?.();const baseline=process.memoryUsage().rss,start=performance.now();
  const results=await Promise.allSettled([processImage(bytes,'image/jpeg','synthetic-original.jpg'),processImage(bytes,'image/jpeg','synthetic-original.jpg'),processImage(bytes,'image/jpeg','synthetic-original.jpg')]);
  if(results.filter(r=>r.status==='fulfilled').length!==2 || results.filter(r=>r.status==='rejected').length!==1)throw Error('Image concurrency cap failed');
  const images=results.filter(r=>r.status==='fulfilled').map(r=>r.value);
  console.log(JSON.stringify({probe:'image',width:6000,height:4000,inputBytes:bytes.length,concurrentAccepted:2,thirdRejected:true,variantBytes:images.map(i=>i.variants.reduce((n,v)=>n+v.byte_size,0)),elapsedMs:performance.now()-start,baselineRssBytes:baseline,processMaxRssBytes:process.resourceUsage().maxRSS*1024,rssBytes:process.memoryUsage().rss}));
}else{
  const ExcelJS=require('exceljs'),sharp=require('sharp');
  const workbook=new ExcelJS.Workbook(),sheet=workbook.addWorksheet('Synthetic capacity test');
  sheet.addRow(Array.from({length:40},(_,i)=>i===0?'sku':i===1?'name':`column_${i}`));
  for(let i=0;i<10000;i++)sheet.addRow(Array.from({length:40},(_,c)=>c===0?`SYNTHETIC-${i}`:c===1?`Synthetic row ${i}`:'v'));
  await workbook.xlsx.writeFile(`${dir}/capacity.xlsx`);
  // High-entropy deterministic pixels exercise decoding/resizing rather than
  // measuring only the unusually cheap solid-color fixture case.
  const pixels=Buffer.alloc(6000*4000*3);let noise=0x70686137;
  for(let i=0;i<pixels.length;i++){noise=(Math.imul(noise,1664525)+1013904223)|0;pixels[i]=noise>>>24;}
  await sharp(pixels,{raw:{width:6000,height:4000,channels:3}}).jpeg({quality:40}).toFile(`${dir}/capacity.jpg`);
  const results=[];
  for(const test of ['parse','image']){
    const p=spawnSync(process.execPath,['--expose-gc',import.meta.filename,test],{encoding:'utf8',maxBuffer:1024*1024});
    if(p.status!==0)throw Error(p.stderr||p.stdout);results.push(JSON.parse(p.stdout));
  }
  writeFileSync(`${dir}/capacity.json`,JSON.stringify({synthetic:true,hostingCertification:false,results},null,2)+'\n');console.log(JSON.stringify(results,null,2));
}
