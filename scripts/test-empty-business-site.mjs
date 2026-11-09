// Focused post-launch regression checks. Local app + isolated backend trap only.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
const dir='work/post-launch-checks',base='http://127.0.0.1:3100';
mkdirSync(dir,{recursive:true});
const backendCalls=[],trap=createServer((request,response)=>{backendCalls.push(request.url);response.writeHead(500);response.end('Unexpected backend access')});
await new Promise(resolve=>trap.listen(0,'127.0.0.1',resolve));
const backend='http://127.0.0.1:'+trap.address().port,env={...process.env};
for(const key of Object.keys(env))if(/^(ADMIN_|CATALOG_|ORDER_|ANALYTICS_|GA4_|SUPABASE_|VERCEL_|BUSINESS_|NEXT_PUBLIC_SUPABASE_)/.test(key))delete env[key];
Object.assign(env,{NEXT_TELEMETRY_DISABLED:'1',BUSINESS_SITE_MODE:'empty-catalog',BUSINESS_SITE_ORIGIN:base,BUSINESS_INDEXING_ENABLED:'true',VERCEL_ENV:'production',
 CATALOG_ENABLED:'true',CATALOG_ENVIRONMENT:'local',CATALOG_SITE_ORIGIN:base,CATALOG_SUPABASE_URL:backend,CATALOG_SUPABASE_PUBLISHABLE_KEY:'local-test-only',
 ADMIN_ENABLED:'true',ADMIN_ENVIRONMENT:'local',ADMIN_SITE_ORIGIN:base,ADMIN_SUPABASE_URL:backend,ADMIN_SUPABASE_PUBLISHABLE_KEY:'local-test-only',ADMIN_RATE_LIMIT_SECRET:'b'.repeat(64),
 ORDER_REQUESTS_ENABLED:'true',CATALOG_MEDIA_ENABLED:'true',CATALOG_INDEXING_ENABLED:'true',CATALOG_WORKER_ENABLED:'true',ANALYTICS_ENABLED:'true',
 NEXT_PUBLIC_SUPABASE_URL:backend,NEXT_PUBLIC_SUPABASE_ANON_KEY:'local-test-only'});
let app,browser,log='',checks=0;
const results=[],outside=[],errors=[];
const check=async(name,run)=>{await run();checks++;results.push(name);console.log('PASS '+name)};
const stop=async()=>{if(app&&app.exitCode===null){const done=new Promise(resolve=>app.once('exit',resolve));app.kill('SIGTERM');await done;}};
const start=async(overrides={})=>{
 log='';app=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port','3100'],{env:{...env,...overrides},stdio:['ignore','pipe','pipe']});
 for(const stream of [app.stdout,app.stderr])stream.on('data',data=>{log=(log+data).slice(-10000)});
 let ready=false;for(let i=0;i<100;i++){if(app.exitCode!==null)throw Error(log);try{if((await fetch(base)).ok){ready=true;break}}catch{}await new Promise(r=>setTimeout(r,200))}assert(ready,'Local app start');
};
try{
 await start();
 browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 const context=await browser.newContext({baseURL:base,viewport:{width:1200,height:900}});
 await context.route('**/*',route=>{const url=new URL(route.request().url());if(url.hostname==='wa.me')return route.fulfill({contentType:'text/html',body:'WhatsApp intercepted; no message sent.'});if(url.origin!==base){outside.push(url.origin);return route.abort()}return route.continue()});
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 const settle=async()=>{await page.waitForLoadState('networkidle');await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode().catch(()=>{})))});};
 const assertEmpty=async()=>{await expect(page.locator('article')).toHaveCount(0);assert(!/PKR\s*[\d,]+/.test(await page.locator('main').innerText()));await expect(page.getByRole('button',{name:/Cart|Checkout|Wishlist/i})).toHaveCount(0);};
 await check('Business indexing is an exact three-page allowlist with matching headers, metadata, canonicals and sitemap',async()=>{
  const indexable=['/','/about','/contact'],titles=new Set();
  for(const path of indexable){const response=await page.goto(path);assert.equal(response.status(),200);await settle();await assertEmpty();
   assert(!(response.headers()['x-robots-tag']||'').includes('noindex'));await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content',/^index, follow$/);
   assert.equal(new URL(await page.locator('link[rel=canonical]').getAttribute('href')).href,new URL(path,base).href);
   const title=await page.title();assert(!titles.has(title));titles.add(title);await expect(page.locator('h1')).toHaveCount(1);
   await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content',new URL(path,base).href);
  }
  const sitemap=await(await context.request.get('/sitemap.xml')).text();
  assert.deepEqual([...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>m[1]),indexable.map(path=>new URL(path,base).href));
  const robots=await(await context.request.get('/robots.txt')).text();
  for(const rule of ['Allow: /$','Allow: /about$','Allow: /contact$','Disallow: /admin','Disallow: /product/','Disallow: /search','Sitemap: '+base+'/sitemap.xml'])assert(robots.includes(rule),rule);
  for(const path of ['/?q=Porta','/about?source=test','/contact?source=test','/categories','/brands','/search?q=Porta','/category/sanitary','/brand/porta','/privacy']){
   const response=await page.goto(path);assert.equal(response.status(),200,path);assert.match(response.headers()['x-robots-tag']||'',/noindex/);
   await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content',/noindex/);
  }
 });
 await check('Verified About/Contact and release-specific Privacy information, consistent branding and no inactive social controls',async()=>{
  await page.goto('/about');await settle();await expect(page.getByRole('heading',{name:'About M Murad Sons',exact:true})).toBeVisible();
  await expect(page.locator('main')).toContainText('Adda Plot, Al Kabir Town, Raiwind Road, Lahore, Pakistan');
  assert((await page.locator('header a[aria-label="M Murad Sons home"] > span').evaluate(e=>getComputedStyle(e).backgroundImage)).includes('/homepage/logo-header.png'));
  assert((await page.locator('footer a[aria-label="M Murad Sons home"] > span').evaluate(e=>getComputedStyle(e).backgroundImage)).includes('/homepage/logo-footer.png'));
  await page.goto('/contact');await settle();
  const links=await page.locator('main a[href^="https://wa.me/"]').evaluateAll(a=>a.map(x=>new URL(x.href).pathname));assert.deepEqual(links,['/923217165000','/923086235608']);
  assert((await page.locator('main a[href^="https://www.google.com/maps/"]').getAttribute('href')).includes('Adda+Plot'));
  await page.goto('/privacy');await settle();await expect(page.locator('main')).toContainText('does not offer account registration, checkout or online payments');
  await expect(page.locator('main')).not.toContainText('Cart and wishlist storage');
  await expect(page.locator('footer').getByRole('heading',{name:'Follow Us'})).toHaveCount(0);
  for(const path of ['/about','/contact','/privacy'])assert(await page.locator('footer a[href="'+path+'"]').count());
 });
 await check('Porta and category search returns existing collection links, handles no matches and escapes input',async()=>{
  for(const [term,path]of[['Porta','/brand/porta'],['Electrical','/category/electric'],['building materials','/category/building-material']]){
   await page.goto('/search?q='+encodeURIComponent(term));await settle();await expect(page.getByRole('region',{name:'Brand and category search results'}).locator('a[href="'+path+'"]')).toBeVisible();await assertEmpty();
  }
  await page.goto('/search?q=not-a-real-product');await expect(page.locator('main')).toContainText('No matching brands or categories');
  await page.goto('/search?q='+encodeURIComponent('<script>alert(1)</script>'));await expect(page.getByRole('region',{name:'Brand and category search results'})).toContainText('<script>alert(1)</script>');await expect(page.locator('main script')).toHaveCount(0);
 });
 await check('Approved category order, all homepage links, single hero enquiry and category-specific symbols',async()=>{
  await page.goto('/');await settle();
  const nav=await page.getByRole('navigation',{name:'Product categories'}).locator('a[href^="/category/"]').evaluateAll(a=>a.map(x=>new URL(x.href).pathname));
  assert.deepEqual(nav,['/category/sanitary','/category/electric','/category/building-material','/category/imported-products']);
  for(const link of [...new Set(await page.locator('a[href^="/"]').evaluateAll(a=>a.map(x=>new URL(x.href).pathname)))])assert.equal((await context.request.get(link)).status(),200,link);
  await expect(page.locator('footer').getByRole('link',{name:'About Us',exact:true})).toHaveAttribute('href','/about');
  const hero=page.getByRole('region',{name:'Premium sanitary collection'});await expect(hero.getByRole('link',{name:'WhatsApp Inquiry'})).toBeVisible();await expect(hero.locator('button')).toHaveCount(0);
  for(const [slug,asset]of[['sanitary','shower-symbol'],['electric','category-electric'],['building-material','category-building']]){
   await page.goto('/category/'+slug);await settle();assert((await page.locator('[data-category-icon="'+slug+'"]').evaluate(e=>getComputedStyle(e).backgroundImage)).includes(asset));
   await expect(page.getByRole('region',{name:'Product catalogue information'})).toBeVisible();await assertEmpty();
   assert(!(await page.locator('body').innerText()).includes('Shop Now'));assert(!(await page.locator('body').innerText()).includes('Deals & Offers'));
  }
 });
 await check('Both WhatsApp buttons open the correct numbers and building-material rate messages without sending',async()=>{
  await page.goto('/category/building-material');const region=page.getByRole('region',{name:'Product catalogue information'});
  for(const [label,digits]of[['0321-7165000','923217165000'],['0308-6235608','923086235608']]){
   const link=region.getByRole('link',{name:'WhatsApp '+label,exact:true});const url=new URL(await link.getAttribute('href'));assert.equal(url.pathname,'/'+digits);assert(url.searchParams.get('text').includes("today's rates"));
   const opening=context.waitForEvent('page');await link.click();const popup=await opening;await popup.waitForLoadState();assert.equal(new URL(popup.url()).hostname,'wa.me');await popup.close();
  }
  const hero=page.locator('main > section').first();await expect(hero.getByRole('link',{name:'Ask Today’s Rate',exact:true})).toHaveAttribute('href',/^https:\/\/wa\.me\/923217165000\?/);
 });
 await check('Mobile navigation, readable WhatsApp targets, desktop/mobile screenshots and accessibility',async()=>{
  for(const width of [1200,390,320])for(const [path,name]of[['/','home'],['/category/sanitary','sanitary'],['/category/building-material','materials'],['/brand/porta','porta'],['/about','about'],['/contact','contact']]){
   await page.setViewportSize({width,height:width===1200?900:844});await page.goto(path);await settle();
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),path+' '+width+' overflow');
   await assertEmpty();
   if(width===390||width===1200)await page.screenshot({path:dir+'/'+name+'-'+width+'.png',fullPage:true});
   if(width<600){
    const nav=page.getByRole('navigation',{name:path==='/'?'Product categories':'Shopping navigation'});
    assert(await nav.locator('a').evaluateAll(a=>a.every(x=>{const r=x.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth+1&&r.height>=44})),path+' nav clipped');
    const main=page.locator('header a[aria-label="Main WhatsApp contact"]:visible');
    if(path==='/'){await expect(main).toContainText('0321-7165000');assert((await main.boundingBox()).height>=44);await expect(page.locator('header a[aria-label="Secondary WhatsApp contact"]')).toContainText('0308-6235608');}
   }
   if(width===390&&['/','/brand/porta','/contact'].includes(path)){
    const axe=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();assert.deepEqual(axe.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})),[],path+' accessibility');
   }
  }
 });
 await check('Conflicting backend flags cannot activate Admin, private products, media, carts or payments',async()=>{
  for(const path of ['/admin','/admin/login','/admin/products','/admin/media/api'])assert.equal((await context.request.get(path)).status(),503,path);
  for(const path of ['/api/catalog/cart','/checkout','/wishlist','/api/payments','/product/unknown','/category/unknown','/brand/unknown','/category/sanitary?page=2','/media/catalog/00000000-0000-0000-0000-000000000001/320'])assert.equal((await context.request.get(path)).status(),404,path);
  assert.equal((await(await context.request.get('/api/order-requests/session')).json()).enabled,false);
  assert.equal((await context.request.post('/api/order-requests',{data:{}})).status(),503);
  assert.deepEqual(backendCalls,[]);assert.deepEqual(outside,[]);assert.deepEqual(errors,[]);
 });
 await check('Preview and explicit flag-off profiles fail closed for indexing and never expose product URLs',async()=>{
  await context.close();
  for(const overrides of [{VERCEL_ENV:'preview'},{BUSINESS_INDEXING_ENABLED:'false'}]){
   await stop();await start(overrides);
   const home=await fetch(base);assert.match(home.headers.get('x-robots-tag'),/noindex/);assert((await home.text()).includes('noindex, follow'));
   assert(!(await(await fetch(base+'/sitemap.xml')).text()).includes('<loc>'));
   assert((await(await fetch(base+'/robots.txt')).text()).includes('Disallow: /'));
  }
  assert.deepEqual(backendCalls,[]);
 });
 writeFileSync(dir+'/results.json',JSON.stringify({timestampUTC:new Date().toISOString(),runtime:process.version,checks,results,backendRequests:backendCalls.length,outsideRequests:outside.length,browserErrors:errors.length,productsPublished:0,productionChanges:0,indexablePaths:['/','/about','/contact'],previewAndFlagOffNoindex:true},null,2)+'\n');
}catch(error){console.error(log.slice(-4000));throw error}
finally{await browser?.close();await stop();await new Promise(resolve=>trap.close(resolve))}
