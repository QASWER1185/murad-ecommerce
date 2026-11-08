-- Phase 4: local/review only. No public bucket, signed public URLs or service keys.
BEGIN;
DO $$ BEGIN IF current_setting('app.catalog_cutover_approved',true) IS DISTINCT FROM 'yes' THEN RAISE EXCEPTION 'Catalog cutover not approved'; END IF; END $$;
ALTER TABLE public.catalog_media
  ADD COLUMN original_filename text,
  ADD COLUMN sha256 text CHECK(sha256 ~ '^[a-f0-9]{64}$'),
  ADD COLUMN byte_size integer CHECK(byte_size BETWEEN 1 AND 10485760),
  ADD COLUMN processed_at timestamptz,
  ADD COLUMN uploaded_by uuid REFERENCES auth.users(id) ON DELETE RESTRICT,
  ADD COLUMN previous_media_id uuid REFERENCES public.catalog_media(id) ON DELETE RESTRICT;
ALTER TABLE public.products ADD COLUMN default_image_alt text CHECK(length(default_image_alt)<=500);
CREATE TABLE public.catalog_media_variants (
  media_id uuid NOT NULL REFERENCES public.catalog_media(id) ON DELETE RESTRICT,
  variant_key text NOT NULL CHECK(variant_key IN ('320','640','1280')),
  object_name text NOT NULL UNIQUE,
  width integer NOT NULL CHECK(width BETWEEN 1 AND 1280),height integer NOT NULL CHECK(height BETWEEN 1 AND 12000),
  byte_size integer NOT NULL CHECK(byte_size BETWEEN 1 AND 10485760),
  sha256 text NOT NULL CHECK(sha256 ~ '^[a-f0-9]{64}$'),
  PRIMARY KEY(media_id,variant_key)
);
ALTER TABLE public.catalog_media_variants ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.catalog_media_variants FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.catalog_media_variants TO authenticated;
CREATE POLICY media_variant_staff_read ON public.catalog_media_variants FOR SELECT TO authenticated USING(app_private.is_staff());
-- All mutations now use explicit versioned RPCs. No destructive media grants.
REVOKE INSERT(bucket_id,object_name,mime_type,alt_text,width,height,is_placeholder) ON public.catalog_media FROM authenticated;
REVOKE INSERT(product_id,media_id,sort_order),UPDATE(sort_order,archived_at) ON public.product_images FROM authenticated;

CREATE FUNCTION app_private.catalog_event(p_kind text,p_id uuid,p_action text,p_before jsonb,p_after jsonb) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$ BEGIN
  INSERT INTO app_private.audit_log(entity_type,entity_id,action,actor_id,before_data,after_data) VALUES(p_kind,p_id,p_action,auth.uid(),p_before,p_after);
  INSERT INTO app_private.invalidation_events(entity_type,entity_id) VALUES(p_kind,p_id);
END $$;
REVOKE ALL ON FUNCTION app_private.catalog_event(text,uuid,text,jsonb,jsonb) FROM PUBLIC;

CREATE FUNCTION public.register_catalog_media(p_id uuid,p_manifest jsonb) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE m public.catalog_media; v jsonb; BEGIN
  PERFORM app_private.require_admin();
  IF p_id IS NULL OR p_manifest IS NULL OR jsonb_typeof(p_manifest) IS DISTINCT FROM 'object' OR jsonb_typeof(p_manifest->'variants') IS DISTINCT FROM 'array' OR jsonb_array_length(p_manifest->'variants') IS DISTINCT FROM 3 THEN RAISE EXCEPTION 'Invalid processed image manifest'; END IF;
  SELECT * INTO m FROM public.catalog_media WHERE id=p_id;
  IF FOUND THEN
    IF m.uploaded_by=auth.uid() AND m.sha256=p_manifest->>'sha256' THEN RETURN m.id; END IF;
    RAISE EXCEPTION 'Upload ID conflict';
  END IF;
  IF (p_manifest->>'width')::bigint*(p_manifest->>'height')::bigint>24000000 OR (p_manifest->>'width')::integer NOT BETWEEN 16 AND 12000 OR (p_manifest->>'height')::integer NOT BETWEEN 16 AND 12000
    OR length(trim(coalesce(p_manifest->>'alt_text','')))>500 OR length(coalesce(p_manifest->>'original_filename',''))>180
    OR (p_manifest->>'object_name') NOT LIKE 'media/'||p_id||'/original.%' THEN RAISE EXCEPTION 'Invalid original image metadata'; END IF;
  IF NOT EXISTS(SELECT 1 FROM storage.objects WHERE bucket_id='catalog-private' AND name=p_manifest->>'object_name') THEN RAISE EXCEPTION 'Original upload missing'; END IF;
  INSERT INTO public.catalog_media(id,object_name,mime_type,alt_text,width,height,is_placeholder,original_filename,sha256,byte_size,processed_at,uploaded_by,previous_media_id)
  VALUES(p_id,p_manifest->>'object_name',p_manifest->>'mime_type',nullif(trim(p_manifest->>'alt_text'),''),(p_manifest->>'width')::int,(p_manifest->>'height')::int,coalesce((p_manifest->>'is_placeholder')::boolean,true),p_manifest->>'original_filename',p_manifest->>'sha256',(p_manifest->>'byte_size')::int,now(),auth.uid(),(p_manifest->>'previous_media_id')::uuid);
  FOR v IN SELECT * FROM jsonb_array_elements(p_manifest->'variants') LOOP
    IF v->>'object_name' <> 'media/'||p_id||'/'||(v->>'variant_key')||'.webp' OR NOT EXISTS(SELECT 1 FROM storage.objects WHERE bucket_id='catalog-private' AND name=v->>'object_name') THEN RAISE EXCEPTION 'Responsive upload missing'; END IF;
    INSERT INTO public.catalog_media_variants VALUES(p_id,v->>'variant_key',v->>'object_name',(v->>'width')::int,(v->>'height')::int,(v->>'byte_size')::int,v->>'sha256');
  END LOOP;
  PERFORM app_private.catalog_event('media',p_id,'register',NULL,p_manifest);
  RETURN p_id;
END $$;

CREATE OR REPLACE FUNCTION public.verify_catalog_media(media_id uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE m public.catalog_media; BEGIN
  PERFORM app_private.require_admin(); SELECT * INTO m FROM public.catalog_media WHERE id=media_id FOR UPDATE;
  IF NOT FOUND OR m.is_placeholder OR m.processed_at IS NULL OR m.width IS NULL OR m.height IS NULL OR length(trim(coalesce(m.alt_text,'')))=0 OR (SELECT count(*) FROM public.catalog_media_variants v WHERE v.media_id=m.id)<>3 THEN RAISE EXCEPTION 'Processed genuine image, dimensions, alt text and variants required'; END IF;
  UPDATE public.catalog_media SET verified_at=now(),verified_by=auth.uid() WHERE id=m.id;
  PERFORM app_private.catalog_event('media',m.id,'verify',to_jsonb(m),(SELECT to_jsonb(t) FROM public.catalog_media t WHERE id=m.id));
END $$;

CREATE FUNCTION public.edit_catalog_gallery(p_product_id uuid,p_version bigint,p_operation text,p_input jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE p public.products; previous jsonb; ids uuid[]; image_id uuid; old_image public.product_images; media uuid; BEGIN
  PERFORM app_private.require_admin(); SELECT * INTO p FROM public.products WHERE id=p_product_id FOR UPDATE;
  IF NOT FOUND OR p_version IS NULL OR p.version<>p_version THEN RAISE EXCEPTION 'Stale product version' USING ERRCODE='40001'; END IF;
  IF p.publication_status<>'draft' OR p.archived_at IS NOT NULL THEN RAISE EXCEPTION 'An active Draft is required'; END IF;
  previous:=app_private.product_snapshot(p.id);
  IF p_operation IN ('attach','replace') THEN
    IF p_operation='attach' AND (SELECT count(*) FROM public.product_images WHERE product_id=p.id AND archived_at IS NULL)>=30 THEN RAISE EXCEPTION 'A product gallery supports up to 30 active images'; END IF;
    media:=(p_input->>'media_id')::uuid;
    IF NOT EXISTS(SELECT 1 FROM public.catalog_media WHERE id=media AND processed_at IS NOT NULL) THEN RAISE EXCEPTION 'Processed media required'; END IF;
    IF p_operation='replace' THEN
      SELECT * INTO old_image FROM public.product_images WHERE id=(p_input->>'image_id')::uuid AND product_id=p.id AND archived_at IS NULL FOR UPDATE;
      IF NOT FOUND THEN RAISE EXCEPTION 'Image not attached'; END IF;
      UPDATE public.product_images SET archived_at=now() WHERE id=old_image.id;
    END IF;
    INSERT INTO public.product_images(product_id,media_id,sort_order)
    VALUES(p.id,media,coalesce(old_image.sort_order,(SELECT coalesce(max(sort_order),-1)+1 FROM public.product_images WHERE product_id=p.id AND archived_at IS NULL)))
    ON CONFLICT(product_id,media_id) DO UPDATE SET archived_at=NULL,sort_order=EXCLUDED.sort_order;
  ELSIF p_operation='remove' THEN
    UPDATE public.product_images SET archived_at=now() WHERE id=(p_input->>'image_id')::uuid AND product_id=p.id AND archived_at IS NULL;
    IF NOT FOUND THEN RAISE EXCEPTION 'Image not attached'; END IF;
  ELSIF p_operation='reorder' THEN
    SELECT array_agg(value::uuid) INTO ids FROM jsonb_array_elements_text(p_input->'image_ids');
    IF coalesce(cardinality(ids),0)<>(SELECT count(*) FROM public.product_images WHERE product_id=p.id AND archived_at IS NULL)
      OR cardinality(ids)<>(SELECT count(DISTINCT x) FROM unnest(ids) x)
      OR EXISTS(SELECT 1 FROM unnest(ids) x WHERE NOT EXISTS(SELECT 1 FROM public.product_images WHERE id=x AND product_id=p.id AND archived_at IS NULL)) THEN RAISE EXCEPTION 'Gallery order must be an exact permutation'; END IF;
    UPDATE public.product_images i SET sort_order=a.pos-1 FROM unnest(ids) WITH ORDINALITY a(id,pos) WHERE i.id=a.id;
  ELSE RAISE EXCEPTION 'Unknown gallery operation'; END IF;
  PERFORM app_private.catalog_event('products',p.id,'gallery_'||p_operation,previous,app_private.product_snapshot(p.id));
  RETURN (SELECT jsonb_build_object('id',id,'version',version) FROM public.products WHERE id=p.id);
END $$;

CREATE FUNCTION app_private.media_is_public(p_media uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
  SELECT EXISTS(SELECT 1 FROM public.catalog_media m WHERE m.id=p_media AND m.processed_at IS NOT NULL AND m.verified_at IS NOT NULL AND m.verified_by IS NOT NULL AND NOT m.is_placeholder AND (
    EXISTS(SELECT 1 FROM public.product_images i JOIN public.products p ON p.id=i.product_id WHERE i.media_id=m.id AND i.archived_at IS NULL AND app_private.visible(p.publication_status,p.archived_at,p.reviewed_at,p.approved_at))
    OR EXISTS(SELECT 1 FROM public.brands b WHERE b.logo_media_id=m.id AND app_private.visible(b.publication_status,b.archived_at,b.reviewed_at,b.approved_at))
    OR EXISTS(SELECT 1 FROM public.categories c WHERE c.hero_media_id=m.id AND app_private.visible(c.publication_status,c.archived_at,c.reviewed_at,c.approved_at))
    OR EXISTS(SELECT 1 FROM public.homepage_banners b WHERE b.media_id=m.id AND b.active)))
$$;
CREATE FUNCTION app_private.public_media_object(p_bucket text,p_name text) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
  SELECT p_bucket='catalog-private' AND EXISTS(SELECT 1 FROM public.catalog_media_variants v WHERE v.object_name=p_name AND app_private.media_is_public(v.media_id))
$$;
REVOKE ALL ON FUNCTION app_private.media_is_public(uuid),app_private.public_media_object(text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app_private.public_media_object(text,text) TO anon,authenticated;
-- Keep the restrictive immutable-object boundaries. Only eligible derivatives
-- gain SELECT; originals and all Draft assets stay private.
ALTER POLICY catalog_private_boundary ON storage.objects USING(bucket_id<>'catalog-private' OR app_private.is_staff() OR app_private.public_media_object(bucket_id,name));
CREATE POLICY catalog_derivative_read ON storage.objects FOR SELECT TO anon,authenticated USING(app_private.public_media_object(bucket_id,name));
CREATE FUNCTION public.catalog_public_media(p_id uuid,p_variant text) RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
  SELECT jsonb_build_object('object_name',v.object_name,'width',v.width,'height',v.height,'sha256',v.sha256,'mime_type','image/webp') FROM public.catalog_media_variants v
  WHERE v.media_id=p_id AND v.variant_key=p_variant AND app_private.media_is_public(p_id)
$$;
REVOKE ALL ON FUNCTION public.catalog_public_media(uuid,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.catalog_public_media(uuid,text) TO anon,authenticated;

CREATE OR REPLACE FUNCTION app_private.product_indexable(p_product_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
  SELECT app_private.taxonomy_indexable(p.publication_status,p.archived_at,p.reviewed_at,p.approved_at,p.identity_verified,p.content_verified,p.indexing_approved,p.description,p.seo_title,p.seo_description,p.canonical_path,'/product/'||p.slug)
    AND length(trim(coalesce(p.sku,'')))>0
    AND EXISTS(SELECT 1 FROM public.categories c WHERE c.id=p.category_id AND app_private.visible(c.publication_status,c.archived_at,c.reviewed_at,c.approved_at))
    AND (p.brand_id IS NULL OR EXISTS(SELECT 1 FROM public.brands b WHERE b.id=p.brand_id AND app_private.visible(b.publication_status,b.archived_at,b.reviewed_at,b.approved_at)))
    AND EXISTS(SELECT 1 FROM public.product_images i JOIN public.catalog_media m ON m.id=i.media_id WHERE i.product_id=p.id AND i.archived_at IS NULL AND m.processed_at IS NOT NULL AND m.verified_at IS NOT NULL AND m.verified_by IS NOT NULL AND NOT m.is_placeholder AND length(trim(coalesce(i.alt_text_override,m.alt_text,'')))>0 AND m.width>0 AND m.height>0 AND (SELECT count(*) FROM public.catalog_media_variants v WHERE v.media_id=m.id)=3)
  FROM public.products p WHERE p.id=p_product_id AND app_private.visible(p.publication_status,p.archived_at,p.reviewed_at,p.approved_at)
$$;
REVOKE ALL ON FUNCTION public.register_catalog_media(uuid,jsonb),public.edit_catalog_gallery(uuid,bigint,text,jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.register_catalog_media(uuid,jsonb),public.edit_catalog_gallery(uuid,bigint,text,jsonb) TO authenticated;
COMMIT;
