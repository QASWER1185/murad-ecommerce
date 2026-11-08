-- Phase 5, additive development migration. Never run against production alone.
BEGIN;
DO $$ BEGIN IF current_setting('app.catalog_cutover_approved',true) IS DISTINCT FROM 'yes' THEN RAISE EXCEPTION 'Catalog cutover not approved'; END IF; END $$;

-- Strengthen the original public projections: a withdrawn parent/brand also
-- withdraws its products. Existing authoring IDs/data/approval states stay intact.
CREATE OR REPLACE VIEW public.catalog_categories_public WITH(security_barrier=true) AS
SELECT id,name,slug,description,parent_id,default_sales_mode,seo_title,seo_description,canonical_path,updated_at,
 app_private.taxonomy_indexable(publication_status,archived_at,reviewed_at,approved_at,identity_verified,content_verified,indexing_approved,description,seo_title,seo_description,canonical_path,'/category/'||slug) AS is_indexable
FROM public.categories WHERE app_private.visible(publication_status,archived_at,reviewed_at,approved_at)
 AND identity_verified AND content_verified AND reviewed_version=version AND reviewed_by IS NOT NULL AND approved_by IS NOT NULL
 AND NOT EXISTS(WITH RECURSIVE ancestors AS (
 SELECT c.* FROM public.categories c WHERE c.id=categories.parent_id
 UNION SELECT c.* FROM public.categories c JOIN ancestors a ON c.id=a.parent_id
 ) SELECT 1 FROM ancestors WHERE NOT(app_private.visible(publication_status,archived_at,reviewed_at,approved_at)
 AND identity_verified AND content_verified AND reviewed_version=version AND reviewed_by IS NOT NULL AND approved_by IS NOT NULL));
CREATE OR REPLACE VIEW public.catalog_brands_public WITH(security_barrier=true) AS
SELECT id,name,slug,description,kind,seo_title,seo_description,canonical_path,updated_at,
 app_private.taxonomy_indexable(publication_status,archived_at,reviewed_at,approved_at,identity_verified,content_verified,indexing_approved,description,seo_title,seo_description,canonical_path,'/brand/'||slug) AS is_indexable
FROM public.brands WHERE app_private.visible(publication_status,archived_at,reviewed_at,approved_at)
 AND identity_verified AND content_verified AND reviewed_version=version AND reviewed_by IS NOT NULL AND approved_by IS NOT NULL;
CREATE FUNCTION app_private.category_is_quotation(p_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 WITH RECURSIVE ancestors AS (SELECT c.id,c.parent_id,c.default_sales_mode FROM public.catalog_categories_public c WHERE c.id=p_id
 UNION SELECT c.id,c.parent_id,c.default_sales_mode FROM public.catalog_categories_public c JOIN ancestors a ON c.id=a.parent_id)
 SELECT EXISTS(SELECT 1 FROM ancestors WHERE default_sales_mode='quotation')
$$;
REVOKE ALL ON FUNCTION app_private.category_is_quotation(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app_private.category_is_quotation(uuid) TO anon,authenticated;
CREATE OR REPLACE VIEW public.catalog_products_public WITH(security_barrier=true) AS
SELECT p.id,p.name,p.slug,p.description,p.sku,p.model,p.product_type,p.finish,p.specifications,p.category_id,p.brand_id,
 CASE WHEN app_private.category_is_quotation(p.category_id) THEN 'quotation' ELSE p.sales_mode END AS sales_mode,
 p.currency,p.featured,p.published_at,p.updated_at,p.seo_title,p.seo_description,p.canonical_path,
 CASE WHEN p.sales_mode='online' AND p.price_verified_at IS NOT NULL AND p.price>0 AND p.price::text<>'NaN' AND NOT app_private.category_is_quotation(p.category_id) THEN p.price END AS price,
 CASE WHEN p.stock_verified_at IS NOT NULL THEN p.stock_status ELSE 'unknown' END AS availability,
 app_private.product_indexable(p.id) AS is_indexable
FROM public.products p JOIN public.catalog_categories_public c ON c.id=p.category_id
WHERE app_private.visible(p.publication_status,p.archived_at,p.reviewed_at,p.approved_at)
 AND p.identity_verified AND p.content_verified AND p.reviewed_version=p.version AND p.reviewed_by IS NOT NULL AND p.approved_by IS NOT NULL
 AND (p.brand_id IS NULL OR EXISTS(SELECT 1 FROM public.catalog_brands_public b WHERE b.id=p.brand_id));
CREATE OR REPLACE FUNCTION app_private.media_is_public(p_media uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT EXISTS(SELECT 1 FROM public.catalog_media m WHERE m.id=p_media AND m.verified_at IS NOT NULL AND m.verified_by IS NOT NULL
 AND NOT m.is_placeholder AND m.processed_at IS NOT NULL AND (
  EXISTS(SELECT 1 FROM public.product_images i JOIN public.catalog_products_public p ON p.id=i.product_id WHERE i.media_id=m.id AND i.archived_at IS NULL)
  OR EXISTS(SELECT 1 FROM public.brands b JOIN public.catalog_brands_public v ON v.id=b.id WHERE b.logo_media_id=m.id)
  OR EXISTS(SELECT 1 FROM public.categories c JOIN public.catalog_categories_public v ON v.id=c.id WHERE c.hero_media_id=m.id)
  OR EXISTS(SELECT 1 FROM public.homepage_banners b WHERE b.media_id=m.id AND b.active)))
$$;
CREATE OR REPLACE VIEW public.catalog_images_public WITH(security_barrier=true) AS
SELECT i.product_id,m.id AS media_id,coalesce(i.alt_text_override,p.default_image_alt,m.alt_text) AS alt_text,m.width,m.height,m.mime_type,i.sort_order
FROM public.product_images i JOIN public.catalog_media m ON m.id=i.media_id JOIN public.catalog_products_public v ON v.id=i.product_id JOIN public.products p ON p.id=v.id
WHERE i.archived_at IS NULL AND app_private.media_is_public(m.id)
 AND (SELECT count(*) FROM public.catalog_media_variants d WHERE d.media_id=m.id)=3;
CREATE VIEW public.catalog_assets_public WITH(security_barrier=true) AS
SELECT a.kind,a.entity_id,a.media_id,a.alt_text,m.width,m.height FROM public.catalog_asset_links_public a JOIN public.catalog_media m ON m.id=a.media_id
WHERE app_private.media_is_public(m.id) AND (SELECT count(*) FROM public.catalog_media_variants v WHERE v.media_id=m.id)=3;
GRANT SELECT ON public.catalog_assets_public TO anon,authenticated;

CREATE FUNCTION app_private.storefront_product(p public.catalog_products_public) RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT to_jsonb(p) || jsonb_build_object(
 'brand',(SELECT to_jsonb(b) FROM public.catalog_brands_public b WHERE b.id=p.brand_id),
 'category',(SELECT to_jsonb(c) FROM public.catalog_categories_public c WHERE c.id=p.category_id),
 'gallery',coalesce((SELECT jsonb_agg(to_jsonb(i) ORDER BY i.sort_order,i.media_id) FROM public.catalog_images_public i WHERE i.product_id=p.id),'[]'::jsonb))
$$;
REVOKE ALL ON FUNCTION app_private.storefront_product(public.catalog_products_public) FROM PUBLIC;

-- A generation token contains no Draft fields. It is used to refresh an already
-- open browser after changes; public responses themselves are never cached.
CREATE TABLE app_private.storefront_generation(singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton),generation bigint NOT NULL DEFAULT 1);
INSERT INTO app_private.storefront_generation VALUES(true,1);
ALTER TABLE app_private.storefront_generation ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON app_private.storefront_generation FROM PUBLIC,anon,authenticated;
CREATE FUNCTION app_private.bump_storefront_generation() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN UPDATE app_private.storefront_generation SET generation=generation+1;RETURN NEW;END $$;
REVOKE ALL ON FUNCTION app_private.bump_storefront_generation() FROM PUBLIC;
CREATE TRIGGER storefront_generation AFTER INSERT ON app_private.invalidation_events FOR EACH STATEMENT EXECUTE FUNCTION app_private.bump_storefront_generation();
CREATE FUNCTION public.catalog_public_generation() RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$ SELECT generation::text FROM app_private.storefront_generation WHERE singleton $$;
REVOKE ALL ON FUNCTION public.catalog_public_generation() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.catalog_public_generation() TO anon,authenticated;

-- One statement snapshot; filters and facets never read raw authoring records.
CREATE FUNCTION public.catalog_storefront(p_kind text,p_slug text,p_query jsonb DEFAULT '{}'::jsonb) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE target jsonb; route jsonb; result jsonb; requested_page integer; BEGIN
 IF p_kind IS NULL OR p_kind NOT IN ('home','category','brand','product','search') OR p_slug IS NULL OR length(p_slug)>180 OR (p_slug<>'' AND p_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$') THEN RAISE EXCEPTION 'Invalid catalog route'; END IF;
 IF p_query IS NULL OR jsonb_typeof(p_query)<>'object' OR pg_column_size(p_query)>16384 THEN RAISE EXCEPTION 'Invalid catalog query'; END IF;
 IF length(coalesce(p_query->>'q',''))>120 OR coalesce(p_query->>'sort','name') NOT IN ('name','newest','price-low','price-high') THEN RAISE EXCEPTION 'Invalid catalog search'; END IF;
 IF (p_query ? 'brand' AND (jsonb_typeof(p_query->'brand')<>'array' OR jsonb_array_length(p_query->'brand')>20)) OR (p_query ? 'type' AND (jsonb_typeof(p_query->'type')<>'array' OR jsonb_array_length(p_query->'type')>20)) THEN RAISE EXCEPTION 'Too many filters'; END IF;
 requested_page:=coalesce((p_query->>'page')::integer,1);IF requested_page NOT BETWEEN 1 AND 10000 THEN RAISE EXCEPTION 'Invalid page'; END IF;
 IF p_kind IN ('category','brand','product') THEN
 SELECT to_jsonb(r) INTO route FROM public.catalog_routes_public r WHERE r.kind=p_kind AND r.slug=p_slug;
 IF p_kind='category' THEN SELECT to_jsonb(c) INTO target FROM public.catalog_categories_public c WHERE c.slug=p_slug;
 ELSIF p_kind='brand' THEN SELECT to_jsonb(b) INTO target FROM public.catalog_brands_public b WHERE b.slug=p_slug;
 ELSE SELECT app_private.storefront_product(p) INTO target FROM public.catalog_products_public p WHERE p.slug=p_slug; END IF;
 END IF;
 WITH RECURSIVE category_tree AS (
 SELECT c.id FROM public.catalog_categories_public c WHERE c.slug=CASE WHEN p_kind='product' THEN target->'category'->>'slug' ELSE p_slug END
 UNION SELECT c.id FROM public.catalog_categories_public c JOIN category_tree t ON c.parent_id=t.id
 ), scope AS (
 SELECT p.* FROM public.catalog_products_public p WHERE
 CASE WHEN p_kind='category' THEN EXISTS(SELECT 1 FROM category_tree t WHERE t.id=p.category_id) OR EXISTS(SELECT 1 FROM public.catalog_product_categories_public pc JOIN category_tree t ON t.id=pc.category_id WHERE pc.product_id=p.id)
 WHEN p_kind='brand' THEN p.brand_id=(target->>'id')::uuid
 WHEN p_kind='product' THEN p.id<>(target->>'id')::uuid AND p.category_id=(target->>'category_id')::uuid
 WHEN p_kind='home' THEN p.featured ELSE true END
 ), filtered AS (
 SELECT s.* FROM scope s WHERE
 (coalesce(p_query->>'q','')='' OR NOT EXISTS(SELECT 1 FROM regexp_split_to_table(lower(trim(p_query->>'q')),'\s+') w WHERE strpos(lower(concat_ws(' ',s.name,s.sku,s.model,(SELECT b.name FROM public.catalog_brands_public b WHERE b.id=s.brand_id))),w)=0))
 AND (coalesce(jsonb_array_length(p_query->'brand'),0)=0 OR EXISTS(SELECT 1 FROM public.catalog_brands_public b WHERE b.id=s.brand_id AND p_query->'brand' ? b.slug))
 AND (coalesce(jsonb_array_length(p_query->'type'),0)=0 OR p_query->'type' ? s.product_type)
 AND (coalesce(p_query->>'finish','')='' OR s.finish=p_query->>'finish')
 AND (coalesce(p_query->>'availability','')='' OR s.availability=p_query->>'availability')
 AND (coalesce(p_query->>'min','')='' OR s.price>=nullif(p_query->>'min','')::numeric)
 AND (coalesce(p_query->>'max','')='' OR s.price<=nullif(p_query->>'max','')::numeric)
 ), page_rows AS (
 SELECT f.* FROM filtered f ORDER BY
 CASE WHEN p_query->>'sort'='price-low' THEN f.price END ASC NULLS LAST,
 CASE WHEN p_query->>'sort'='price-high' THEN f.price END DESC NULLS LAST,
 CASE WHEN p_query->>'sort'='newest' THEN f.published_at END DESC NULLS LAST,
 lower(f.name),f.id LIMIT CASE WHEN p_kind='product' THEN 4 ELSE 12 END OFFSET (requested_page-1)*12
 ) SELECT jsonb_build_object(
 'entity',target,'route',route,'products',coalesce((SELECT jsonb_agg(app_private.storefront_product(p::public.catalog_products_public)) FROM page_rows p),'[]'::jsonb),
 'total',(SELECT count(*) FROM filtered),'page',requested_page,'pages',greatest(1,ceil((SELECT count(*) FROM filtered)/12.0)),
 'types',coalesce((SELECT jsonb_agg(t) FROM (SELECT DISTINCT product_type AS t FROM scope WHERE product_type IS NOT NULL ORDER BY t LIMIT 100) rows),'[]'::jsonb),
 'finishes',coalesce((SELECT jsonb_agg(t) FROM (SELECT DISTINCT finish AS t FROM scope WHERE finish IS NOT NULL ORDER BY t LIMIT 100) rows),'[]'::jsonb),
 'brands',coalesce((SELECT jsonb_agg(to_jsonb(b)||jsonb_build_object('asset',(SELECT to_jsonb(a) FROM public.catalog_assets_public a WHERE a.kind='brand' AND a.entity_id=b.id)) ORDER BY b.name) FROM public.catalog_brands_public b),'[]'::jsonb),
 'categories',coalesce((SELECT jsonb_agg(to_jsonb(c)||jsonb_build_object('asset',(SELECT to_jsonb(a) FROM public.catalog_assets_public a WHERE a.kind='category' AND a.entity_id=c.id)) ORDER BY c.name) FROM public.catalog_categories_public c),'[]'::jsonb),
 'settings',(SELECT to_jsonb(s) FROM public.catalog_settings_public s LIMIT 1),
 'banners',coalesce((SELECT jsonb_agg(to_jsonb(b)||jsonb_build_object('asset',to_jsonb(a)) ORDER BY b.sort_order,b.id) FROM public.catalog_banners_public b JOIN public.catalog_assets_public a ON a.kind='banner' AND a.entity_id=b.id),'[]'::jsonb),
 'generation',public.catalog_public_generation()) INTO result;
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.catalog_storefront(text,text,jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.catalog_storefront(text,text,jsonb) TO anon,authenticated;

-- Lease-based outbox processing: ack cannot erase a concurrently added event.
ALTER TABLE app_private.invalidation_events ADD COLUMN lease_token uuid,ADD COLUMN lease_until timestamptz;
CREATE FUNCTION public.claim_catalog_invalidations(p_limit integer DEFAULT 50) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$ DECLARE result jsonb;BEGIN
 PERFORM app_private.require_admin();IF p_limit IS NULL OR p_limit NOT BETWEEN 1 AND 50 THEN RAISE EXCEPTION 'Bounded batch required';END IF;
 WITH selected AS (SELECT id FROM app_private.invalidation_events WHERE processed_at IS NULL AND (lease_until IS NULL OR lease_until<now()) ORDER BY id FOR UPDATE SKIP LOCKED LIMIT p_limit), claimed AS (
 UPDATE app_private.invalidation_events e SET lease_token=gen_random_uuid(),lease_until=now()+interval '2 minutes',attempts=attempts+1 FROM selected s WHERE e.id=s.id RETURNING e.*)
 SELECT coalesce(jsonb_agg(jsonb_build_object('id',id::text,'entity_type',entity_type,'entity_id',entity_id,'old_slug',old_slug,'new_slug',new_slug,'token',lease_token) ORDER BY id),'[]'::jsonb) INTO result FROM claimed;RETURN result;
END $$;
CREATE FUNCTION public.finish_catalog_invalidation(p_id bigint,p_token uuid,p_error text DEFAULT NULL) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$ DECLARE affected integer;BEGIN
 PERFORM app_private.require_admin(); UPDATE app_private.invalidation_events SET processed_at=CASE WHEN p_error IS NULL THEN now() END,last_error=left(p_error,500),lease_token=NULL,lease_until=CASE WHEN p_error IS NULL THEN NULL ELSE now()+interval '15 seconds' END
 WHERE id=p_id AND lease_token=p_token AND lease_until>=now() AND processed_at IS NULL;
 GET DIAGNOSTICS affected=ROW_COUNT;RETURN affected=1;
END $$;
REVOKE ALL ON FUNCTION public.claim_catalog_invalidations(integer),public.finish_catalog_invalidation(bigint,uuid,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_catalog_invalidations(integer),public.finish_catalog_invalidation(bigint,uuid,text) TO authenticated;
CREATE FUNCTION public.catalog_cart(p_ids uuid[]) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$ BEGIN
 IF p_ids IS NULL OR cardinality(p_ids)>100 THEN RAISE EXCEPTION 'Bounded cart required'; END IF;
 RETURN coalesce((SELECT jsonb_agg(app_private.storefront_product(p)) FROM public.catalog_products_public p WHERE p.id=ANY(p_ids)),'[]'::jsonb);
END $$;
REVOKE ALL ON FUNCTION public.catalog_cart(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.catalog_cart(uuid[]) TO anon,authenticated;
CREATE FUNCTION public.set_catalog_product_featured(p_id uuid,p_version bigint,p_featured boolean) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE p public.products;BEGIN
 PERFORM app_private.require_admin();SELECT * INTO p FROM public.products WHERE id=p_id FOR UPDATE;
 IF NOT FOUND OR p_version IS NULL OR p.version<>p_version THEN RAISE EXCEPTION 'Stale product version' USING ERRCODE='40001';END IF;
 IF p.publication_status<>'draft' OR p.archived_at IS NOT NULL OR p_featured IS NULL THEN RAISE EXCEPTION 'An active Draft and explicit featured value are required';END IF;
 INSERT INTO public.product_revisions(product_id,revision_no,workflow_state,snapshot,created_by) VALUES(p.id,p.version,'before_featured_change',app_private.product_snapshot(p.id),auth.uid());
 UPDATE public.products SET featured=p_featured,version=version+1,updated_at=now(),reviewed_at=NULL,reviewed_by=NULL,reviewed_version=NULL,approved_at=NULL,approved_by=NULL,identity_verified=false,content_verified=false,indexing_approved=false,price_verified_at=NULL,stock_verified_at=NULL WHERE id=p.id;
END $$;
REVOKE ALL ON FUNCTION public.set_catalog_product_featured(uuid,bigint,boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_catalog_product_featured(uuid,bigint,boolean) TO authenticated;
COMMIT;
