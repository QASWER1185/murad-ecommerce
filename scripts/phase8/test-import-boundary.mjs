import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {mkdirSync,writeFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import ExcelJS from 'exceljs';
import {startFixture} from '../phase3/local-fixture.mjs';
const require=createRequire(import.meta.url),{readSpreadsheet}=require('../../work/phase8-tests/src/lib/imports/spreadsheets.js'),{normalizeImportRow}=require('../../work/phase8-tests/src/lib/imports/normalize.js');
const f=await startFixture();let checks=0;
try{
 const q=f.literal;
 const rpc=(name,args,role='admin')=>JSON.parse(f.sql(f.as(role,`SELECT public.${name}(${Object.entries(args).map(([k,v])=>`${k}=>${q(v)}`).join(',')});`)));
 const book=new ExcelJS.Workbook(),sheet=book.addWorksheet('Synthetic only');
 sheet.addRow(['sku','name']);sheet.addRow(['P8-UNHEADED','Synthetic source validation',{formula:'1+1',result:2}]);
 const parsed=await readSpreadsheet(Buffer.from(await book.xlsx.writeBuffer()),'synthetic.xlsx');
 assert(parsed.rows[0].errors.length>0);checks++;
 const id=randomUUID();f.sql(f.as('admin',`INSERT INTO storage.objects(bucket_id,name) VALUES('catalog-imports',${q(`imports/${id}/source.xlsx`)});`));
 let job=rpc('begin_catalog_import',{p_id:id,p_name:'synthetic.xlsx',p_sha:'a'.repeat(64),p_format:'xlsx',p_headers:parsed.headers,p_total:1});
 job=rpc('stage_catalog_import_source',{p_id:id,p_start:1,p_rows:parsed.rows});
 job=rpc('configure_catalog_import',{p_id:id,p_version:job.version,p_mapping:{sku:0,name:1},p_mode:'draft_import',p_clear_blanks:false});
 const batch=rpc('catalog_import_source_batch',{p_id:id});
 job=rpc('stage_catalog_import_preview',{p_id:id,p_version:batch.job.version,p_start:1,p_rows:batch.rows.map(r=>normalizeImportRow(r,batch.job.column_mapping,false))});
 const errors=f.sql(f.as('admin',`SELECT errors::text FROM public.import_rows WHERE job_id=${q(id)};`));
 assert(errors.includes('Formula in column 3'));checks++;
 assert(errors.includes('no column header'));checks++;
 assert.throws(()=>rpc('start_catalog_import',{p_id:id,p_version:job.version,p_confirm:true,p_confirm_prices:false,p_skip_errors:false}),/invalid-row confirmation/);checks++;
 job=rpc('start_catalog_import',{p_id:id,p_version:job.version,p_confirm:true,p_confirm_prices:false,p_skip_errors:true});
 job=rpc('process_catalog_import_batch',{p_id:id,p_limit:50});
 assert.equal(job.status,'completed');checks++;
 assert.equal(f.sql(f.as('admin',"SELECT count(*) FROM public.products WHERE sku='P8-UNHEADED';")),'0');checks++;
 for(const role of [null,'ordinary','editor']){assert.throws(()=>rpc('stage_catalog_import_source',{p_id:id,p_start:1,p_rows:parsed.rows},role),/permission denied|administrator/);checks++;}
 const report={scope:'local PostgreSQL/RLS with synthetic Auth/Storage contracts',assertions:checks,sourceErrorsPreserved:true,invalidSourceProductCreated:false,foundationAssertions:f.assertions};
 mkdirSync('work/phase8-review',{recursive:true});writeFileSync('work/phase8-review/import-boundary.json',JSON.stringify(report,null,2)+'\n');console.log(report);
}finally{await f.close();}
