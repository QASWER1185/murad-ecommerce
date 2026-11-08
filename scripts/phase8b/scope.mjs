// Pure, offline checks only. No DNS, HTTP, database client or secret loading.
// A valid declaration is NOT proof of live isolation/ownership/permissions.
export function cleanHttpsOrigin(value) {
  if (typeof value !== 'string' || !value) throw Error('Origin missing');
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/' || url.search || url.hash || ['localhost','127.0.0.1','[::1]'].includes(url.hostname)) throw Error('Clean hosted HTTPS origin required');
  return url.origin;
}
export function assessStagingScope(env, deny) {
  const missing=[],rejected=[];
  const need=(value,label)=>{if(!value)missing.push(label);};
  need(env.STAGING_PROJECT_REF,'staging_supabase_project_ref');
  need(env.CATALOG_SUPABASE_URL,'staging_supabase_api_origin');
  need(env.CATALOG_SITE_ORIGIN,'distinct_staging_https_origin');
  need(env.STAGING_HOSTING_PROJECT_ID,'staging_hosting_project_id');
  need(env.STAGING_HOSTING_ENVIRONMENT,'staging_hosting_environment');
  let apiOrigin=null,appOrigin=null;
  if(env.STAGING_PROJECT_REF&&!/^[a-z0-9]{20}$/.test(env.STAGING_PROJECT_REF))rejected.push('invalid_supabase_project_identifier');
  if(env.STAGING_PROJECT_REF && deny.supabaseProjectRefs.includes(env.STAGING_PROJECT_REF.toLowerCase()))rejected.push('production_supabase_project');
  for(const [key,type] of [['CATALOG_SUPABASE_URL','api'],['CATALOG_SITE_ORIGIN','app']])if(env[key]){
    try{
      const origin=cleanHttpsOrigin(env[key]);
      if(type==='api'){
        apiOrigin=origin;
        if(deny.supabaseOrigins.map(cleanHttpsOrigin).includes(origin))rejected.push('production_supabase_origin');
        if(!/^[a-z0-9]{20}$/.test(env.STAGING_PROJECT_REF||'') || new URL(origin).hostname!==`${env.STAGING_PROJECT_REF}.supabase.co`)rejected.push('supabase_project_origin_mismatch');
      }else{
        appOrigin=origin;
        if(deny.applicationOrigins.map(cleanHttpsOrigin).includes(origin))rejected.push('production_application_origin');
      }
    }catch{rejected.push(type==='api'?'invalid_supabase_origin':'invalid_staging_origin');}
  }
  if(env.STAGING_HOSTING_ENVIRONMENT && !['preview','staging'].includes(env.STAGING_HOSTING_ENVIRONMENT))rejected.push('production_or_unknown_hosting_environment');
  if(env.STAGING_HOSTING_PROJECT_ID&&!/^prj_[a-zA-Z0-9]{8,80}$/.test(env.STAGING_HOSTING_PROJECT_ID))rejected.push('invalid_vercel_project_identifier');
  // Optional private binding is inspected in memory only; no URL/user/password
  // value is returned. Supabase poolers identify the project in the username.
  if(env.STAGING_DATABASE_URL)try{
    const url=new URL(env.STAGING_DATABASE_URL),user=decodeURIComponent(url.username);
    if(!['postgres:','postgresql:'].includes(url.protocol))throw Error();
    if(deny.supabaseProjectRefs.some(ref=>url.hostname===`db.${ref}.supabase.co` || user===`postgres.${ref}` || user.endsWith(`.${ref}`)))rejected.push('production_database_binding');
  }catch{rejected.push('invalid_database_binding');}
  const accessBindings=['STAGING_DATABASE_URL','STAGING_SUPABASE_OPERATOR_BINDING','STAGING_HOSTING_OPERATOR_BINDING'];
  const missingAccessBindings=accessBindings.filter(name=>!env[name]);
  const budgetFields=['STAGING_SPENDING_CAP','STAGING_BUDGET_CURRENCY','STAGING_MAX_REQUESTS','STAGING_MAX_CONCURRENCY','STAGING_MAX_DURATION_SECONDS','STAGING_MAX_SYNTHETIC_PRODUCTS'];
  const missingBudgetFields=budgetFields.filter(name=>!env[name]);
  const invalidBudgetFields=[];
  for(const key of budgetFields.filter(k=>!k.includes('CURRENCY')))if(env[key] && (!/^\d+$/.test(env[key])||!Number.isSafeInteger(Number(env[key]))))invalidBudgetFields.push(key);
  if(env.STAGING_BUDGET_CURRENCY&&!/^[A-Z]{3}$/.test(env.STAGING_BUDGET_CURRENCY))invalidBudgetFields.push('STAGING_BUDGET_CURRENCY');
  return {
    scope:'offline declaration and presence checks only',
    status:rejected.length?'REJECTED':missing.length?'BLOCKED':'DECLARATION_VALID',
    missing,rejected:[...new Set(rejected)],missingAccessBindings,missingBudgetFields,invalidBudgetFields,
    requiresIndependentVerification:['project identity','hostname ownership and aliases','production separation','no real customer data','staging-only operator permissions','provider limits and explicit resource budget','backup and separate restore target'],
    hostedRequestsAttempted:0,liveIsolationVerified:false,hostedExecutionReady:false,
    // These origins are non-secret; never include a database URL or key value.
    declaredStaging:rejected.length?null:{projectRef:env.STAGING_PROJECT_REF||null,apiOrigin,applicationOrigin:appOrigin,hostingProjectId:env.STAGING_HOSTING_PROJECT_ID||null,hostingEnvironment:env.STAGING_HOSTING_ENVIRONMENT||null},
  };
}
