import assert from 'node:assert/strict';
import {readFileSync,readdirSync,mkdirSync} from 'node:fs';
import {spawn} from 'node:child_process';
import {createClient} from '@supabase/supabase-js';
import {randomBytes,createHmac,randomUUID} from 'node:crypto';
import sharp from 'sharp';
import {chromium,expect} from '@playwright/test';
export async function runLocalServiceTests({result,dir,docker,project,env,storageAvailable=true,jwtSecret}){
 const raw=readFileSync(dir+'/status-private.json','utf8');const state=JSON.parse(raw.slice(raw.indexOf('{'),raw.lastIndexOf('}')+1));
 const url=state.API_URL||state.api_url||'http://127.0.0.1:55321';assert(['127.0.0.1','localhost'].includes(new URL(url).hostname));
 const anonKey=state.ANON_KEY||state.anon_key,serviceKey=state.SERVICE_ROLE_KEY||state.service_role_key;
 assert(anonKey&&serviceKey,'Official local status did not expose expected local keys');
 const client=key=>createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}}),operator=client(serviceKey),anon=client(anonKey);
 const sql=q=>docker(['exec','-i','supabase_db_'+project,'psql','-U','postgres','-d','postgres','-qAt','-v','ON_ERROR_STOP=1'],q);
 const test=async(name,fn)=>{try{await fn();result.checks.push({name,status:'PASS',scope:'real official local services'});}catch(e){result.checks.push({name,status:'FAIL',scope:'real official local services',reason:e.message});throw e;}};
 const ok=r=>{assert(!r.error,r.error?.message);return r.data;};
 await test('all twelve guarded migrations install with real local Auth schema and preserve six Draft sample IDs',async()=>{
  let snapshot;
  for(const file of readdirSync('supabase/migrations').filter(f=>f.endsWith('.sql')).sort()){
   sql(`SET app.catalog_cutover_approved='yes';${readFileSync('supabase/migrations/'+file,'utf8')}`);
   if(file.includes('seed_initial'))snapshot=JSON.parse(sql('SELECT json_agg(id ORDER BY id) FROM public.products;'));
  }
  assert.deepEqual(JSON.parse(sql('SELECT json_agg(id ORDER BY id) FROM public.products;')),snapshot);
  assert.equal(sql("SELECT count(*) FROM public.products WHERE publication_status='draft' AND NOT identity_verified AND NOT content_verified AND price_verified_at IS NULL AND stock_verified_at IS NULL;"),'6');
  sql("NOTIFY pgrst,'reload schema';");await new Promise(r=>setTimeout(r,1000));result.realMigrations=12;
 });
 const password=randomBytes(24).toString('base64url')+'a!7';const people={};
 await test('trusted local Auth API provisions synthetic Admin/Editor/ordinary users; no signup endpoint enabled',async()=>{
  for(const role of ['admin','editor','ordinary']){const email=`${role}-${project}@example.invalid`;const data=ok(await operator.auth.admin.createUser({email,password,email_confirm:true}));assert(data.user?.id);people[role]={id:data.user.id,email,client:client(anonKey)};if(role!=='ordinary')sql(`INSERT INTO app_private.user_roles(user_id,role) VALUES('${data.user.id}','${role}');`);ok(await people[role].client.auth.signInWithPassword({email,password}));}
 });
 await test('real GoTrue getUser/refresh/invalid-token verification and PostgREST roles/RLS',async()=>{
  for(const role of Object.keys(people)){ok(await people[role].client.auth.getUser());ok(await people[role].client.auth.refreshSession());const actual=ok(await people[role].client.rpc('current_catalog_role'));assert.equal(actual,role==='ordinary'?null:role);}
  assert((await anon.auth.getUser('invalid-local-token')).error);
  assert((await anon.from('products').select('id')).error);
  assert.equal(ok(await people.ordinary.client.from('products').select('id')).length,0);
  ok(await people.ordinary.client.auth.updateUser({data:{role:'admin'}}));assert.equal(ok(await people.ordinary.client.rpc('current_catalog_role')),null);
  for(const role of ['editor','ordinary'])assert((await people[role].client.rpc('save_product_draft',{product_id:null,expected_version:null,input:{name:'Forbidden local test',slug:'forbidden-local'}})).error);
 });
 if(jwtSecret)await test('real services reject correctly signed expired JWTs; public signup remains disabled',async()=>{
  const current=ok(await people.admin.client.auth.getSession()).session.access_token;
  const [header,payload]=current.split('.');const expired=Buffer.from(JSON.stringify({...JSON.parse(Buffer.from(payload,'base64url').toString()),exp:Math.floor(Date.now()/1000)-60})).toString('base64url');const unsigned=header+'.'+expired;const token=unsigned+'.'+createHmac('sha256',jwtSecret).update(unsigned).digest('base64url');
  assert((await anon.auth.getUser(token)).error);const response=await fetch(url+'/rest/v1/products?select=id',{headers:{apikey:anonKey,Authorization:'Bearer '+token}});assert.equal(response.status,401);
  assert((await anon.auth.signUp({email:'signup-'+project+'@example.invalid',password})).error);
 });
 let product;
 await test('Draft creation through real PostgREST RPC',async()=>{
  product=ok(await people.admin.client.rpc('save_product_draft',{product_id:null,expected_version:null,input:{name:'Synthetic official-service test',slug:'synthetic-official-service-test',sku:'LOCAL-SERVICE-TEST'}}));assert(product.id);
 });
 if(storageAvailable)await test('real private Storage insert/read and anonymous/Editor denial',async()=>{
  product=ok(await people.admin.client.rpc('save_product_draft',{product_id:null,expected_version:null,input:{name:'Synthetic official-service test',slug:'synthetic-official-service-test',sku:'LOCAL-SERVICE-TEST'}}));assert(product.id);
  const bytes=await sharp({create:{width:300,height:200,channels:3,background:'#17314b'}}).png().toBuffer(),name='local-tests/'+randomUUID()+'.png';
  ok(await people.admin.client.storage.from('catalog-private').upload(name,bytes,{contentType:'image/png',upsert:false}));
  assert.equal((await ok(await people.admin.client.storage.from('catalog-private').download(name)).arrayBuffer()).byteLength,bytes.length);
  assert((await anon.storage.from('catalog-private').download(name)).error);
  assert((await people.editor.client.storage.from('catalog-private').upload('local-tests/editor.png',bytes,{contentType:'image/png'})).error);
 });
 let app,browser;const base='http://127.0.0.1:3200';
 try{
  const appEnv={...env,ADMIN_ENABLED:'true',ADMIN_ENVIRONMENT:'local',ADMIN_SITE_ORIGIN:base,ADMIN_SUPABASE_URL:url,ADMIN_SUPABASE_PUBLISHABLE_KEY:anonKey,ADMIN_RATE_LIMIT_SECRET:randomBytes(32).toString('hex'),CATALOG_ENABLED:'true',CATALOG_ENVIRONMENT:'local',CATALOG_SITE_ORIGIN:base,CATALOG_SUPABASE_URL:url,CATALOG_SUPABASE_PUBLISHABLE_KEY:anonKey,CATALOG_MEDIA_ENABLED:'true',CATALOG_INDEXING_ENABLED:'false',ORDER_REQUESTS_ENABLED:'false',CATALOG_WORKER_ENABLED:'false',ANALYTICS_ENABLED:'false',NEXT_TELEMETRY_DISABLED:'1',NEXT_PUBLIC_SUPABASE_URL:url,NEXT_PUBLIC_SUPABASE_ANON_KEY:anonKey};
  app=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port','3200'],{env:appEnv,stdio:['ignore','ignore','ignore']});
  for(let i=0;i<100;i++){try{if((await fetch(base+'/admin/login')).ok)break;}catch{}await new Promise(r=>setTimeout(r,300));}
  browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
  const ctx=await browser.newContext({baseURL:base});await ctx.route('**/*',route=>new URL(route.request().url()).hostname==='127.0.0.1'?route.continue():route.abort());const page=await ctx.newPage();
  await test('actual Next.js Admin login with real local GoTrue SSR session and Draft product page',async()=>{
   await page.goto('/admin/login');await page.getByLabel('Email address').fill(people.admin.email);await page.getByLabel('Password',{exact:true}).fill(password);await page.getByRole('button',{name:'Sign in securely'}).click();await page.waitForURL(/\/admin$/);await expect(page.getByRole('heading',{name:'Store overview'})).toBeVisible();await page.goto('/admin/products/'+product.id);await expect(page.getByLabel('Product title')).toHaveValue('Synthetic official-service test');
   const cookies=await ctx.cookies(base+'/admin');assert(cookies.filter(c=>c.name.startsWith('murad-admin-session')).every(c=>c.httpOnly&&c.path==='/admin'&&c.sameSite==='Strict'));
  });
  if(storageAvailable)await test('actual Next.js image upload/derivative and private original preview through local Storage',async()=>{
   const csrf=(await ctx.cookies(base+'/admin')).find(c=>c.name==='murad-admin-csrf')?.value;
   const bytes=await sharp({create:{width:800,height:500,channels:3,background:'#d0d8df'}}).png().toBuffer();
   const r=await ctx.request.post('/admin/media/api',{headers:{Origin:base,'X-CSRF-Token':csrf},multipart:{upload_id:randomUUID(),target_id:product.id,kind:'product',version:sql(`SELECT version FROM public.products WHERE id='${product.id}';`),alt_text:'Synthetic local test raster',file:{name:'local-test.png',mimeType:'image/png',buffer:bytes}}});assert.equal(r.status(),200,await r.text());
   const media=sql(`SELECT media_id FROM public.product_images WHERE product_id='${product.id}' LIMIT 1;`);assert.equal((await ctx.request.get('/admin/media/file/'+media+'/original')).status(),200);assert.equal((await ctx.request.get('/media/catalog/'+media+'/640')).status(),404);
  });
  await test('real Admin desktop/mobile screenshots and unknown product 404/noindex',async()=>{
   mkdirSync(dir+'/screenshots',{recursive:true});await page.goto('/admin/products/'+product.id);const workspace=await ctx.request.get('/admin/media/api?kind=product&id='+product.id);assert.equal(workspace.status(),200,'Real PostgREST media-workspace contract');await expect(page.getByLabel('Original image',{exact:true})).toBeVisible();await page.screenshot({path:dir+'/screenshots/admin-real-local-desktop.png',fullPage:true});await page.setViewportSize({width:390,height:844});await page.screenshot({path:dir+'/screenshots/admin-real-local-mobile.png',fullPage:true});assert.equal((await ctx.request.get('/product/synthetic-official-service-test')).status(),404);assert((await ctx.request.get('/robots.txt')).ok());
  });
 }finally{await browser?.close();app?.kill('SIGTERM');}
 await test('actual local TOTP enrollment, challenge verification and AAL2 RLS policy',async()=>{
  const auth=people.admin.client.auth,entry=ok(await auth.mfa.enroll({factorType:'totp',friendlyName:'Disposable local TOTP'}));
  const alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';let bits='';for(const c of entry.totp.secret.toUpperCase().replace(/=+$/,''))bits+=alphabet.indexOf(c).toString(2).padStart(5,'0');const secret=Buffer.from(bits.match(/.{8}/g).map(x=>parseInt(x,2)));
  const counter=Buffer.alloc(8);counter.writeBigUInt64BE(BigInt(Math.floor(Date.now()/30000)));const digest=createHmac('sha1',secret).update(counter).digest(),offset=digest.at(-1)&15,code=String((digest.readUInt32BE(offset)&0x7fffffff)%1000000).padStart(6,'0');
  const challenge=ok(await auth.mfa.challenge({factorId:entry.id}));ok(await auth.mfa.verify({factorId:entry.id,challengeId:challenge.id,code}));
  sql('UPDATE app_private.catalog_security_policy SET require_mfa=true;');
  assert((await people.editor.client.rpc('save_product_draft',{product_id:null,expected_version:null,input:{name:'Denied',slug:'denied'}})).error);
  assert.equal(ok(await people.admin.client.rpc('current_catalog_role')),'admin');
  const access=ok(await people.admin.client.rpc('catalog_session_access'));assert.equal(access.aal,'aal2');assert.equal(access.mfa_required,true);const low=client(anonKey);ok(await low.auth.signInWithPassword({email:people.admin.email,password}));assert((await low.rpc('save_product_draft',{product_id:null,expected_version:null,input:{name:'AAL1 denied',slug:'aal1-denied'}})).error);ok(await people.admin.client.rpc('save_product_draft',{product_id:null,expected_version:null,input:{name:'Synthetic AAL2 authorized',slug:'synthetic-aal2-authorized'}}));result.localTotp=true;
 });
 await test('real local Auth logout clears session',async()=>{for(const person of Object.values(people)){ok(await person.client.auth.signOut());assert.equal((await person.client.auth.getSession()).data.session,null);}});
}
