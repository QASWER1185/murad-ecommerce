-- Durable, bounded, administrator-driven import batches. No automatic publish.
BEGIN;
DO $$ BEGIN IF current_setting('app.catalog_cutover_approved',true) IS DISTINCT FROM 'yes' THEN RAISE EXCEPTION 'Catalog cutover not approved'; END IF; END $$;
ALTER TABLE public.import_jobs
  ADD COLUMN headers jsonb NOT NULL DEFAULT '[]',
  ADD COLUMN total_rows integer NOT NULL DEFAULT 0 CHECK(total_rows BETWEEN 0 AND 10000),
  ADD COLUMN uploaded_rows integer NOT NULL DEFAULT 0,
  ADD COLUMN prepared_rows integer NOT NULL DEFAULT 0,
  ADD COLUMN processed_rows integer NOT NULL DEFAULT 0,
  ADD COLUMN version bigint NOT NULL DEFAULT 1,
  ADD COLUMN clear_blanks boolean NOT NULL DEFAULT false,
  ADD COLUMN requires_price_confirmation boolean NOT NULL DEFAULT false,
  ADD COLUMN approved_by uuid REFERENCES auth.users(id) ON DELETE RESTRICT,
  ADD COLUMN approved_at timestamptz,
  ADD COLUMN source_object_name text,
  ADD COLUMN last_batch_at timestamptz;
ALTER TABLE public.import_rows
  ADD COLUMN expected_version bigint,
  ADD COLUMN processing_status text NOT NULL DEFAULT 'pending' CHECK(processing_status IN ('pending','applied','error','skipped')),
  ADD COLUMN applied_at timestamptz;
CREATE TABLE public.import_source_rows(
  job_id uuid NOT NULL REFERENCES public.import_jobs(id) ON DELETE RESTRICT,
  row_number integer NOT NULL CHECK(row_number BETWEEN 1 AND 10000),
  cells jsonb NOT NULL CHECK(jsonb_typeof(cells)='array'),
  errors jsonb NOT NULL DEFAULT '[]' CHECK(jsonb_typeof(errors)='array'),
  normalized_sku text,
  PRIMARY KEY(job_id,row_number)
);
CREATE INDEX import_source_sku ON public.import_source_rows(job_id,normalized_sku);
CREATE INDEX import_pending ON public.import_rows(job_id,row_number) WHERE processing_status='pending';
CREATE INDEX imports_recent ON public.import_jobs(created_at DESC,id);
ALTER TABLE public.import_source_rows ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.import_source_rows FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.import_source_rows TO authenticated;
CREATE POLICY staff_import_source ON public.import_source_rows FOR SELECT TO authenticated USING(app_private.is_staff());
REVOKE INSERT,UPDATE ON public.import_jobs,public.import_rows FROM authenticated;
CREATE FUNCTION app_private.normalize_sku(p_value text) RETURNS text
LANGUAGE sql IMMUTABLE SET search_path='' AS $$ SELECT upper(regexp_replace(trim(normalize(coalesce(p_value,''),NFKC)),'\s+',' ','g')) $$;
REVOKE ALL ON FUNCTION app_private.normalize_sku(text) FROM PUBLIC;
CREATE INDEX products_import_sku_lookup ON public.products(app_private.normalize_sku(sku)) WHERE sku IS NOT NULL;

INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types) VALUES('catalog-imports','catalog-imports',false,8388608,ARRAY['text/csv','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']) ON CONFLICT(id) DO NOTHING;
DO $$ BEGIN IF EXISTS(SELECT 1 FROM storage.buckets WHERE id='catalog-imports' AND public) THEN RAISE EXCEPTION 'Import originals must be private'; END IF; END $$;
CREATE POLICY import_objects_boundary ON storage.objects AS RESTRICTIVE FOR ALL TO PUBLIC USING(bucket_id<>'catalog-imports' OR app_private.is_admin()) WITH CHECK(bucket_id<>'catalog-imports' OR app_private.is_admin());
CREATE POLICY import_objects_immutable_update ON storage.objects AS RESTRICTIVE FOR UPDATE TO PUBLIC USING(bucket_id<>'catalog-imports') WITH CHECK(bucket_id<>'catalog-imports');
CREATE POLICY import_objects_immutable_delete ON storage.objects AS RESTRICTIVE FOR DELETE TO PUBLIC USING(bucket_id<>'catalog-imports');
CREATE POLICY import_objects_admin_read ON storage.objects FOR SELECT TO authenticated USING(bucket_id='catalog-imports' AND app_private.is_admin());
CREATE POLICY import_objects_admin_upload ON storage.objects FOR INSERT TO authenticated WITH CHECK(bucket_id='catalog-imports' AND app_private.is_admin());

CREATE FUNCTION app_private.import_state(p_id uuid) RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT to_jsonb(j)||jsonb_build_object('summary',jsonb_build_object('applied',(SELECT count(*) FROM public.import_rows WHERE job_id=j.id AND processing_status='applied'),'errors',(SELECT count(*) FROM public.import_rows WHERE job_id=j.id AND processing_status='error'),'pending',(SELECT count(*) FROM public.import_rows WHERE job_id=j.id AND processing_status='pending'),'skipped',(SELECT count(*) FROM public.import_rows WHERE job_id=j.id AND processing_status='skipped'))) FROM public.import_jobs j WHERE id=p_id
$$;
REVOKE ALL ON FUNCTION app_private.import_state(uuid) FROM PUBLIC;
CREATE FUNCTION public.begin_catalog_import(p_id uuid,p_name text,p_sha text,p_format text,p_headers jsonb,p_total integer) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE j public.import_jobs; object_path text; BEGIN
  PERFORM app_private.require_admin();
  IF p_id IS NULL OR p_total NOT BETWEEN 1 AND 10000 OR p_sha IS NULL OR p_sha !~ '^[a-f0-9]{64}$' OR p_format NOT IN ('csv','xlsx') OR length(coalesce(p_name,'')) NOT BETWEEN 1 AND 180 OR jsonb_array_length(p_headers) NOT BETWEEN 1 AND 40 THEN RAISE EXCEPTION 'Invalid import source'; END IF;
  SELECT * INTO j FROM public.import_jobs WHERE id=p_id FOR UPDATE;
  IF FOUND THEN IF j.created_by=auth.uid() AND j.file_sha256=p_sha THEN RETURN app_private.import_state(p_id); END IF;RAISE EXCEPTION 'Import request ID conflict'; END IF;
  object_path:='imports/'||p_id||'/source.'||p_format;
  IF NOT EXISTS(SELECT 1 FROM storage.objects WHERE bucket_id='catalog-imports' AND name=object_path) THEN RAISE EXCEPTION 'Upload the original spreadsheet first'; END IF;
  INSERT INTO public.import_jobs(id,file_name,file_sha256,format,headers,total_rows,source_object_name) VALUES(p_id,p_name,p_sha,p_format,p_headers,p_total,object_path);
  PERFORM app_private.catalog_event('imports',p_id,'upload',NULL,jsonb_build_object('sha256',p_sha,'rows',p_total));RETURN app_private.import_state(p_id);
END $$;
CREATE FUNCTION public.stage_catalog_import_source(p_id uuid,p_start integer,p_rows jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE j public.import_jobs; r jsonb; n integer; BEGIN
  PERFORM app_private.require_admin();SELECT * INTO j FROM public.import_jobs WHERE id=p_id FOR UPDATE;
  IF NOT FOUND OR j.status<>'pending' OR p_start IS NULL OR p_rows IS NULL OR jsonb_typeof(p_rows) IS DISTINCT FROM 'array' OR jsonb_array_length(p_rows) NOT BETWEEN 1 AND 250 OR length(p_rows::text)>2097152 THEN RAISE EXCEPTION 'Invalid source batch'; END IF;
  IF p_start<=j.uploaded_rows THEN RETURN app_private.import_state(p_id); END IF;
  IF p_start<>j.uploaded_rows+1 OR p_start+jsonb_array_length(p_rows)-1>j.total_rows THEN RAISE EXCEPTION 'Source batch out of sequence'; END IF;
  n:=p_start;
  FOR r IN SELECT * FROM jsonb_array_elements(p_rows) LOOP
    IF jsonb_array_length(r->'cells')<>jsonb_array_length(j.headers) OR jsonb_typeof(r->'errors')<>'array' THEN RAISE EXCEPTION 'Invalid source row'; END IF;
    INSERT INTO public.import_source_rows(job_id,row_number,cells,errors) VALUES(p_id,n,r->'cells',r->'errors');n:=n+1;
  END LOOP;
  UPDATE public.import_jobs SET uploaded_rows=n-1 WHERE id=p_id;RETURN app_private.import_state(p_id);
END $$;
CREATE FUNCTION public.configure_catalog_import(p_id uuid,p_version bigint,p_mapping jsonb,p_mode text,p_clear_blanks boolean) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE j public.import_jobs; k text; v jsonb; BEGIN
  PERFORM app_private.require_admin();SELECT * INTO j FROM public.import_jobs WHERE id=p_id FOR UPDATE;
  IF NOT FOUND OR p_version IS NULL OR j.version<>p_version THEN RAISE EXCEPTION 'Stale import version' USING ERRCODE='40001'; END IF;
  IF j.status NOT IN ('pending','validating','ready_for_review') OR j.uploaded_rows<>j.total_rows OR EXISTS(SELECT 1 FROM public.import_rows WHERE job_id=p_id AND processing_status='applied') THEN RAISE EXCEPTION 'Import mapping is locked or source incomplete'; END IF;
  IF p_mode NOT IN ('draft_import','price_update') OR jsonb_typeof(p_mapping)<>'object' OR NOT(p_mapping?'sku') OR p_mode='price_update' AND NOT(p_mapping?'price') THEN RAISE EXCEPTION 'SKU mapping and valid import mode required'; END IF;
  FOR k,v IN SELECT * FROM jsonb_each(p_mapping) LOOP
    IF k NOT IN ('sku','name','slug','model','description','brand','category','price','currency','stock_status','stock_quantity','sales_mode','product_type','finish','specifications','seo_title','seo_description','image_alt_text') OR v::text !~ '^[0-9]+$' OR v::int>=jsonb_array_length(j.headers) OR p_mode='price_update' AND k NOT IN ('sku','price') THEN RAISE EXCEPTION 'Invalid column mapping'; END IF;
  END LOOP;
  UPDATE public.import_source_rows SET normalized_sku=app_private.normalize_sku(cells->>((p_mapping->>'sku')::int)) WHERE job_id=p_id;
  UPDATE public.import_jobs SET column_mapping=p_mapping,mode=p_mode,clear_blanks=coalesce(p_clear_blanks,false),status='validating',prepared_rows=0,processed_rows=0,approved_at=NULL,approved_by=NULL,requires_price_confirmation=p_mode='price_update',version=version+1 WHERE id=p_id;
  PERFORM app_private.catalog_event('imports',p_id,'configure',to_jsonb(j),jsonb_build_object('mapping',p_mapping,'mode',p_mode,'clear_blanks',p_clear_blanks));RETURN app_private.import_state(p_id);
END $$;

CREATE FUNCTION app_private.prepare_import_row(p_job public.import_jobs,p_number integer,p_payload jsonb,p_errors jsonb) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE old public.products; matched uuid[]; candidate jsonb; errors jsonb; sku_value text; ref text; ids uuid[]; target text; action text; key text; BEGIN
  IF EXISTS(SELECT 1 FROM public.import_rows WHERE job_id=p_job.id AND row_number=p_number AND processing_status='applied') THEN RETURN; END IF;
  errors:=coalesce(p_errors,'[]') || (SELECT s.errors FROM public.import_source_rows s WHERE s.job_id=p_job.id AND s.row_number=p_number);
  IF errors IS NULL OR jsonb_typeof(errors)<>'array' OR jsonb_typeof(p_payload)<>'object' OR EXISTS(SELECT 1 FROM jsonb_object_keys(p_payload) k WHERE k NOT IN ('sku','name','slug','model','description','brand','category','price','currency','stock_status','stock_quantity','sales_mode','product_type','finish','specifications','seo_title','seo_description','image_alt_text')) THEN RAISE EXCEPTION 'Invalid normalized row'; END IF;
  sku_value:=app_private.normalize_sku(p_payload->>'sku');candidate:=p_payload||jsonb_build_object('sku',sku_value);
  IF length(sku_value) NOT BETWEEN 1 AND 80 THEN errors:=errors||jsonb_build_array('A SKU is required'); END IF;
  IF (SELECT count(*) FROM public.import_source_rows WHERE job_id=p_job.id AND normalized_sku=sku_value)>1 THEN errors:=errors||jsonb_build_array('Duplicate SKU in this spreadsheet'); END IF;
  SELECT array_agg(id) INTO matched FROM public.products WHERE app_private.normalize_sku(sku)=sku_value AND sku IS NOT NULL;
  IF cardinality(matched)>1 THEN errors:=errors||jsonb_build_array('Ambiguous existing normalized SKU');
  ELSIF cardinality(matched)=1 THEN SELECT * INTO old FROM public.products WHERE id=matched[1]; END IF;
  action:=CASE WHEN old.id IS NULL THEN 'create_draft' ELSE 'stage_revision' END;
  IF old.id IS NOT NULL AND (old.publication_status<>'draft' OR old.archived_at IS NOT NULL) THEN errors:=errors||jsonb_build_array('Existing product must be an active Draft before import'); END IF;
  IF old.id IS NULL AND p_job.mode='price_update' THEN errors:=errors||jsonb_build_array('Price update requires an existing SKU'); END IF;
  FOREACH key IN ARRAY ARRAY['brand','category'] LOOP
    IF candidate?key THEN
      ref:=nullif(trim(candidate->>key),'');
      IF ref IS NULL THEN candidate:=(candidate-key)||jsonb_build_object(key||'_id',NULL);
      ELSE
        target:=CASE key WHEN 'brand' THEN 'brands' ELSE 'categories' END;
        EXECUTE format('SELECT array_agg(id) FROM public.%I WHERE archived_at IS NULL AND (lower(trim(name))=lower(trim($1)) OR lower(slug)=lower(trim($1)))',target) INTO ids USING ref;
        IF coalesce(cardinality(ids),0)<>1 THEN errors:=errors||jsonb_build_array('Unknown or ambiguous '||key||': '||left(ref,100)); ELSE candidate:=(candidate-key)||jsonb_build_object(key||'_id',ids[1]); END IF;
      END IF;
    END IF;
  END LOOP;
  IF old.id IS NULL AND length(trim(coalesce(candidate->>'name','')))=0 THEN errors:=errors||jsonb_build_array('New products require a name'); END IF;
  IF old.id IS NULL AND NOT(candidate?'slug') THEN candidate:=candidate||jsonb_build_object('slug',left(coalesce(nullif(trim(both '-' from regexp_replace(lower(normalize(coalesce(candidate->>'name','draft'),NFKD)),'[^a-z0-9]+','-','g')),''),'draft'),90)||'-'||coalesce(nullif(left(trim(both '-' from regexp_replace(lower(sku_value),'[^a-z0-9]+','-','g')),24),''),left(md5(sku_value),8))); END IF;
  IF candidate?'slug' AND (coalesce(candidate->>'slug','') !~ '^[a-z0-9]+(-[a-z0-9]+)*$' OR EXISTS(SELECT 1 FROM public.products WHERE slug=candidate->>'slug' AND id IS DISTINCT FROM old.id)) THEN errors:=errors||jsonb_build_array('Invalid or duplicate permanent slug'); END IF;
  IF old.published_at IS NOT NULL AND candidate?'slug' AND candidate->>'slug' IS DISTINCT FROM old.slug THEN errors:=errors||jsonb_build_array('Published slugs require the permanent rename workflow'); END IF;
  IF candidate?'price' AND candidate->'price'<>'null'::jsonb AND ((candidate->>'price')::numeric<=0 OR candidate->>'price'='NaN') THEN errors:=errors||jsonb_build_array('Positive real price required'); END IF;
  IF old.id IS NOT NULL AND candidate?'price' AND candidate->'price' IS DISTINCT FROM to_jsonb(old.price) THEN UPDATE public.import_jobs SET requires_price_confirmation=true WHERE id=p_job.id; END IF;
  INSERT INTO public.import_rows(job_id,row_number,sku,payload,errors,intended_action,product_id,expected_version,processing_status)
    VALUES(p_job.id,p_number,sku_value,candidate,errors,CASE WHEN p_job.mode='price_update' AND NOT(candidate?'price') THEN 'skip' WHEN p_job.mode='price_update' THEN 'price_update' ELSE action END,old.id,old.version,CASE WHEN jsonb_array_length(errors)>0 THEN 'error' WHEN p_job.mode='price_update' AND NOT(candidate?'price') THEN 'skipped' ELSE 'pending' END)
    ON CONFLICT(job_id,row_number) DO UPDATE SET sku=EXCLUDED.sku,payload=EXCLUDED.payload,errors=EXCLUDED.errors,intended_action=EXCLUDED.intended_action,product_id=EXCLUDED.product_id,expected_version=EXCLUDED.expected_version,processing_status=EXCLUDED.processing_status;
END $$;
REVOKE ALL ON FUNCTION app_private.prepare_import_row(public.import_jobs,integer,jsonb,jsonb) FROM PUBLIC;
CREATE FUNCTION public.catalog_import_source_batch(p_id uuid) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$ BEGIN
  PERFORM app_private.require_admin();RETURN jsonb_build_object('job',app_private.import_state(p_id),'rows',(SELECT coalesce(jsonb_agg(t ORDER BY t.row_number),'[]') FROM (SELECT s.row_number,s.cells,s.errors FROM public.import_source_rows s JOIN public.import_jobs j ON j.id=s.job_id WHERE j.id=p_id AND s.row_number>j.prepared_rows ORDER BY s.row_number LIMIT 100) t));
END $$;
CREATE FUNCTION public.stage_catalog_import_preview(p_id uuid,p_version bigint,p_start integer,p_rows jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE j public.import_jobs; r jsonb; n int; BEGIN
  PERFORM app_private.require_admin();SELECT * INTO j FROM public.import_jobs WHERE id=p_id FOR UPDATE;
  IF NOT FOUND OR p_version IS NULL OR j.version<>p_version THEN RAISE EXCEPTION 'Stale import version' USING ERRCODE='40001'; END IF;
  IF p_start<=j.prepared_rows THEN RETURN app_private.import_state(p_id); END IF;
  IF j.status<>'validating' OR p_start IS NULL OR p_rows IS NULL OR jsonb_typeof(p_rows) IS DISTINCT FROM 'array' OR p_start<>j.prepared_rows+1 OR jsonb_array_length(p_rows) NOT BETWEEN 1 AND 100 OR p_start+jsonb_array_length(p_rows)-1>j.total_rows THEN RAISE EXCEPTION 'Invalid preview batch'; END IF;
  n:=p_start;
  FOR r IN SELECT * FROM jsonb_array_elements(p_rows) LOOP
    BEGIN PERFORM app_private.prepare_import_row(j,n,r->'payload',r->'errors');
    EXCEPTION WHEN OTHERS THEN INSERT INTO public.import_rows(job_id,row_number,payload,errors,processing_status) VALUES(p_id,n,coalesce(r->'payload','{}'),jsonb_build_array(left(SQLERRM,300)),'error') ON CONFLICT(job_id,row_number) DO UPDATE SET errors=EXCLUDED.errors,processing_status='error'; END;
    n:=n+1;
  END LOOP;
  UPDATE public.import_jobs SET prepared_rows=n-1,status=CASE WHEN n-1=total_rows THEN 'ready_for_review' ELSE 'validating' END WHERE id=p_id;RETURN app_private.import_state(p_id);
END $$;
CREATE FUNCTION public.start_catalog_import(p_id uuid,p_version bigint,p_confirm boolean,p_confirm_prices boolean,p_skip_errors boolean) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE j public.import_jobs; BEGIN
  PERFORM app_private.require_admin();SELECT * INTO j FROM public.import_jobs WHERE id=p_id FOR UPDATE;
  IF NOT FOUND OR p_version IS NULL OR j.version<>p_version THEN RAISE EXCEPTION 'Stale import version' USING ERRCODE='40001'; END IF;
  IF j.status='processing' THEN RETURN app_private.import_state(p_id); END IF;
  IF j.status<>'ready_for_review' OR j.prepared_rows<>j.total_rows OR p_confirm IS DISTINCT FROM true OR j.requires_price_confirmation AND p_confirm_prices IS DISTINCT FROM true OR EXISTS(SELECT 1 FROM public.import_rows WHERE job_id=p_id AND processing_status='error') AND p_skip_errors IS DISTINCT FROM true THEN RAISE EXCEPTION 'Explicit preview, price-change and invalid-row confirmation required'; END IF;
  UPDATE public.import_jobs SET status='processing',approved_at=now(),approved_by=auth.uid(),last_batch_at=now(),processed_rows=(SELECT count(*) FROM public.import_rows WHERE job_id=p_id AND processing_status IN ('applied','error','skipped')) WHERE id=p_id;
  PERFORM app_private.catalog_event('imports',p_id,'approve',NULL,jsonb_build_object('confirm_prices',p_confirm_prices,'skip_errors',p_skip_errors));RETURN app_private.import_state(p_id);
END $$;
CREATE FUNCTION public.process_catalog_import_batch(p_id uuid,p_limit integer DEFAULT 50) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE j public.import_jobs; r public.import_rows; old public.products; payload jsonb; saved jsonb; new_alt text; BEGIN
  PERFORM app_private.require_admin();SELECT * INTO j FROM public.import_jobs WHERE id=p_id FOR UPDATE;
  IF NOT FOUND OR p_limit IS NULL OR p_limit NOT BETWEEN 1 AND 50 THEN RAISE EXCEPTION 'Invalid bounded import batch'; END IF;
  IF j.status='completed' THEN RETURN app_private.import_state(p_id); END IF;
  IF j.status<>'processing' OR j.approved_by IS NULL OR j.approved_at IS NULL THEN RAISE EXCEPTION 'Approve the preview before processing'; END IF;
  FOR r IN SELECT * FROM public.import_rows WHERE job_id=p_id AND processing_status='pending' ORDER BY row_number LIMIT p_limit FOR UPDATE LOOP
    BEGIN
      PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('catalog-import-sku:'||r.sku,0));
      old:=NULL;saved:=NULL;payload:=r.payload-'image_alt_text';
      IF r.product_id IS NOT NULL THEN
        SELECT * INTO old FROM public.products WHERE id=r.product_id FOR UPDATE;
        IF NOT FOUND OR old.version<>r.expected_version THEN RAISE EXCEPTION 'Product changed after preview; revalidate this row' USING ERRCODE='40001'; END IF;
        INSERT INTO public.product_revisions(product_id,revision_no,workflow_state,snapshot,created_by) VALUES(old.id,old.version,'before_import',app_private.product_snapshot(old.id),auth.uid());
        payload:=(to_jsonb(old)-ARRAY['id','created_at','updated_at'])||payload;
      END IF;
      -- Only the Phase 3 authoring allowlist enters the existing save RPC.
      SELECT coalesce(jsonb_object_agg(key,value),'{}') INTO payload FROM jsonb_each(payload) WHERE key IN ('name','slug','sku','model','description','category_id','brand_id','price','currency','sales_mode','stock_status','stock_quantity','specifications','seo_title','seo_description','canonical_path','product_type','finish');
      saved:=public.save_product_draft(r.product_id,r.expected_version,payload);
      IF r.payload?'image_alt_text' THEN UPDATE public.products SET default_image_alt=r.payload->>'image_alt_text',version=version+1,updated_at=now() WHERE id=(saved->>'id')::uuid; END IF;
      UPDATE public.import_rows SET processing_status='applied',product_id=(saved->>'id')::uuid,applied_at=now(),errors='[]' WHERE job_id=p_id AND row_number=r.row_number;
      PERFORM app_private.catalog_event('imports',p_id,'apply_row',jsonb_build_object('row',r.row_number,'version',r.expected_version),saved);
    EXCEPTION WHEN OTHERS THEN
      UPDATE public.import_rows SET processing_status='error',errors=jsonb_build_array(left(SQLERRM,300)) WHERE job_id=p_id AND row_number=r.row_number;
    END;
  END LOOP;
  UPDATE public.import_jobs SET processed_rows=(SELECT count(*) FROM public.import_rows WHERE job_id=p_id AND processing_status IN ('applied','error','skipped')),last_batch_at=now(),status=CASE WHEN EXISTS(SELECT 1 FROM public.import_rows WHERE job_id=p_id AND processing_status='pending') THEN 'processing' ELSE 'completed' END,completed_at=CASE WHEN NOT EXISTS(SELECT 1 FROM public.import_rows WHERE job_id=p_id AND processing_status='pending') THEN now() END WHERE id=p_id;
  RETURN app_private.import_state(p_id);
END $$;
CREATE FUNCTION public.retry_catalog_import(p_id uuid,p_version bigint) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE j public.import_jobs; BEGIN
  PERFORM app_private.require_admin();SELECT * INTO j FROM public.import_jobs WHERE id=p_id FOR UPDATE;
  IF NOT FOUND OR p_version IS NULL OR j.version<>p_version OR j.status NOT IN ('completed','failed') THEN RAISE EXCEPTION 'Stale or active import'; END IF;
  UPDATE public.import_jobs SET status='validating',prepared_rows=0,approved_by=NULL,approved_at=NULL,completed_at=NULL,requires_price_confirmation=mode='price_update',version=version+1 WHERE id=p_id;
  PERFORM app_private.catalog_event('imports',p_id,'revalidate_failed',NULL,NULL);RETURN app_private.import_state(p_id);
END $$;
CREATE FUNCTION public.catalog_import_workspace(p_id uuid) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$ BEGIN
  PERFORM app_private.require_staff();RETURN jsonb_build_object('job',app_private.import_state(p_id),'rows',(SELECT coalesce(jsonb_agg(t ORDER BY row_number),'[]') FROM (SELECT row_number,sku,payload,errors,intended_action,product_id,expected_version,processing_status FROM public.import_rows WHERE job_id=p_id ORDER BY row_number LIMIT 50) t));
END $$;
REVOKE ALL ON FUNCTION public.begin_catalog_import(uuid,text,text,text,jsonb,integer),public.stage_catalog_import_source(uuid,integer,jsonb),public.configure_catalog_import(uuid,bigint,jsonb,text,boolean),public.catalog_import_source_batch(uuid),public.stage_catalog_import_preview(uuid,bigint,integer,jsonb),public.start_catalog_import(uuid,bigint,boolean,boolean,boolean),public.process_catalog_import_batch(uuid,integer),public.retry_catalog_import(uuid,bigint),public.catalog_import_workspace(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.begin_catalog_import(uuid,text,text,text,jsonb,integer),public.stage_catalog_import_source(uuid,integer,jsonb),public.configure_catalog_import(uuid,bigint,jsonb,text,boolean),public.catalog_import_source_batch(uuid),public.stage_catalog_import_preview(uuid,bigint,integer,jsonb),public.start_catalog_import(uuid,bigint,boolean,boolean,boolean),public.process_catalog_import_batch(uuid,integer),public.retry_catalog_import(uuid,bigint),public.catalog_import_workspace(uuid) TO authenticated;
CREATE FUNCTION public.restore_product_revision(p_id uuid,p_version bigint,p_revision uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE current_row jsonb; historical jsonb; payload jsonb; saved jsonb; BEGIN
  PERFORM app_private.require_admin();current_row:=app_private.lock_catalog_draft('product',p_id,p_version);
  SELECT snapshot INTO historical FROM public.product_revisions WHERE id=p_revision AND product_id=p_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Revision does not belong to this product'; END IF;
  SELECT coalesce(jsonb_object_agg(key,value),'{}') INTO payload FROM jsonb_each(historical) WHERE key IN ('name','sku','model','description','category_id','brand_id','price','currency','sales_mode','stock_status','stock_quantity','specifications','seo_title','seo_description','product_type','finish');
  payload:=payload||jsonb_build_object('slug',current_row->>'slug','canonical_path',NULL);
  INSERT INTO public.product_revisions(product_id,revision_no,workflow_state,snapshot,created_by) VALUES(p_id,p_version,'before_restore',app_private.product_snapshot(p_id),auth.uid());
  saved:=public.save_product_draft(p_id,p_version,payload);
  PERFORM app_private.catalog_event('products',p_id,'restore_details',current_row,jsonb_build_object('source_revision',p_revision,'saved',saved));RETURN saved;
END $$;
REVOKE ALL ON FUNCTION public.restore_product_revision(uuid,bigint,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.restore_product_revision(uuid,bigint,uuid) TO authenticated;
COMMIT;
