-- Phase 3 development only; never apply independently to the live storefront.
BEGIN;
DO $$ BEGIN IF current_setting('app.catalog_cutover_approved',true) IS DISTINCT FROM 'yes' THEN RAISE EXCEPTION 'Catalog cutover not approved'; END IF; END $$;
CREATE INDEX products_admin_recent ON public.products(updated_at DESC,id) WHERE archived_at IS NULL;

-- Distributed login throttling. No email/IP/password is retained. The account
-- key is an application HMAC; global limits also bound anonymous key churn.
CREATE TABLE app_private.admin_login_windows (
  key text PRIMARY KEY, starts_at timestamptz NOT NULL, attempts integer NOT NULL
);
ALTER TABLE app_private.admin_login_windows ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON app_private.admin_login_windows FROM PUBLIC,anon,authenticated;
CREATE FUNCTION public.consume_admin_login_attempt(account_key text) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE global_count integer; account_count integer; BEGIN
  IF account_key IS NULL OR account_key !~ '^[a-f0-9]{64}$' THEN RETURN false; END IF;
  PERFORM pg_catalog.pg_advisory_xact_lock(7131186);
  DELETE FROM app_private.admin_login_windows WHERE starts_at < now()-interval '15 minutes';
  INSERT INTO app_private.admin_login_windows AS w VALUES ('global',now(),1)
    ON CONFLICT(key) DO UPDATE SET
      starts_at=CASE WHEN w.starts_at<now()-interval '1 minute' THEN now() ELSE w.starts_at END,
      attempts=CASE WHEN w.starts_at<now()-interval '1 minute' THEN 1 ELSE w.attempts+1 END
    RETURNING attempts INTO global_count;
  IF global_count>60 THEN RETURN false; END IF;
  INSERT INTO app_private.admin_login_windows AS w VALUES (account_key,now(),1)
    ON CONFLICT(key) DO UPDATE SET attempts=w.attempts+1 RETURNING attempts INTO account_count;
  RETURN account_count<=5;
END $$;
REVOKE ALL ON FUNCTION public.consume_admin_login_attempt(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.consume_admin_login_attempt(text) TO anon,authenticated;

-- Atomic full-form replacement of allowed Draft fields. Never accepts status,
-- verification, author/role or approval keys, including through JSON payloads.
CREATE FUNCTION public.save_product_draft(product_id uuid,expected_version bigint,input jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE p public.products; previous public.products; saved_id uuid; BEGIN
  PERFORM app_private.require_admin();
  IF input IS NULL OR jsonb_typeof(input)<>'object' OR EXISTS (
    SELECT 1 FROM jsonb_object_keys(input) k WHERE k NOT IN ('name','slug','sku','model','description','category_id','brand_id','price','currency','sales_mode','stock_status','stock_quantity','specifications','seo_title','seo_description','canonical_path','product_type','finish')
  ) THEN RAISE EXCEPTION 'Unsupported product fields'; END IF;
  p:=jsonb_populate_record(NULL::public.products,input);
  IF p.name IS NULL OR length(trim(p.name)) NOT BETWEEN 1 AND 180 OR p.slug IS NULL OR length(p.slug)>120 OR p.slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' THEN RAISE EXCEPTION 'Product name and clean slug required'; END IF;
  IF p.price IS NOT NULL AND (p.price::text='NaN' OR p.price<=0) THEN RAISE EXCEPTION 'Price must be a genuine positive value or empty'; END IF;
  IF length(coalesce(p.description,''))>20000 OR length(coalesce(p.sku,''))>80 OR length(coalesce(p.seo_title,''))>160 OR length(coalesce(p.seo_description,''))>320 THEN RAISE EXCEPTION 'Product field too long'; END IF;
  IF product_id IS NOT NULL THEN
    SELECT * INTO previous FROM public.products WHERE id=product_id FOR UPDATE;
    IF NOT FOUND OR expected_version IS NULL OR previous.version<>expected_version THEN RAISE EXCEPTION 'Stale or missing product' USING ERRCODE='40001'; END IF;
    IF previous.publication_status<>'draft' OR previous.archived_at IS NOT NULL THEN RAISE EXCEPTION 'An active Draft is required'; END IF;
    IF previous.published_at IS NOT NULL AND previous.slug<>p.slug THEN RAISE EXCEPTION 'Use the permanent slug rename workflow'; END IF;
  ELSIF expected_version IS NOT NULL THEN RAISE EXCEPTION 'New product must not supply a version'; END IF;
  IF product_id IS NULL THEN
    INSERT INTO public.products(name,slug,sku,model,description,category_id,brand_id,price,currency,sales_mode,stock_status,stock_quantity,specifications,seo_title,seo_description,canonical_path,product_type,finish,is_whatsapp_inquiry)
    VALUES(trim(p.name),p.slug,nullif(trim(p.sku),''),nullif(trim(p.model),''),nullif(trim(p.description),''),p.category_id,p.brand_id,p.price,coalesce(p.currency,'PKR'),coalesce(p.sales_mode,'online'),coalesce(p.stock_status,'unknown'),p.stock_quantity,coalesce(p.specifications,'{}'),nullif(trim(p.seo_title),''),nullif(trim(p.seo_description),''),nullif(p.canonical_path,''),p.product_type,p.finish,coalesce(p.sales_mode='quotation',false)) RETURNING id INTO saved_id;
  ELSE
    UPDATE public.products SET name=trim(p.name),slug=p.slug,sku=nullif(trim(p.sku),''),model=nullif(trim(p.model),''),description=nullif(trim(p.description),''),category_id=p.category_id,brand_id=p.brand_id,price=p.price,currency=coalesce(p.currency,'PKR'),sales_mode=coalesce(p.sales_mode,'online'),stock_status=coalesce(p.stock_status,'unknown'),stock_quantity=p.stock_quantity,specifications=coalesce(p.specifications,'{}'),seo_title=nullif(trim(p.seo_title),''),seo_description=nullif(trim(p.seo_description),''),canonical_path=nullif(p.canonical_path,''),product_type=p.product_type,finish=p.finish,is_whatsapp_inquiry=coalesce(p.sales_mode='quotation',false),
      version=version+1,updated_at=now(),reviewed_at=NULL,reviewed_by=NULL,reviewed_version=NULL,approved_at=NULL,approved_by=NULL,identity_verified=false,content_verified=false,indexing_approved=false,price_verified_at=NULL,stock_verified_at=NULL
    WHERE id=product_id RETURNING id INTO saved_id;
  END IF;
  RETURN (SELECT jsonb_build_object('id',id,'version',version) FROM public.products WHERE id=saved_id);
END $$;
REVOKE ALL ON FUNCTION public.save_product_draft(uuid,bigint,jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.save_product_draft(uuid,bigint,jsonb) TO authenticated;
-- Browser-facing product authoring now goes through the versioned RPC only.
DO $$ DECLARE cols text; BEGIN
  SELECT string_agg(quote_ident(attname),',') INTO cols FROM pg_catalog.pg_attribute
    WHERE attrelid='public.products'::regclass AND attnum>0 AND NOT attisdropped;
  EXECUTE 'REVOKE INSERT ('||cols||'),UPDATE ('||cols||') ON public.products FROM authenticated';
END $$;

ALTER TABLE public.product_images ADD COLUMN alt_text_override text CHECK(alt_text_override IS NULL OR length(trim(alt_text_override)) BETWEEN 1 AND 500);
CREATE FUNCTION public.save_product_image_alt(product_id uuid,image_id uuid,expected_version bigint,alt_text text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE p public.products; BEGIN
  PERFORM app_private.require_admin();
  SELECT * INTO p FROM public.products WHERE id=product_id FOR UPDATE;
  IF NOT FOUND OR expected_version IS NULL OR p.version<>expected_version THEN RAISE EXCEPTION 'Stale or missing product' USING ERRCODE='40001'; END IF;
  IF p.publication_status<>'draft' OR p.archived_at IS NOT NULL THEN RAISE EXCEPTION 'An active Draft is required'; END IF;
  UPDATE public.product_images SET alt_text_override=nullif(trim(alt_text),'') WHERE id=image_id AND product_images.product_id=p.id AND archived_at IS NULL;
  IF NOT FOUND THEN RAISE EXCEPTION 'Image does not belong to this Draft'; END IF;
END $$;
REVOKE ALL ON FUNCTION public.save_product_image_alt(uuid,uuid,bigint,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.save_product_image_alt(uuid,uuid,bigint,text) TO authenticated;
CREATE OR REPLACE VIEW public.catalog_images_public WITH (security_barrier=true) AS
SELECT i.product_id,m.id AS media_id,coalesce(i.alt_text_override,m.alt_text) AS alt_text,m.width,m.height,m.mime_type,i.sort_order
FROM public.product_images i JOIN public.catalog_media m ON m.id=i.media_id JOIN public.catalog_products_public p ON p.id=i.product_id
WHERE i.archived_at IS NULL AND m.verified_at IS NOT NULL AND m.verified_by IS NOT NULL AND NOT m.is_placeholder;
COMMIT;
