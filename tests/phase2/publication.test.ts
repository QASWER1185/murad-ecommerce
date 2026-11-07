import { test } from 'node:test';
import assert from 'node:assert/strict';
import { canEmitOffer, canManage, canPreview, isIndexable, isPubliclyVisible, type IndexContext, type PublicProduct, type PublicRoute, type WorkflowRecord } from '../../src/lib/catalog/publication';
import { canonicalUrl, catalogMetadata, catalogSitemap } from '../../src/lib/seo/catalog-policy';

const context: IndexContext = { production: true, indexingEnabled: true };
const route: PublicRoute = { id:'test',kind:'product',name:'Test fixture',slug:'test-fixture',canonical_path:'/product/test-fixture',seo_title:'Test fixture title',seo_description:'Real useful fixture content',is_indexable:true,updated_at:'2026-11-07T00:00:00Z' };
const record: WorkflowRecord = { publication_status:'published',version:3,reviewed_version:3,reviewed_at:'2026-11-07',reviewed_by:'reviewer',approved_at:'2026-11-07',approved_by:'admin',archived_at:null,identity_verified:true,content_verified:true };
test('draft/review/stale/unapproved records are never public',()=>{
  assert(isPubliclyVisible(record));
  for(const patch of [{publication_status:'draft'},{publication_status:'ready_for_review'},{reviewed_at:null},{approved_at:null},{approved_by:null},{reviewed_version:2},{identity_verified:false},{content_verified:false},{archived_at:'2026-11-07'}]) assert.equal(isPubliclyVisible({...record,...patch} as WorkflowRecord),false);
});
test('admin role is explicit, editor is read/preview only',()=>{
  assert(canManage('admin')); assert(canPreview('editor')); assert(!canManage('editor'));
  for(const value of [null,'user','ADMIN',{role:'admin'},true]) { assert(!canManage(value));assert(!canPreview(value)); }
});
test('metadata and sitemap agree over all environment/context gates',()=>{
  for(const production of [false,true]) for(const indexingEnabled of [false,true]) for(const adminPreview of [false,true]) for(const searchOrFilter of [false,true]) for(const eligible of [false,true]) {
    const ctx={production,indexingEnabled,adminPreview,searchOrFilter};const value={...route,is_indexable:eligible};
    const expected=production&&indexingEnabled&&!adminPreview&&!searchOrFilter&&eligible;
    assert.equal(isIndexable(value,ctx),expected);
    assert.equal(catalogMetadata(value,'https://example.test',ctx).robots.index,expected);
    assert.equal(catalogSitemap([value],'https://example.test',ctx).length,expected?1:0);
  }
  assert.equal(catalogSitemap([route],'https://example.test').length,0);
});
test('incomplete metadata, duplicate canonicals and missing records fail closed',()=>{
  for(const patch of [{seo_title:''},{seo_description:null},{is_indexable:false},{slug:'Invalid Slug'},{canonical_path:'/product/another-page'}]) assert(!isIndexable({...route,...patch},context));
  assert(!isIndexable(null,context));
  for(const path of ['//evil.test/product/test','https://evil.test','/product/test?redirect=bad','/admin']) assert.throws(()=>canonicalUrl({...route,canonical_path:path},'https://example.test'));
  assert.throws(()=>canonicalUrl(route,'https://attacker@example.test'));
  assert.equal(canonicalUrl(route,'https://example.test'),'https://example.test/product/test-fixture');
});
test('price optional for indexing, but missing/unverified/quotation prices never yield Offers',()=>{
  const product: PublicProduct={id:'test',name:'Test fixture',slug:route.slug,sku:'TEST',model:null,description:'Test',category_id:null,brand_id:null,price:null,currency:'PKR',sales_mode:'online',availability:'unknown',is_indexable:true};
  assert(isIndexable(route,context)); assert(!canEmitOffer(product,route,context));
  assert(canEmitOffer({...product,price:1200},route,context));
  for(const patch of [{sales_mode:'quotation'},{price:0},{price:-1},{price:NaN},{price:Infinity},{currency:'invalid'},{id:'unrelated'},{slug:'stale-slug'},{is_indexable:false}]) assert(!canEmitOffer({...product,price:1200,...patch} as PublicProduct,route,context));
  assert(!canEmitOffer({...product,price:1200},{...route,is_indexable:false},context));
});
test('lastmod is content timestamp, never invented from current time',()=>{
  assert.equal(catalogSitemap([route],'https://example.test',context)[0].lastModified?.toISOString(),route.updated_at.replace('Z','.000Z'));
  assert(!('lastModified' in catalogSitemap([{...route,updated_at:'invalid'}],'https://example.test',context)[0]));
});
