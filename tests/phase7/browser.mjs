import {spawn} from "node:child_process";
import { chromium, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import {mkdirSync,writeFileSync,existsSync} from 'node:fs';
import {fixturePassword} from '../../scripts/phase3/local-fixture.mjs';
export async function readinessBrowserTests(f,s,w){
 const base='http://127.0.0.1:3100',dir='work/phase7-review';mkdirSync(`${dir}/screenshots`,{recursive:true});
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 const context=await browser.newContext({baseURL:base,viewport:{width:1200,height:900}});
 // No real Google requests: optional consent remains ungranted for this suite.
 await context.route(/googletagmanager|google-analytics/,r=>r.abort());
 const page=await context.newPage(),a11y=[],seo=[],comparisons=[];let groups=0;
 const test=async(name,fn)=>{await fn();groups++;console.log(`✓ ${name}`);};
 const capture=async(p,name)=>{
  await p.evaluate(async()=>{window.scrollTo(0,0);await document.fonts.ready;await Promise.all([...document.images].map(async i=>{i.loading='eager';await i.decode();}));});
  await p.screenshot({path:`${dir}/screenshots/${name}.png`,fullPage:true});
 };
 const audit=async(p,name)=>{
  if(process.env.READINESS_QUICK==='true')return;
  const result=await new AxeBuilder({page:p}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();
  a11y.push({name,passes:result.passes.length,violations:result.violations.map(v=>({id:v.id,impact:v.impact,description:v.description,helpUrl:v.helpUrl,nodes:v.nodes.map(n=>({target:n.target,failureSummary:n.failureSummary}))}))});
  writeFileSync(`${dir}/accessibility.json`,JSON.stringify(a11y,null,2)+'\n');
 };
 const csrf=async()=> (await context.cookies(base+'/admin')).find(c=>c.name==='murad-admin-csrf')?.value;
 try{
  await test('desktop homepage and Sanitary screenshots preserve approved geometry',async()=>{
   await page.goto('/');await expect(page.getByRole('heading',{name:'Featured Products',exact:true})).toBeVisible();await capture(page,'home-desktop');await audit(page,'home-desktop');
   await page.goto('/category/sanitary');await expect(page.getByRole('heading',{level:1})).toContainText('Sanitary & Bathroom');await capture(page,'sanitary-desktop');await audit(page,'sanitary-desktop');
  });
  await test('crawlable content, canonical URLs, headings, breadcrumbs, noindex and truthful schemas',async()=>{
   for(const path of ['/','/category/sanitary','/brand/porta','/product/local-fixture-1','/category/sanitary?sort=price-low','/search?q=local']){
    const r=await page.goto(path);assert.equal(r.status(),200);
    await expect(page.locator('h1')).toHaveCount(1);
    const canonical=await page.locator('link[rel="canonical"]').count()?await page.locator('link[rel="canonical"]').getAttribute('href'):null;
    if(canonical)assert(!canonical.includes('?'));
    if(!path.startsWith('/search'))assert(canonical);
    const meta=await page.locator('meta[name="robots"]').evaluateAll(nodes=>nodes.map(n=>n.content));assert(meta.some(v=>v.includes('noindex')));
    const schemas=await page.locator('script[type="application/ld+json"]').evaluateAll(nodes=>nodes.map(n=>JSON.parse(n.textContent)));
    assert(!JSON.stringify(schemas).includes('aggregateRating'));assert(!schemas.some(v=>v['@type']==='Product'),'Production eligibility is deliberately disabled');
    if(path.startsWith('/product/')||path.startsWith('/brand/')||path.startsWith('/category/'))assert(schemas.some(v=>v['@type']==='BreadcrumbList'));
    seo.push({path,status:r.status(),title:await page.title(),canonical,robots:meta,schemas:schemas.map(v=>v['@type']),h1:await page.locator('h1').innerText()});
    if(path==='/product/local-fixture-1') {await capture(page,'product-desktop');await audit(page,'product-desktop');}
    if(path==='/brand/porta')await audit(page,'brand-desktop');
   }
   const html=await (await context.request.get('/product/local-fixture-1')).text();assert(html.includes('Local fixture 01'),'SSR product text');
   assert.equal((await context.request.get('/product/never-published-fixture')).status(),404);
   const robots=await(await context.request.get('/robots.txt')).text();assert(robots.includes('Disallow: /'));
   const sitemap=await(await context.request.get('/sitemap.xml')).text();assert(!sitemap.includes('<loc>'));
  });
  await test('machine endpoint denies unauthenticated, forged, expired and browser-origin requests',async()=>{
   const path='/api/internal/catalog-invalidations';
   assert.equal((await context.request.get(path)).status(),405);
   assert.equal((await context.request.post(path,{data:{}})).status(),401);
   const args=w.envelope('claim',{limit:25});
   const response=await context.request.post(path,{headers:{'Content-Type':'application/json','X-Catalog-Worker-Signature':args.p_signature,Origin:base},data:args.p_envelope});assert.equal(response.status(),401);
   assert.equal((await context.request.post(path,{headers:{'Content-Type':'application/json','X-Catalog-Worker-Signature':'0'.repeat(64)},data:args.p_envelope})).status(),401);
   const stale=w.envelope('claim',{limit:25,issued:Math.floor(Date.now()/1000)-120});
   assert.equal((await context.request.post(path,{headers:{'Content-Type':'application/json','X-Catalog-Worker-Signature':stale.p_signature},data:stale.p_envelope})).status(),401);
  });
  await test('dedicated worker claims and acknowledges without a human session; replay fails closed',async()=>{
   const args=w.envelope('claim',{limit:25}),request={headers:{'Content-Type':'application/json','X-Catalog-Worker-Signature':args.p_signature},data:args.p_envelope};
   const first=await context.request.post('/api/internal/catalog-invalidations',request);assert.equal(first.status(),200);const result=await first.json();assert.equal(result.claimed,25);assert.equal(result.processed,25);assert.equal(result.failed,0);
   assert.equal((await context.request.post('/api/internal/catalog-invalidations',request)).status(),503);
   assert(!JSON.stringify(result).includes('secret'));assert(Object.keys(result.health).every(k=>['pending','retrying','oldest_seconds','leased'].includes(k)));
   const cli=await new Promise((resolve,reject)=>{
    const child=spawn(process.execPath,['scripts/phase7/run-catalog-worker.mjs'],{env:{...process.env,CATALOG_WORKER_ENABLED:'true',CATALOG_WORKER_ENVIRONMENT:'local',CATALOG_WORKER_SITE_ORIGIN:base,CATALOG_WORKER_KEY_ID:w.keyId,CATALOG_WORKER_SECRET:w.secret},stdio:['ignore','pipe','pipe']});let output='';
    child.stdout.on('data',b=>{output+=b});child.stderr.on('data',b=>{output+=b});child.once('error',reject);child.once('exit',code=>resolve({code,output}));
   });
   assert.equal(cli.code,0,cli.output);assert.equal(JSON.parse(cli.output).event,'catalog_worker_run');assert(!cli.output.includes(w.secret));
  });
  await test('mobile layouts, both WhatsApp contacts and responsive public image delivery',async()=>{
   const mobile=await browser.newContext({baseURL:base,viewport:{width:390,height:844},isMobile:true,hasTouch:true}),p=await mobile.newPage();
   for(const [path,name] of [['/','home-mobile'],['/category/sanitary','sanitary-mobile'],['/product/local-fixture-1','product-mobile']]){
    await p.goto(path);await expect(p.locator('h1')).toBeVisible();await capture(p,name);
    assert(await p.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),'No horizontal layout overflow');
    if(path==='/') for(const number of ['923217165000','923086235608'])assert(await p.locator(`a[href^="https://wa.me/${number}"]`).count()>0);
    await audit(p,name);
   }
   await mobile.close();
  });
  await test('same-fixture screenshot comparison against Phase 6 committed references',async()=>{
   for(const name of ['home-desktop','home-mobile','sanitary-desktop','sanitary-mobile']){
    const baseline=`docs/phase6/screenshots/${name}.png`,current=`${dir}/screenshots/${name}.png`;assert(existsSync(baseline));
    const a=await sharp(baseline).ensureAlpha().raw().toBuffer({resolveWithObject:true}),b=await sharp(current).ensureAlpha().raw().toBuffer({resolveWithObject:true});
    const sameDimensions=a.info.width===b.info.width&&a.info.height===b.info.height;let changed=null,exactChangedPixelsPercent=null,maximumChannelDifference=null;
    if(sameDimensions){let pixels=0,exact=0,max=0;for(let i=0;i<a.data.length;i+=4){let delta=0;for(let c=0;c<4;c++)delta=Math.max(delta,Math.abs(a.data[i+c]-b.data[i+c]));if(delta>20)pixels++;if(delta>0)exact++;max=Math.max(max,delta);}changed=pixels/(a.info.width*a.info.height)*100;exactChangedPixelsPercent=exact/(a.info.width*a.info.height)*100;maximumChannelDifference=max;}
    comparisons.push({name,baseline:{width:a.info.width,height:a.info.height},current:{width:b.info.width,height:b.info.height},sameDimensions,changedPixelsPercent:changed,thresholdPerChannel:20,exactChangedPixelsPercent,maximumChannelDifference});
    assert(sameDimensions,`${name} geometry changed`);
    assert.equal(changed,0,`${name} visible pixels changed`);
   }
  });
  await test('keyboard opens the cart, keeps focus inside its dialog and returns focus on Escape',async()=>{
   await page.goto('/');await page.getByRole('button',{name:'Add to Cart',exact:true}).first().click();const button=page.getByRole('button',{name:/Cart.*items/});await button.focus();await page.keyboard.press('Enter');
   const dialog=page.getByRole('dialog',{name:'Your Cart',exact:true});await expect(dialog).toBeVisible();await expect(dialog.getByRole('spinbutton')).toBeVisible();await page.keyboard.press('Tab');
   assert(await page.evaluate(()=>!!document.activeElement.closest('dialog')),'Dialog focus must remain trapped');
   await page.keyboard.press('Escape');await expect(dialog).not.toBeVisible();await expect(button).toBeFocused();
  });
  await test('AAL1 trusted Admin is blocked before challenge, including authorized previews',async()=>{
   f.sql('UPDATE app_private.catalog_security_policy SET require_mfa=true;');
   await page.goto('/admin/login');await page.getByLabel('Email address').fill('admin@murad.test');await page.getByLabel('Password',{exact:true}).fill(fixturePassword);await page.getByRole('button',{name:'Sign in securely'}).click();await page.waitForURL('**/admin/mfa');
   await expect(page.getByRole('heading',{name:'Verify your identity'})).toBeVisible();await capture(page,'admin-mfa-desktop');await audit(page,'admin-mfa-desktop');
   const preview=await context.request.get(`/admin/products/${s.products[0].id}/preview`);assert(preview.url().includes('/admin/mfa'));
   const denied=await context.request.post('/admin/invalidations',{headers:{Origin:base,'Content-Type':'application/json','X-CSRF-Token':await csrf()},data:{}});assert.equal(denied.status(),403);
   await page.setViewportSize({width:390,height:844});await page.goto('/admin/mfa');await capture(page,'admin-mfa-mobile');await page.setViewportSize({width:1200,height:900});
  });
  await test('verified TOTP step-up, incorrect code, secure cookies and role revocation',async()=>{
   await page.goto('/admin/mfa');await page.getByLabel('Verification code').fill('000000');await page.getByRole('button',{name:'Verify and continue'}).click();await expect(page.getByRole('alert').filter({hasText:'Unable to verify code'})).toBeVisible();
   await page.getByLabel('Verification code').fill('123456');await page.getByRole('button',{name:'Verify and continue'}).click();await page.waitForURL(/\/admin$/);await expect(page.locator('h1')).toBeVisible();await capture(page,'admin-overview-desktop');await audit(page,'admin-overview-desktop');
   await page.setViewportSize({width:390,height:844});await capture(page,'admin-overview-mobile');await audit(page,'admin-overview-mobile');await page.setViewportSize({width:1200,height:900});
   const session=(await context.cookies()).find(c=>c.name.startsWith('murad-admin-session'));assert(session.httpOnly&&session.sameSite==='Strict'&&session.path==='/admin');
   f.sql("DELETE FROM app_private.user_roles WHERE user_id='00000000-0000-0000-0000-000000000001';");
   await page.goto('/admin/products');await page.waitForURL('**/admin/login?notice=access');
   f.sql("INSERT INTO app_private.user_roles(user_id,role) VALUES('00000000-0000-0000-0000-000000000001','admin');UPDATE app_private.catalog_security_policy SET require_mfa=false;");
  });
  await test('withdrawal removes public product and derivative with no shared optimizer escape',async()=>{
   const target=s.products[0];const path=`/media/catalog/${target.media}/640`;
   const before=await context.request.get(path);assert.equal(before.status(),200);assert(before.headers()['cache-control'].includes('no-store'));
   s.rpc('return_catalog_to_draft',{kind:'product',entity_id:target.id,expected_version:s.version('products',target.id)});
   assert.equal((await context.request.get('/product/'+target.slug)).status(),404);
   assert.equal((await context.request.get(path)).status(),404);
   assert.equal((await context.request.get('/_next/image?url='+encodeURIComponent(path)+'&w=640&q=75')).status(),403);
  });
  for(const entry of a11y) {assert(entry.violations.every(v=>v.id==='color-contrast'),'No unresolved semantic accessibility defects');if(entry.name.startsWith('admin-'))assert.equal(entry.violations.length,0,`Admin accessibility: ${entry.name}`);}
  writeFileSync(`${dir}/accessibility.json`,JSON.stringify(a11y,null,2)+'\n');
  writeFileSync(`${dir}/seo.json`,JSON.stringify(seo,null,2)+'\n');
  writeFileSync(`${dir}/visual-comparison.json`,JSON.stringify(comparisons,null,2)+'\n');
  console.log(`Phase 7 browser: ${groups} security/SEO/visual groups passed. Axe results recorded separately; no invented accessibility pass claim.`);
 }finally{await context.close();await browser.close();}
}
export async function measureBrowser(){
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 const measurements=[];
 try{
  for(const path of ['/','/category/sanitary','/brand/porta','/product/local-fixture-1'])for(let run=1;run<=3;run++){
   const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
   await context.addInitScript(()=>{
    window.__phase7Vitals={lcp:0,cls:0,interactions:[]};
    new PerformanceObserver(list=>{for(const e of list.getEntries())window.__phase7Vitals.lcp=e.startTime;}).observe({type:'largest-contentful-paint',buffered:true});
    new PerformanceObserver(list=>{for(const e of list.getEntries())if(!e.hadRecentInput)window.__phase7Vitals.cls+=e.value;}).observe({type:'layout-shift',buffered:true});
    new PerformanceObserver(list=>{for(const e of list.getEntries())if(e.interactionId)window.__phase7Vitals.interactions.push(e.duration);}).observe({type:'event',buffered:true,durationThreshold:16});
   });
   const page=await context.newPage(),cdp=await context.newCDPSession(page);await cdp.send('Network.enable');await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:150,downloadThroughput:200000,uploadThroughput:93750});
   const start=performance.now();await page.goto('http://127.0.0.1:3100'+path);await expect(page.locator('h1')).toBeVisible();await page.waitForLoadState('networkidle');
   const readyMs=performance.now()-start;
   const input=page.locator('input[name="q"]').first();if(await input.isVisible()){await input.click();await input.pressSequentially('local',{delay:60});}
   await page.waitForTimeout(300);
   const values=await page.evaluate(()=>({vitals:window.__phase7Vitals,resources:performance.getEntriesByType('resource').map(e=>({name:new URL(e.name).pathname,transferSize:e.transferSize,encodedBodySize:e.encodedBodySize,initiatorType:e.initiatorType})),navigation:performance.getEntriesByType('navigation').map(e=>({ttfbMs:e.responseStart-e.requestStart,domContentLoadedMs:e.domContentLoadedEventEnd-e.startTime,loadMs:e.loadEventEnd-e.startTime}))}));
   measurements.push({path,run,readyMs,...values,jsTransferBytes:values.resources.filter(r=>r.initiatorType==='script').reduce((n,r)=>n+r.transferSize,0)});
   await context.close();
  }
 }finally{await browser.close();}
 const report={mode:'local-lab',cpuThrottle:4,latencyMs:150,downloadBytesPerSecond:200000,viewport:'390x844',coldBrowserCache:true,fieldINP:false,notes:'Observed lab interaction durations are not field INP or a Lighthouse score. Local DB/HTTP contracts differ from hosted Supabase.',measurements};
 writeFileSync('work/phase7-review/browser-performance.json',JSON.stringify(report,null,2)+'\n');console.log('Phase 7 browser performance: twelve cold mobile lab samples recorded.');
}
