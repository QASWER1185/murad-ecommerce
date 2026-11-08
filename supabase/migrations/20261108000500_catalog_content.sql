BEGIN;
DO $$ BEGIN IF current_setting('app.catalog_cutover_approved',true) IS DISTINCT FROM 'yes' THEN RAISE EXCEPTION 'Catalog cutover not approved'; END IF; END $$;
ALTER TABLE public.homepage_banners ADD COLUMN version bigint NOT NULL DEFAULT 1,ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.site_settings ADD COLUMN version bigint NOT NULL DEFAULT 1;
ALTER TABLE public.brands ADD COLUMN logo_alt_override text CHECK(length(logo_alt_override)<=500);
ALTER TABLE public.categories ADD COLUMN hero_alt_override text CHECK(length(hero_alt_override)<=500);
ALTER TABLE public.homepage_banners ADD COLUMN alt_text_override text CHECK(length(alt_text_override)<=500);
DO $$ DECLARE t text; cols text; BEGIN
  FOREACH t IN ARRAY ARRAY['categories','brands','homepage_banners','site_settings'] LOOP
    EXECUTE format('REVOKE INSERT,UPDATE ON public.%I FROM authenticated',t);
    SELECT string_agg(quote_ident(attname),',') INTO cols FROM pg_catalog.pg_attribute WHERE attrelid=('public.'||t)::regclass AND attnum>0 AND NOT attisdropped;
    EXECUTE format('REVOKE INSERT (%s),UPDATE (%s) ON public.%I FROM authenticated',cols,cols,t);
  END LOOP;
END $$;
CREATE FUNCTION app_private.lock_catalog_draft(p_kind text,p_id uuid,p_version bigint) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE row_data jsonb; BEGIN
  EXECUTE format('SELECT to_jsonb(t) FROM public.%I t WHERE id=$1 FOR UPDATE',app_private.entity_table(p_kind)) INTO row_data USING p_id;
  IF row_data IS NULL OR p_version IS NULL OR (row_data->>'version')::bigint<>p_version THEN RAISE EXCEPTION 'Stale catalog version' USING ERRCODE='40001'; END IF;
  IF row_data->>'publication_status'<>'draft' OR row_data->>'archived_at' IS NOT NULL THEN RAISE EXCEPTION 'An active Draft is required'; END IF;
  RETURN row_data;
END $$;
REVOKE ALL ON FUNCTION app_private.lock_catalog_draft(text,uuid,bigint) FROM PUBLIC;
CREATE FUNCTION public.save_catalog_taxonomy(p_kind text,p_id uuid,p_version bigint,p_input jsonb) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE old_row jsonb; new_id uuid; c public.categories; b public.brands; BEGIN
  PERFORM app_private.require_admin();
  IF p_kind NOT IN ('category','brand') OR jsonb_typeof(p_input)<>'object' OR EXISTS(SELECT 1 FROM jsonb_object_keys(p_input) k WHERE k NOT IN ('name','slug','description','parent_id','default_sales_mode','kind','seo_title','seo_description','canonical_path')) THEN RAISE EXCEPTION 'Unsupported taxonomy fields'; END IF;
  IF length(trim(coalesce(p_input->>'name',''))) NOT BETWEEN 1 AND 180 OR length(coalesce(p_input->>'description',''))>20000 OR (p_input->>'slug') IS NULL OR (p_input->>'slug') !~ '^[a-z0-9]+(-[a-z0-9]+)*$' OR length(p_input->>'slug')>120 THEN RAISE EXCEPTION 'Name and clean permanent slug required'; END IF;
  IF p_id IS NOT NULL THEN
    old_row:=app_private.lock_catalog_draft(p_kind,p_id,p_version);
    IF old_row->>'published_at' IS NOT NULL AND old_row->>'slug'<>p_input->>'slug' THEN RAISE EXCEPTION 'Use permanent rename workflow'; END IF;
  ELSIF p_version IS NOT NULL THEN RAISE EXCEPTION 'New taxonomy must not supply a version'; END IF;
  IF p_kind='category' THEN
    c:=jsonb_populate_record(NULL::public.categories,p_input);
    IF p_id IS NULL THEN INSERT INTO public.categories(name,slug,description,parent_id,default_sales_mode,seo_title,seo_description,canonical_path) VALUES(trim(c.name),c.slug,c.description,c.parent_id,coalesce(c.default_sales_mode,'online'),c.seo_title,c.seo_description,c.canonical_path) RETURNING id INTO new_id;
    ELSE UPDATE public.categories SET name=trim(c.name),slug=c.slug,description=c.description,parent_id=c.parent_id,default_sales_mode=coalesce(c.default_sales_mode,'online'),seo_title=c.seo_title,seo_description=c.seo_description,canonical_path=c.canonical_path,version=version+1,updated_at=now(),reviewed_at=NULL,reviewed_by=NULL,reviewed_version=NULL,approved_at=NULL,approved_by=NULL,identity_verified=false,content_verified=false,indexing_approved=false WHERE id=p_id RETURNING id INTO new_id; END IF;
  ELSE
    b:=jsonb_populate_record(NULL::public.brands,p_input);
    IF p_id IS NULL THEN INSERT INTO public.brands(name,slug,description,kind,seo_title,seo_description,canonical_path) VALUES(trim(b.name),b.slug,b.description,coalesce(b.kind,'manufacturer'),b.seo_title,b.seo_description,b.canonical_path) RETURNING id INTO new_id;
    ELSE UPDATE public.brands SET name=trim(b.name),slug=b.slug,description=b.description,kind=coalesce(b.kind,'manufacturer'),seo_title=b.seo_title,seo_description=b.seo_description,canonical_path=b.canonical_path,version=version+1,updated_at=now(),reviewed_at=NULL,reviewed_by=NULL,reviewed_version=NULL,approved_at=NULL,approved_by=NULL,identity_verified=false,content_verified=false,indexing_approved=false WHERE id=p_id RETURNING id INTO new_id; END IF;
  END IF;
  RETURN new_id;
END $$;

CREATE FUNCTION public.save_catalog_banner(p_id uuid,p_version bigint,p_input jsonb) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE b public.homepage_banners; before_row public.homepage_banners; saved uuid; BEGIN
  PERFORM app_private.require_admin();
  IF jsonb_typeof(p_input)<>'object' OR EXISTS(SELECT 1 FROM jsonb_object_keys(p_input) k WHERE k NOT IN ('title','subtitle','cta_label','cta_path','sort_order')) THEN RAISE EXCEPTION 'Unsupported banner fields'; END IF;
  b:=jsonb_populate_record(NULL::public.homepage_banners,p_input);
  IF length(trim(coalesce(b.title,''))) NOT BETWEEN 1 AND 180 OR length(coalesce(b.subtitle,''))>1000 OR length(coalesce(b.cta_label,''))>100 THEN RAISE EXCEPTION 'Invalid banner content'; END IF;
  IF p_id IS NULL THEN
    IF p_version IS NOT NULL THEN RAISE EXCEPTION 'New banner must not supply a version'; END IF;
    INSERT INTO public.homepage_banners(title,subtitle,cta_label,cta_path,sort_order) VALUES(trim(b.title),b.subtitle,b.cta_label,b.cta_path,coalesce(b.sort_order,0)) RETURNING id INTO saved;
  ELSE
    SELECT * INTO before_row FROM public.homepage_banners WHERE id=p_id FOR UPDATE;
    IF NOT FOUND OR p_version IS NULL OR before_row.version<>p_version THEN RAISE EXCEPTION 'Stale banner version' USING ERRCODE='40001'; END IF;
    UPDATE public.homepage_banners SET title=trim(b.title),subtitle=b.subtitle,cta_label=b.cta_label,cta_path=b.cta_path,sort_order=coalesce(b.sort_order,0),active=false,version=version+1,updated_at=now() WHERE id=p_id RETURNING id INTO saved;
  END IF;
  PERFORM app_private.catalog_event('banners',saved,'save',to_jsonb(before_row),(SELECT to_jsonb(t) FROM public.homepage_banners t WHERE id=saved));RETURN saved;
END $$;
CREATE FUNCTION public.set_catalog_banner_active(p_id uuid,p_version bigint,p_active boolean) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE b public.homepage_banners; BEGIN
  PERFORM app_private.require_admin();SELECT * INTO b FROM public.homepage_banners WHERE id=p_id FOR UPDATE;
  IF NOT FOUND OR p_version IS NULL OR b.version<>p_version OR p_active IS NULL THEN RAISE EXCEPTION 'Stale banner version' USING ERRCODE='40001'; END IF;
  IF p_active AND NOT EXISTS(SELECT 1 FROM public.catalog_media WHERE id=b.media_id AND verified_at IS NOT NULL AND verified_by IS NOT NULL AND processed_at IS NOT NULL AND NOT is_placeholder) THEN RAISE EXCEPTION 'A verified genuine processed image is required'; END IF;
  UPDATE public.homepage_banners SET active=p_active,version=version+1,updated_at=now() WHERE id=p_id;
  PERFORM app_private.catalog_event('banners',p_id,'set_active',to_jsonb(b),(SELECT to_jsonb(t) FROM public.homepage_banners t WHERE id=p_id));
END $$;
CREATE FUNCTION public.attach_catalog_asset(p_kind text,p_id uuid,p_version bigint,p_media_id uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE old_row jsonb; BEGIN
  PERFORM app_private.require_admin();
  IF NOT EXISTS(SELECT 1 FROM public.catalog_media WHERE id=p_media_id AND processed_at IS NOT NULL) THEN RAISE EXCEPTION 'Processed image required'; END IF;
  IF p_kind IN ('category','brand') THEN
    old_row:=app_private.lock_catalog_draft(p_kind,p_id,p_version);
    EXECUTE format('UPDATE public.%I SET %I=$2,%I=NULL,version=version+1,updated_at=now(),reviewed_at=NULL,reviewed_by=NULL,reviewed_version=NULL,approved_at=NULL,approved_by=NULL,identity_verified=false,content_verified=false,indexing_approved=false WHERE id=$1',app_private.entity_table(p_kind),CASE p_kind WHEN 'brand' THEN 'logo_media_id' ELSE 'hero_media_id' END,CASE p_kind WHEN 'brand' THEN 'logo_alt_override' ELSE 'hero_alt_override' END) USING p_id,p_media_id;
  ELSIF p_kind='banner' THEN
    SELECT to_jsonb(b) INTO old_row FROM public.homepage_banners b WHERE id=p_id FOR UPDATE;
    IF old_row IS NULL OR p_version IS NULL OR (old_row->>'version')::bigint<>p_version THEN RAISE EXCEPTION 'Stale banner version' USING ERRCODE='40001'; END IF;
    UPDATE public.homepage_banners SET media_id=p_media_id,alt_text_override=NULL,active=false,version=version+1,updated_at=now() WHERE id=p_id;
  ELSE RAISE EXCEPTION 'Unsupported asset target'; END IF;
  PERFORM app_private.catalog_event(p_kind,p_id,'attach_asset',old_row,jsonb_build_object('media_id',p_media_id));
END $$;
CREATE FUNCTION public.save_catalog_settings(p_version bigint,p_input jsonb,p_approve_public boolean) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE old_row public.site_settings; s public.site_settings; BEGIN
  PERFORM app_private.require_admin();PERFORM pg_catalog.pg_advisory_xact_lock(7131187);
  IF jsonb_typeof(p_input)<>'object' OR EXISTS(SELECT 1 FROM jsonb_object_keys(p_input) k WHERE k NOT IN ('business_name','street_address','city','country_code','main_whatsapp','secondary_whatsapp')) THEN RAISE EXCEPTION 'Unsupported contact fields'; END IF;
  s:=jsonb_populate_record(NULL::public.site_settings,p_input);
  IF length(trim(coalesce(s.business_name,''))) NOT BETWEEN 1 AND 180 OR length(trim(coalesce(s.street_address,''))) NOT BETWEEN 1 AND 500 OR length(trim(coalesce(s.city,''))) NOT BETWEEN 1 AND 100 OR s.country_code IS DISTINCT FROM 'PK' OR coalesce(s.main_whatsapp,'') !~ '^\+92[0-9]{10}$' OR coalesce(s.secondary_whatsapp,'') !~ '^\+92[0-9]{10}$' THEN RAISE EXCEPTION 'Verified business name, address and Pakistan contacts required'; END IF;
  SELECT * INTO old_row FROM public.site_settings WHERE id=true FOR UPDATE;
  IF FOUND AND (p_version IS NULL OR old_row.version<>p_version) OR NOT FOUND AND p_version IS NOT NULL THEN RAISE EXCEPTION 'Stale settings version' USING ERRCODE='40001'; END IF;
  INSERT INTO public.site_settings(id,business_name,street_address,city,country_code,main_whatsapp,secondary_whatsapp,is_public)
    VALUES(true,trim(s.business_name),trim(s.street_address),trim(s.city),'PK',s.main_whatsapp,s.secondary_whatsapp,coalesce(p_approve_public,false))
    ON CONFLICT(id) DO UPDATE SET business_name=EXCLUDED.business_name,street_address=EXCLUDED.street_address,city=EXCLUDED.city,country_code=EXCLUDED.country_code,main_whatsapp=EXCLUDED.main_whatsapp,secondary_whatsapp=EXCLUDED.secondary_whatsapp,is_public=EXCLUDED.is_public,version=site_settings.version+1,updated_at=now();
  PERFORM app_private.catalog_event('settings','00000000-0000-0000-0000-000000000007','save',to_jsonb(old_row),(SELECT to_jsonb(t) FROM public.site_settings t));
END $$;
CREATE FUNCTION public.save_catalog_asset_alt(p_kind text,p_id uuid,p_version bigint,p_alt text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE previous jsonb; BEGIN
  PERFORM app_private.require_admin();IF length(coalesce(p_alt,''))>500 THEN RAISE EXCEPTION 'Alt text must not exceed 500 characters'; END IF;
  IF p_kind IN ('brand','category') THEN
    previous:=app_private.lock_catalog_draft(p_kind,p_id,p_version);
    EXECUTE format('UPDATE public.%I SET %I=$2,version=version+1,updated_at=now(),reviewed_at=NULL,reviewed_by=NULL,reviewed_version=NULL,approved_at=NULL,approved_by=NULL,identity_verified=false,content_verified=false,indexing_approved=false WHERE id=$1',app_private.entity_table(p_kind),CASE p_kind WHEN 'brand' THEN 'logo_alt_override' ELSE 'hero_alt_override' END) USING p_id,nullif(trim(p_alt),'');
  ELSIF p_kind='banner' THEN
    SELECT to_jsonb(b) INTO previous FROM public.homepage_banners b WHERE id=p_id FOR UPDATE;
    IF previous IS NULL OR p_version IS NULL OR (previous->>'version')::bigint<>p_version THEN RAISE EXCEPTION 'Stale banner version' USING ERRCODE='40001'; END IF;
    UPDATE public.homepage_banners SET alt_text_override=nullif(trim(p_alt),''),active=false,version=version+1,updated_at=now() WHERE id=p_id;
  ELSE RAISE EXCEPTION 'Unsupported asset target'; END IF;
  PERFORM app_private.catalog_event(p_kind,p_id,'edit_alt',previous,jsonb_build_object('alt_text',p_alt));
END $$;
CREATE OR REPLACE VIEW public.catalog_banners_public WITH(security_barrier=true) AS
SELECT b.id,b.title,b.subtitle,b.cta_label,b.cta_path,b.media_id,b.sort_order FROM public.homepage_banners b JOIN public.catalog_media m ON m.id=b.media_id WHERE b.active AND m.verified_at IS NOT NULL AND m.verified_by IS NOT NULL AND m.processed_at IS NOT NULL AND NOT m.is_placeholder;
REVOKE ALL ON FUNCTION public.save_catalog_taxonomy(text,uuid,bigint,jsonb),public.save_catalog_banner(uuid,bigint,jsonb),public.set_catalog_banner_active(uuid,bigint,boolean),public.attach_catalog_asset(text,uuid,bigint,uuid),public.save_catalog_settings(bigint,jsonb,boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.save_catalog_taxonomy(text,uuid,bigint,jsonb),public.save_catalog_banner(uuid,bigint,jsonb),public.set_catalog_banner_active(uuid,bigint,boolean),public.attach_catalog_asset(text,uuid,bigint,uuid),public.save_catalog_settings(bigint,jsonb,boolean) TO authenticated;
REVOKE ALL ON FUNCTION public.save_catalog_asset_alt(text,uuid,bigint,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.save_catalog_asset_alt(text,uuid,bigint,text) TO authenticated;
CREATE VIEW public.catalog_asset_links_public WITH(security_barrier=true) AS
SELECT 'brand'::text AS kind,b.id AS entity_id,b.logo_media_id AS media_id,coalesce(b.logo_alt_override,m.alt_text) AS alt_text FROM public.brands b JOIN public.catalog_media m ON m.id=b.logo_media_id WHERE app_private.visible(b.publication_status,b.archived_at,b.reviewed_at,b.approved_at) AND app_private.media_is_public(m.id)
UNION ALL SELECT 'category',c.id,c.hero_media_id,coalesce(c.hero_alt_override,m.alt_text) FROM public.categories c JOIN public.catalog_media m ON m.id=c.hero_media_id WHERE app_private.visible(c.publication_status,c.archived_at,c.reviewed_at,c.approved_at) AND app_private.media_is_public(m.id)
UNION ALL SELECT 'banner',b.id,b.media_id,coalesce(b.alt_text_override,m.alt_text) FROM public.homepage_banners b JOIN public.catalog_media m ON m.id=b.media_id WHERE b.active AND app_private.media_is_public(m.id);
GRANT EXECUTE ON FUNCTION app_private.media_is_public(uuid) TO anon,authenticated;
GRANT SELECT ON public.catalog_asset_links_public TO anon,authenticated;
COMMIT;
