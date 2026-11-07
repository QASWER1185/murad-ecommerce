BEGIN;
DO $$ BEGIN IF current_setting('app.catalog_cutover_approved',true) IS DISTINCT FROM 'yes' THEN RAISE EXCEPTION 'Catalog cutover not approved'; END IF; END $$;

CREATE FUNCTION app_private.entity_table(kind text) RETURNS text
LANGUAGE plpgsql IMMUTABLE SET search_path='' AS $$ BEGIN
  CASE kind WHEN 'product' THEN RETURN 'products'; WHEN 'category' THEN RETURN 'categories'; WHEN 'brand' THEN RETURN 'brands'; ELSE RAISE EXCEPTION 'Unknown catalog entity'; END CASE;
END $$;
CREATE FUNCTION app_private.require_admin() RETURNS void
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$ BEGIN
  IF NOT app_private.is_admin() OR auth.uid() IS NULL THEN RAISE EXCEPTION 'Catalog administrator required' USING ERRCODE='42501'; END IF;
END $$;
CREATE FUNCTION app_private.require_staff() RETURNS void
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$ BEGIN
  IF NOT app_private.is_staff() OR auth.uid() IS NULL THEN RAISE EXCEPTION 'Authorized catalog preview required' USING ERRCODE='42501'; END IF;
END $$;

CREATE FUNCTION app_private.protect_slug_history() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE kind text; BEGIN
  kind:=CASE TG_TABLE_NAME WHEN 'products' THEN 'product' WHEN 'categories' THEN 'category' ELSE 'brand' END;
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('catalog-slug:'||kind,0));
  IF EXISTS (SELECT 1 FROM public.slug_redirects WHERE source_path='/'||kind||'/'||NEW.slug) THEN
    RAISE EXCEPTION 'Slug is reserved by permanent redirect history';
  END IF;
  RETURN NEW;
END $$;
DO $$ DECLARE target text; BEGIN FOREACH target IN ARRAY ARRAY['products','categories','brands'] LOOP
  EXECUTE format('CREATE TRIGGER catalog_slug_history BEFORE INSERT OR UPDATE OF slug ON public.%I FOR EACH ROW EXECUTE FUNCTION app_private.protect_slug_history()',target);
END LOOP; END $$;

CREATE FUNCTION app_private.product_snapshot(product_id uuid) RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
  SELECT to_jsonb(p) || jsonb_build_object(
    'gallery',coalesce((SELECT jsonb_agg(to_jsonb(i) || jsonb_build_object('media',to_jsonb(m)) ORDER BY i.sort_order,i.id)
      FROM public.product_images i JOIN public.catalog_media m ON m.id=i.media_id WHERE i.product_id=p.id),'[]'::jsonb),
    'category_memberships',coalesce((SELECT jsonb_agg(to_jsonb(pc) ORDER BY pc.category_id)
      FROM public.product_categories pc WHERE pc.product_id=p.id),'[]'::jsonb))
  FROM public.products p WHERE p.id=product_id
$$;

CREATE FUNCTION app_private.record_entity_change() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$ BEGIN
  INSERT INTO app_private.audit_log(entity_type,entity_id,action,actor_id,before_data,after_data)
    VALUES (TG_TABLE_NAME,NEW.id,TG_OP,auth.uid(),CASE WHEN TG_OP='UPDATE' THEN to_jsonb(OLD) END,to_jsonb(NEW));
  INSERT INTO app_private.invalidation_events(entity_type,entity_id,old_slug,new_slug)
    VALUES (TG_TABLE_NAME,NEW.id,CASE WHEN TG_OP='UPDATE' THEN OLD.slug END,NEW.slug);
  RETURN NEW;
END $$;
DO $$ DECLARE target text; BEGIN FOREACH target IN ARRAY ARRAY['products','categories','brands'] LOOP
  EXECUTE format('CREATE TRIGGER catalog_audit AFTER INSERT OR UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION app_private.record_entity_change()',target);
END LOOP; END $$;

CREATE FUNCTION app_private.touch_draft_product() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$ BEGIN
  UPDATE public.products SET version=version+1,updated_at=now(),reviewed_at=NULL,reviewed_by=NULL,reviewed_version=NULL,
    identity_verified=false,content_verified=false,indexing_approved=false,price_verified_at=NULL,stock_verified_at=NULL
    WHERE id=NEW.product_id AND publication_status='draft';
  IF NOT FOUND THEN RAISE EXCEPTION 'Product must be a draft'; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER gallery_edit AFTER INSERT OR UPDATE ON public.product_images FOR EACH ROW EXECUTE FUNCTION app_private.touch_draft_product();
CREATE TRIGGER category_assignment_edit AFTER INSERT OR UPDATE ON public.product_categories FOR EACH ROW EXECUTE FUNCTION app_private.touch_draft_product();
GRANT UPDATE(archived_at) ON public.product_categories TO authenticated;
CREATE POLICY admin_category_assignment_update ON public.product_categories FOR UPDATE TO authenticated
  USING (app_private.is_admin() AND EXISTS(SELECT 1 FROM public.products p WHERE p.id=product_id AND p.publication_status='draft'))
  WITH CHECK (app_private.is_admin() AND EXISTS(SELECT 1 FROM public.products p WHERE p.id=product_id AND p.publication_status='draft'));
GRANT INSERT(logo_media_id),UPDATE(logo_media_id) ON public.brands TO authenticated;
GRANT INSERT(hero_media_id),UPDATE(hero_media_id) ON public.categories TO authenticated;

CREATE FUNCTION app_private.sync_primary_category() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$ BEGIN
  IF NEW.category_id IS NOT NULL THEN
    INSERT INTO public.product_categories(product_id,category_id) VALUES (NEW.id,NEW.category_id) ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER primary_category_membership AFTER INSERT OR UPDATE OF category_id ON public.products FOR EACH ROW EXECUTE FUNCTION app_private.sync_primary_category();

CREATE FUNCTION public.submit_catalog_review(kind text, entity_id uuid, expected_version bigint) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE target text; entry jsonb; BEGIN
  PERFORM app_private.require_admin(); target:=app_private.entity_table(kind);
  EXECUTE format('SELECT to_jsonb(t) FROM public.%I t WHERE id=$1 FOR UPDATE',target) INTO entry USING entity_id;
  IF expected_version IS NULL OR entry IS NULL OR (entry->>'version')::bigint<>expected_version THEN RAISE EXCEPTION 'Stale or missing catalog entity'; END IF;
  IF entry->>'publication_status'<>'draft' OR entry->>'archived_at' IS NOT NULL THEN RAISE EXCEPTION 'An active draft is required'; END IF;
  IF length(trim(entry->>'name'))=0 OR (entry->>'slug') !~ '^[a-z0-9]+(-[a-z0-9]+)*$' THEN RAISE EXCEPTION 'Name and clean slug required'; END IF;
  IF kind='product' THEN INSERT INTO public.product_revisions(product_id,revision_no,workflow_state,snapshot,created_by)
    VALUES (entity_id,expected_version,'ready_for_review',app_private.product_snapshot(entity_id),auth.uid()); END IF;
  EXECUTE format('UPDATE public.%I SET publication_status=''ready_for_review'',updated_at=now() WHERE id=$1',target) USING entity_id;
END $$;

CREATE FUNCTION public.review_catalog_entity(kind text,entity_id uuid,expected_version bigint,verification jsonb DEFAULT '{}') RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE target text; entry jsonb; key text; value jsonb; identity_ok boolean; content_ok boolean; BEGIN
  PERFORM app_private.require_admin(); target:=app_private.entity_table(kind);
  IF verification IS NULL OR jsonb_typeof(verification)<>'object' THEN RAISE EXCEPTION 'Verification must be an object'; END IF;
  FOR key,value IN SELECT * FROM jsonb_each(verification) LOOP
    IF key NOT IN ('identity','content','price','stock') OR jsonb_typeof(value)<>'boolean' THEN RAISE EXCEPTION 'Invalid verification field'; END IF;
  END LOOP;
  EXECUTE format('SELECT to_jsonb(t) FROM public.%I t WHERE id=$1 FOR UPDATE',target) INTO entry USING entity_id;
  IF expected_version IS NULL OR entry IS NULL OR (entry->>'version')::bigint<>expected_version THEN RAISE EXCEPTION 'Stale or missing catalog entity'; END IF;
  IF entry->>'publication_status'<>'ready_for_review' THEN RAISE EXCEPTION 'Submit for review first'; END IF;
  identity_ok:=coalesce((verification->>'identity')::boolean,false); content_ok:=coalesce((verification->>'content')::boolean,false);
  IF content_ok AND length(trim(coalesce(entry->>'description','')))=0 THEN RAISE EXCEPTION 'Verified useful content requires a description'; END IF;
  IF kind='product' THEN
    IF coalesce((verification->>'price')::boolean,false) AND (entry->>'price' IS NULL OR entry->>'price'='NaN' OR (entry->>'price')::numeric<=0) THEN RAISE EXCEPTION 'A real positive price is required'; END IF;
    IF coalesce((verification->>'stock')::boolean,false) AND entry->>'stock_status'='unknown' THEN RAISE EXCEPTION 'Explicit stock status required'; END IF;
    UPDATE public.products SET price_verified_at=CASE WHEN (verification->>'price')::boolean THEN now() END,
      stock_verified_at=CASE WHEN (verification->>'stock')::boolean THEN now() END WHERE id=entity_id;
  END IF;
  EXECUTE format('UPDATE public.%I SET reviewed_at=now(),reviewed_by=$2,reviewed_version=version,identity_verified=$3,content_verified=$4,updated_at=now() WHERE id=$1',target)
    USING entity_id,auth.uid(),identity_ok,content_ok;
END $$;

CREATE FUNCTION public.publish_catalog_entity(kind text,entity_id uuid,expected_version bigint,approve_indexing boolean DEFAULT false) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE target text; entry jsonb; eligible boolean; view_name text; BEGIN
  PERFORM app_private.require_admin(); target:=app_private.entity_table(kind);
  EXECUTE format('SELECT to_jsonb(t) FROM public.%I t WHERE id=$1 FOR UPDATE',target) INTO entry USING entity_id;
  IF expected_version IS NULL OR entry IS NULL OR (entry->>'version')::bigint<>expected_version THEN RAISE EXCEPTION 'Stale or missing catalog entity'; END IF;
  IF entry->>'publication_status'<>'ready_for_review' OR entry->>'reviewed_at' IS NULL OR (entry->>'reviewed_version')::bigint IS DISTINCT FROM expected_version THEN RAISE EXCEPTION 'Explicit current-version review required'; END IF;
  IF NOT (entry->>'identity_verified')::boolean OR NOT (entry->>'content_verified')::boolean THEN RAISE EXCEPTION 'Verify genuine identity and useful content before publishing'; END IF;
  EXECUTE format('UPDATE public.%I SET publication_status=''published'',approved_at=now(),approved_by=$2,published_at=coalesce(published_at,now()),indexing_approved=$3,updated_at=now() WHERE id=$1',target)
    USING entity_id,auth.uid(),coalesce(approve_indexing,false);
  view_name:=CASE kind WHEN 'product' THEN 'catalog_products_public' WHEN 'category' THEN 'catalog_categories_public' ELSE 'catalog_brands_public' END;
  EXECUTE format('SELECT is_indexable FROM public.%I WHERE id=$1',view_name) INTO eligible USING entity_id;
  IF approve_indexing AND NOT coalesce(eligible,false) THEN RAISE EXCEPTION 'Indexing requirements are incomplete'; END IF;
  IF kind='product' THEN INSERT INTO public.product_revisions(product_id,revision_no,workflow_state,snapshot,created_by)
    SELECT id,version,'published',app_private.product_snapshot(id),auth.uid() FROM public.products p WHERE id=entity_id; END IF;
END $$;

CREATE FUNCTION public.return_catalog_to_draft(kind text,entity_id uuid,expected_version bigint) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE target text; entry jsonb; BEGIN
  PERFORM app_private.require_admin(); target:=app_private.entity_table(kind);
  EXECUTE format('SELECT to_jsonb(t) FROM public.%I t WHERE id=$1 FOR UPDATE',target) INTO entry USING entity_id;
  IF expected_version IS NULL OR entry IS NULL OR (entry->>'version')::bigint<>expected_version THEN RAISE EXCEPTION 'Stale or missing catalog entity'; END IF;
  IF kind='product' THEN
    INSERT INTO public.product_revisions(product_id,revision_no,workflow_state,snapshot,created_by) VALUES(entity_id,expected_version,'before_return_to_draft',app_private.product_snapshot(entity_id),auth.uid());
    UPDATE public.products SET price_verified_at=NULL,stock_verified_at=NULL WHERE id=entity_id;
  END IF;
  EXECUTE format('UPDATE public.%I SET publication_status=''draft'',reviewed_at=NULL,reviewed_by=NULL,reviewed_version=NULL,approved_at=NULL,approved_by=NULL,identity_verified=false,content_verified=false,indexing_approved=false,archived_at=NULL,version=version+1,updated_at=now() WHERE id=$1',target) USING entity_id;
END $$;

CREATE FUNCTION public.archive_catalog_entity(kind text,entity_id uuid,expected_version bigint) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE target text; affected bigint; BEGIN
  PERFORM app_private.require_admin(); target:=app_private.entity_table(kind);
  EXECUTE format('UPDATE public.%I SET archived_at=now(),updated_at=now() WHERE id=$1 AND version=$2',target) USING entity_id,expected_version;
  GET DIAGNOSTICS affected = ROW_COUNT;
  IF affected<>1 THEN RAISE EXCEPTION 'Stale or missing catalog entity'; END IF;
END $$;

CREATE FUNCTION public.verify_catalog_media(media_id uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE entry public.catalog_media; BEGIN
  PERFORM app_private.require_admin(); SELECT * INTO entry FROM public.catalog_media WHERE id=media_id FOR UPDATE;
  IF NOT FOUND OR entry.is_placeholder OR entry.width IS NULL OR entry.height IS NULL OR length(trim(coalesce(entry.alt_text,'')))=0 THEN RAISE EXCEPTION 'A real image with dimensions and alt text is required'; END IF;
  IF NOT EXISTS (SELECT 1 FROM storage.objects o WHERE o.bucket_id=entry.bucket_id AND o.name=entry.object_name) THEN RAISE EXCEPTION 'Upload the private media object first'; END IF;
  UPDATE public.catalog_media SET verified_at=now(),verified_by=auth.uid() WHERE id=media_id;
END $$;

CREATE FUNCTION public.catalog_admin_preview(product_id uuid) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE result jsonb; BEGIN
  PERFORM app_private.require_staff(); SELECT to_jsonb(p) INTO result FROM public.products p WHERE p.id=product_id;
  RETURN result;
END $$;

CREATE FUNCTION public.rename_catalog_slug(kind text,entity_id uuid,expected_version bigint,new_slug text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE target text; entry jsonb; old_path text; new_path text; BEGIN
  PERFORM app_private.require_admin(); target:=app_private.entity_table(kind);
  IF new_slug IS NULL OR new_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' THEN RAISE EXCEPTION 'Invalid slug'; END IF;
  EXECUTE format('SELECT to_jsonb(t) FROM public.%I t WHERE id=$1 FOR UPDATE',target) INTO entry USING entity_id;
  IF expected_version IS NULL OR entry IS NULL OR (entry->>'version')::bigint<>expected_version THEN RAISE EXCEPTION 'Stale or missing catalog entity'; END IF;
  old_path:='/'||kind||'/'||(entry->>'slug'); new_path:='/'||kind||'/'||new_slug;
  IF old_path=new_path OR EXISTS (SELECT 1 FROM public.slug_redirects WHERE source_path=new_path) THEN RAISE EXCEPTION 'Slug is unchanged or reserved by history'; END IF;
  EXECUTE format('UPDATE public.%I SET slug=$2,canonical_path=NULL,version=version+1,reviewed_version=CASE WHEN publication_status=''published'' THEN version+1 ELSE reviewed_version END,updated_at=now() WHERE id=$1',target) USING entity_id,new_slug;
  IF entry->>'published_at' IS NOT NULL THEN
    UPDATE public.slug_redirects SET destination_path=new_path WHERE destination_path=old_path;
    INSERT INTO public.slug_redirects(source_path,destination_path) VALUES(old_path,new_path);
  END IF;
END $$;

CREATE VIEW public.catalog_product_categories_public WITH(security_barrier=true) AS
SELECT pc.product_id,pc.category_id FROM public.product_categories pc JOIN public.catalog_products_public p ON p.id=pc.product_id JOIN public.catalog_categories_public c ON c.id=pc.category_id WHERE pc.archived_at IS NULL;
GRANT SELECT ON public.catalog_product_categories_public TO anon,authenticated;
CREATE VIEW public.catalog_redirects_public WITH(security_barrier=true) AS
SELECT r.source_path,r.destination_path FROM public.slug_redirects r
WHERE EXISTS (SELECT 1 FROM public.catalog_routes_public p WHERE '/'||p.kind||'/'||p.slug=r.destination_path);
GRANT SELECT ON public.catalog_redirects_public TO anon,authenticated;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA app_private FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app_private.is_staff(),app_private.is_admin() TO authenticated;
REVOKE ALL ON FUNCTION public.submit_catalog_review(text,uuid,bigint),public.review_catalog_entity(text,uuid,bigint,jsonb),public.publish_catalog_entity(text,uuid,bigint,boolean),public.return_catalog_to_draft(text,uuid,bigint),public.archive_catalog_entity(text,uuid,bigint),public.verify_catalog_media(uuid),public.catalog_admin_preview(uuid),public.rename_catalog_slug(text,uuid,bigint,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_catalog_review(text,uuid,bigint),public.review_catalog_entity(text,uuid,bigint,jsonb),public.publish_catalog_entity(text,uuid,bigint,boolean),public.return_catalog_to_draft(text,uuid,bigint),public.archive_catalog_entity(text,uuid,bigint),public.verify_catalog_media(uuid),public.catalog_admin_preview(uuid),public.rename_catalog_slug(text,uuid,bigint,text) TO authenticated;
COMMIT;
