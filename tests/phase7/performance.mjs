import {writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
export async function catalogCapacity(f,s){
  // Only new clearly named synthetic Drafts in this disposable fixture. Use the
  // real review RPCs; never publish legacy sample records or seed a remote DB.
  const q=f.literal,started=performance.now();
  f.sql(f.as('admin',`DO $p$ DECLARE x jsonb;r record;BEGIN
   FOR i IN 1..2000 LOOP
    x:=public.save_product_draft(NULL,NULL,jsonb_build_object('name','Synthetic capacity fixture '||lpad(i::text,4,'0'),'slug','synthetic-capacity-fixture-'||i,'sku','SYNTHETIC-CAPACITY-'||i,'category_id',${q(s.categories.sanitary)},'brand_id',${q(s.brands.porta)},'description','Synthetic isolated capacity measurement, never commercial inventory.','specifications','{}'::jsonb));
    SELECT id,version INTO r FROM public.products WHERE id=(x->>'id')::uuid;
    PERFORM public.submit_catalog_review('product',r.id,r.version);
    PERFORM public.review_catalog_entity('product',r.id,r.version,'{"identity":true,"content":true}'::jsonb);
    PERFORM public.publish_catalog_entity('product',r.id,r.version,false);
   END LOOP;
  END $p$;`));
  const seedMs=performance.now()-started;
  f.sql('ANALYZE public.products;ANALYZE public.product_categories;ANALYZE public.product_images;');
  const cases=[['category-first','category','sanitary',{}],['category-page-100','category','sanitary',{page:100}],['search','search','',{q:'capacity fixture 1000'}],['brand','brand','porta',{}],['price-sort','category','sanitary',{sort:'price-low'}],['product-related','product','local-fixture-1',{}]];
  const measurements=[];
  for(const [name,kind,slug,query] of cases){
    const runs=[];let result;
    for(let i=0;i<3;i++){
      const plan=JSON.parse(f.sql(f.as(null,`SET statement_timeout='8s';EXPLAIN(ANALYZE,BUFFERS,FORMAT JSON) SELECT public.catalog_storefront(${q(kind)},${q(slug)},${q(query)});`)))[0];
      runs.push({executionMs:plan['Execution Time'],planningMs:plan['Planning Time'],sharedHitBlocks:plan.Plan['Shared Hit Blocks'],sharedReadBlocks:plan.Plan['Shared Read Blocks']});
    }
    result=JSON.parse(f.sql(f.as(null,`SET statement_timeout='8s';SELECT public.catalog_storefront(${q(kind)},${q(slug)},${q(query)});`)));
    console.log(`Capacity ${name}: ${runs.map(r=>r.executionMs.toFixed(1)).join(', ')} ms`);
    assert(result.products.length<=12,'Catalog page must remain bounded');
    measurements.push({name,runs,returnedProducts:result.products.length,total:result.total});
    writeFileSync('work/phase7-review/catalog-capacity.json',JSON.stringify({synthetic:true,partial:true,syntheticProducts:2000,seedMs,measurements},null,2)+'\n');
  }
  const report={synthetic:true,isolatedLocalPostgres:true,syntheticProducts:2000,seedMs,measurements};
  writeFileSync('work/phase7-review/catalog-capacity.json',JSON.stringify(report,null,2)+'\n');
  console.log('Phase 7 database capacity: 2,000 synthetic reviewed products, six paginated/detail query scenarios measured.');
  return report;
}
