-- REVIEW REQUIRED. Never run against production as part of Phase 2.
-- This explicit cutover guard prevents accidental `supabase db push` application.
BEGIN;
DO $$ BEGIN
  IF current_setting('app.catalog_cutover_approved', true) IS DISTINCT FROM 'yes' THEN
    RAISE EXCEPTION 'Catalog cutover not approved: review docs/phase2/release-and-recovery.md first';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_catalog.pg_attribute a
    WHERE a.attrelid IN ('public.products'::regclass,'public.categories'::regclass,'public.brands'::regclass)
      AND a.attnum>0 AND NOT a.attisdropped AND a.attacl IS NOT NULL) THEN
    RAISE EXCEPTION 'Unrecognized legacy column grants: review cutover before applying';
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_catalog.pg_policies WHERE schemaname='public' AND tablename IN ('products','categories','brands')
    AND (tablename,policyname) NOT IN (('products','Allow public read access on products'),('categories','Allow public read access on categories'),('brands','Allow public read access on brands'))) THEN
    RAISE EXCEPTION 'Unrecognized legacy catalog policies: review cutover before applying';
  END IF;
END $$;

CREATE SCHEMA IF NOT EXISTS app_private;
REVOKE CREATE ON SCHEMA public FROM PUBLIC,anon,authenticated;
REVOKE ALL ON SCHEMA app_private FROM PUBLIC;
-- USAGE allows predicates referenced by views/policies, never table access.
GRANT USAGE ON SCHEMA app_private TO anon,authenticated;

CREATE TABLE app_private.user_roles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE RESTRICT,
  role text NOT NULL CHECK (role IN ('admin','editor')),
  assigned_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE app_private.user_roles ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON app_private.user_roles FROM PUBLIC, anon, authenticated;
-- No client role-management policy/RPC. Trusted DB operators bootstrap roles.
CREATE FUNCTION public.current_catalog_role() RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT role FROM app_private.user_roles WHERE user_id = auth.uid()
$$;
REVOKE ALL ON FUNCTION public.current_catalog_role() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_catalog_role() TO authenticated;
CREATE FUNCTION app_private.is_staff() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT coalesce(public.current_catalog_role() IN ('admin','editor'), false)
$$;
CREATE FUNCTION app_private.is_admin() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT coalesce(public.current_catalog_role() = 'admin', false)
$$;
REVOKE ALL ON FUNCTION app_private.is_staff(), app_private.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app_private.is_staff(), app_private.is_admin() TO authenticated;

-- Uniform workflow/SEO fields on existing entities. No legacy values overwritten.
DO $$ DECLARE target text; BEGIN
  FOREACH target IN ARRAY ARRAY['products','categories','brands'] LOOP
    EXECUTE format('ALTER TABLE public.%I
      ADD COLUMN publication_status text NOT NULL DEFAULT ''draft'' CHECK (publication_status IN (''draft'',''ready_for_review'',''published'')),
      ADD COLUMN version bigint NOT NULL DEFAULT 1,
      ADD COLUMN reviewed_version bigint,
      ADD COLUMN reviewed_at timestamptz,
      ADD COLUMN reviewed_by uuid REFERENCES auth.users(id) ON DELETE RESTRICT,
      ADD COLUMN approved_at timestamptz,
      ADD COLUMN approved_by uuid REFERENCES auth.users(id) ON DELETE RESTRICT,
      ADD COLUMN published_at timestamptz,
      ADD COLUMN archived_at timestamptz,
      ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now(),
      ADD COLUMN identity_verified boolean NOT NULL DEFAULT false,
      ADD COLUMN content_verified boolean NOT NULL DEFAULT false,
      ADD COLUMN indexing_approved boolean NOT NULL DEFAULT false,
      ADD COLUMN seo_title text,
      ADD COLUMN seo_description text,
      ADD COLUMN canonical_path text CHECK (canonical_path IS NULL OR canonical_path ~ ''^/(product|category|brand)/[a-z0-9]+(-[a-z0-9]+)*$'')', target);
    EXECUTE format('ALTER TABLE public.%I ADD CONSTRAINT %I CHECK
      (publication_status <> ''published'' OR (identity_verified AND content_verified AND reviewed_at IS NOT NULL AND reviewed_by IS NOT NULL AND approved_at IS NOT NULL AND approved_by IS NOT NULL AND reviewed_version IS NOT NULL AND reviewed_version = version))', target, target || '_publication_approval');
  END LOOP;
END $$;
ALTER TABLE public.products
  ALTER COLUMN price DROP NOT NULL, ALTER COLUMN price DROP DEFAULT,
  ALTER COLUMN in_stock DROP NOT NULL, ALTER COLUMN in_stock DROP DEFAULT,
  ADD COLUMN IF NOT EXISTS model text,
  ADD COLUMN IF NOT EXISTS product_type text,
  ADD COLUMN IF NOT EXISTS finish text,
  ADD COLUMN sku text CHECK (sku IS NULL OR length(trim(sku)) > 0),
  ADD COLUMN currency text NOT NULL DEFAULT 'PKR' CHECK (currency ~ '^[A-Z]{3}$'),
  ADD COLUMN sales_mode text NOT NULL DEFAULT 'online' CHECK (sales_mode IN ('online','quotation')),
  ADD COLUMN stock_status text NOT NULL DEFAULT 'unknown' CHECK (stock_status IN ('unknown','in_stock','out_of_stock')),
  ADD COLUMN stock_quantity integer CHECK (stock_quantity IS NULL OR stock_quantity >= 0),
  ADD COLUMN stock_verified_at timestamptz,
  ADD COLUMN price_verified_at timestamptz,
  ADD COLUMN featured boolean NOT NULL DEFAULT false,
  ADD COLUMN specifications jsonb NOT NULL DEFAULT '{}' CHECK (jsonb_typeof(specifications) = 'object');
CREATE UNIQUE INDEX products_normalized_sku ON public.products (lower(trim(sku))) WHERE sku IS NOT NULL;
ALTER TABLE public.categories
  ADD COLUMN parent_id uuid REFERENCES public.categories(id) ON DELETE RESTRICT,
  ADD COLUMN description text,
  ADD COLUMN default_sales_mode text NOT NULL DEFAULT 'online' CHECK (default_sales_mode IN ('online','quotation'));
ALTER TABLE public.brands ADD COLUMN description text,
  ADD COLUMN kind text NOT NULL DEFAULT 'manufacturer' CHECK (kind IN ('manufacturer','collection'));

CREATE TABLE public.product_categories (
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
  archived_at timestamptz,
  PRIMARY KEY (product_id, category_id)
);
-- Existing category_id remains the primary category; copy associations only.
INSERT INTO public.product_categories SELECT id, category_id FROM public.products WHERE category_id IS NOT NULL;
CREATE TABLE public.catalog_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket_id text NOT NULL DEFAULT 'catalog-private' CHECK (bucket_id = 'catalog-private'),
  object_name text NOT NULL CHECK (object_name ~ '^[a-zA-Z0-9][a-zA-Z0-9/_ .-]*$' AND object_name NOT LIKE '%..%'),
  mime_type text NOT NULL CHECK (mime_type IN ('image/jpeg','image/png','image/webp','image/avif')),
  alt_text text,
  width integer CHECK (width > 0), height integer CHECK (height > 0),
  is_placeholder boolean NOT NULL DEFAULT true,
  verified_at timestamptz,
  verified_by uuid REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (bucket_id, object_name)
);
CREATE TABLE public.product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  media_id uuid NOT NULL REFERENCES public.catalog_media(id) ON DELETE RESTRICT,
  sort_order integer NOT NULL DEFAULT 0 CHECK (sort_order >= 0),
  archived_at timestamptz,
  UNIQUE (product_id, media_id)
);
ALTER TABLE public.brands ADD COLUMN logo_media_id uuid REFERENCES public.catalog_media(id) ON DELETE RESTRICT;
ALTER TABLE public.categories ADD COLUMN hero_media_id uuid REFERENCES public.catalog_media(id) ON DELETE RESTRICT;
CREATE TABLE public.product_revisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  revision_no bigint NOT NULL, workflow_state text NOT NULL,
  snapshot jsonb NOT NULL CHECK (jsonb_typeof(snapshot) = 'object'),
  created_by uuid REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE app_private.audit_log (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  entity_type text NOT NULL, entity_id uuid NOT NULL, action text NOT NULL,
  actor_id uuid REFERENCES auth.users(id) ON DELETE RESTRICT,
  before_data jsonb, after_data jsonb, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE app_private.invalidation_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  entity_type text NOT NULL, entity_id uuid NOT NULL,
  old_slug text, new_slug text,
  created_at timestamptz NOT NULL DEFAULT now(), processed_at timestamptz,
  attempts integer NOT NULL DEFAULT 0, last_error text
);
CREATE TABLE public.slug_redirects (
  source_path text PRIMARY KEY CHECK (source_path ~ '^/(product|category|brand)/[a-z0-9]+(-[a-z0-9]+)*$'),
  destination_path text NOT NULL CHECK (destination_path ~ '^/(product|category|brand)/[a-z0-9]+(-[a-z0-9]+)*$'),
  CHECK (source_path <> destination_path), created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.site_settings (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  business_name text, street_address text, city text, country_code text CHECK (country_code ~ '^[A-Z]{2}$'),
  main_whatsapp text CHECK (main_whatsapp ~ '^\+[1-9][0-9]{7,14}$'),
  secondary_whatsapp text CHECK (secondary_whatsapp ~ '^\+[1-9][0-9]{7,14}$'),
  is_public boolean NOT NULL DEFAULT false, updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.homepage_banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), title text NOT NULL, subtitle text,
  cta_label text, cta_path text CHECK (cta_path ~ '^/([a-zA-Z0-9/-]*)?$'),
  media_id uuid REFERENCES public.catalog_media(id) ON DELETE RESTRICT,
  sort_order integer NOT NULL DEFAULT 0, active boolean NOT NULL DEFAULT false
);
CREATE TABLE public.import_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), created_by uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE RESTRICT,
  file_name text NOT NULL, file_sha256 text NOT NULL CHECK (file_sha256 ~ '^[a-f0-9]{64}$'),
  format text NOT NULL CHECK (format IN ('csv','xlsx')),
  mode text NOT NULL DEFAULT 'draft_import' CHECK (mode IN ('draft_import','price_update')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','validating','ready_for_review','processing','completed','failed')),
  column_mapping jsonb NOT NULL DEFAULT '{}' CHECK (jsonb_typeof(column_mapping) = 'object'),
  created_at timestamptz NOT NULL DEFAULT now(), completed_at timestamptz
);
CREATE TABLE public.import_rows (
  job_id uuid NOT NULL REFERENCES public.import_jobs(id) ON DELETE RESTRICT,
  row_number integer NOT NULL CHECK (row_number > 0), sku text,
  payload jsonb NOT NULL CHECK (jsonb_typeof(payload) = 'object'),
  errors jsonb NOT NULL DEFAULT '[]' CHECK (jsonb_typeof(errors) = 'array'),
  intended_action text CHECK (intended_action IN ('create_draft','stage_revision','price_update','skip')),
  product_id uuid REFERENCES public.products(id) ON DELETE RESTRICT,
  PRIMARY KEY (job_id,row_number)
);

CREATE INDEX products_publication_category ON public.products(publication_status,category_id,created_at DESC,id);
CREATE INDEX products_publication_brand ON public.products(publication_status,brand_id,id);
CREATE INDEX products_verified_price ON public.products(price,id) WHERE price_verified_at IS NOT NULL;
CREATE INDEX products_search ON public.products USING gin(to_tsvector('simple', coalesce(name,'') || ' ' || coalesce(sku,'') || ' ' || coalesce(model,'')));
CREATE INDEX product_images_product ON public.product_images(product_id,sort_order,id);
CREATE INDEX product_categories_category ON public.product_categories(category_id,product_id);
CREATE INDEX product_revisions_product ON public.product_revisions(product_id,revision_no DESC);
CREATE INDEX pending_invalidation_events ON app_private.invalidation_events(id) WHERE processed_at IS NULL;

CREATE FUNCTION app_private.guard_entity() RETURNS trigger
LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  -- DB-owner functions below implement controlled workflow changes.
  IF current_user = pg_catalog.pg_get_userbyid((SELECT relowner FROM pg_catalog.pg_class WHERE oid = TG_RELID)) THEN RETURN NEW; END IF;
  IF OLD.publication_status <> 'draft' THEN RAISE EXCEPTION 'Return to draft before editing'; END IF;
  IF OLD.published_at IS NOT NULL AND NEW.slug <> OLD.slug THEN RAISE EXCEPTION 'Published slug is permanent; use approved rename workflow'; END IF;
  NEW.version := OLD.version + 1; NEW.updated_at := now();
  NEW.reviewed_at := NULL; NEW.reviewed_by := NULL; NEW.reviewed_version := NULL;
  NEW.approved_at := NULL; NEW.approved_by := NULL;
  NEW.identity_verified := false; NEW.content_verified := false; NEW.indexing_approved := false;
  IF TG_TABLE_NAME = 'products' THEN NEW.price_verified_at := NULL; NEW.stock_verified_at := NULL; END IF;
  RETURN NEW;
END $$;
CREATE FUNCTION app_private.category_acyclic() RETURNS trigger
LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  IF NEW.parent_id IS NULL THEN RETURN NEW; END IF;
  PERFORM pg_catalog.pg_advisory_xact_lock(7131185);
  IF NEW.id = NEW.parent_id OR EXISTS (
    WITH RECURSIVE ancestors AS (
      SELECT id,parent_id FROM public.categories WHERE id=NEW.parent_id
      UNION SELECT c.id,c.parent_id FROM public.categories c JOIN ancestors a ON c.id=a.parent_id
    ) SELECT 1 FROM ancestors WHERE id=NEW.id
  ) THEN RAISE EXCEPTION 'Category hierarchy cycle'; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER category_tree_guard BEFORE INSERT OR UPDATE OF parent_id ON public.categories FOR EACH ROW EXECUTE FUNCTION app_private.category_acyclic();
DO $$ DECLARE target text; BEGIN
  FOREACH target IN ARRAY ARRAY['products','categories','brands'] LOOP
    EXECUTE format('CREATE TRIGGER catalog_entity_guard BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION app_private.guard_entity()', target);
  END LOOP;
END $$;

CREATE FUNCTION app_private.visible(status text, archived timestamptz, reviewed timestamptz, approved timestamptz) RETURNS boolean
LANGUAGE sql IMMUTABLE SET search_path = '' AS $$
  SELECT status='published' AND archived IS NULL AND reviewed IS NOT NULL AND approved IS NOT NULL
$$;
CREATE FUNCTION app_private.taxonomy_indexable(p_status text,p_archived timestamptz,p_reviewed timestamptz,p_approved timestamptz,p_identity boolean,p_content boolean,p_optin boolean,p_description text,p_title text,p_meta text,p_canonical text,p_path text) RETURNS boolean
LANGUAGE sql IMMUTABLE SET search_path = '' AS $$
  SELECT app_private.visible(p_status,p_archived,p_reviewed,p_approved)
    AND p_identity AND p_content AND p_optin
    AND length(trim(coalesce(p_description,'')))>0 AND length(trim(coalesce(p_title,'')))>0
    AND length(trim(coalesce(p_meta,'')))>0 AND coalesce(p_canonical,p_path)=p_path
$$;
CREATE FUNCTION app_private.product_indexable(p_product_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT app_private.taxonomy_indexable(p.publication_status,p.archived_at,p.reviewed_at,p.approved_at,p.identity_verified,p.content_verified,p.indexing_approved,p.description,p.seo_title,p.seo_description,p.canonical_path,'/product/'||p.slug)
    AND length(trim(coalesce(p.sku,'')))>0
    AND EXISTS (SELECT 1 FROM public.categories c WHERE c.id=p.category_id AND app_private.visible(c.publication_status,c.archived_at,c.reviewed_at,c.approved_at))
    AND (p.brand_id IS NULL OR EXISTS (SELECT 1 FROM public.brands b WHERE b.id=p.brand_id AND app_private.visible(b.publication_status,b.archived_at,b.reviewed_at,b.approved_at)))
    AND EXISTS (SELECT 1 FROM public.product_images i JOIN public.catalog_media m ON m.id=i.media_id
      WHERE i.product_id=p.id AND i.archived_at IS NULL AND m.verified_at IS NOT NULL AND m.verified_by IS NOT NULL
        AND NOT m.is_placeholder AND length(trim(coalesce(m.alt_text,'')))>0 AND m.width>0 AND m.height>0)
  FROM public.products p WHERE p.id=p_product_id AND app_private.visible(p.publication_status,p.archived_at,p.reviewed_at,p.approved_at)
$$;

-- Raw authoring tables become staff-only. Definer views below are intentionally
-- whitelisted, security-barrier public projections with explicit publication gates.
DROP POLICY "Allow public read access on products" ON public.products;
DROP POLICY "Allow public read access on categories" ON public.categories;
DROP POLICY "Allow public read access on brands" ON public.brands;
DO $$ DECLARE target text; BEGIN
  FOREACH target IN ARRAY ARRAY['products','categories','brands','product_categories','catalog_media','product_images','product_revisions','site_settings','homepage_banners','import_jobs','import_rows','slug_redirects'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', target);
    EXECUTE format('REVOKE ALL ON public.%I FROM PUBLIC,anon,authenticated', target);
    EXECUTE format('GRANT SELECT ON public.%I TO authenticated', target);
    EXECUTE format('CREATE POLICY staff_read ON public.%I FOR SELECT TO authenticated USING (app_private.is_staff())', target);
  END LOOP;
  FOREACH target IN ARRAY ARRAY['products','categories','brands'] LOOP
    EXECUTE format('CREATE POLICY admin_insert ON public.%I FOR INSERT TO authenticated WITH CHECK (app_private.is_admin() AND publication_status=''draft'' AND reviewed_at IS NULL AND approved_at IS NULL)', target);
    EXECUTE format('CREATE POLICY admin_update ON public.%I FOR UPDATE TO authenticated USING (app_private.is_admin() AND publication_status=''draft'') WITH CHECK (app_private.is_admin() AND publication_status=''draft'')', target);
  END LOOP;
  FOREACH target IN ARRAY ARRAY['site_settings','homepage_banners','import_jobs','import_rows'] LOOP
    EXECUTE format('GRANT INSERT,UPDATE ON public.%I TO authenticated', target);
    EXECUTE format('CREATE POLICY admin_insert ON public.%I FOR INSERT TO authenticated WITH CHECK (app_private.is_admin())', target);
    EXECUTE format('CREATE POLICY admin_update ON public.%I FOR UPDATE TO authenticated USING (app_private.is_admin()) WITH CHECK (app_private.is_admin())', target);
  END LOOP;
END $$;
-- Editors can preview, but cannot mutate. Role assignment is never a client action.
GRANT INSERT(name,slug,description,category_id,brand_id,price,image_url,in_stock,is_whatsapp_inquiry,model,product_type,finish,sku,currency,sales_mode,stock_status,stock_quantity,featured,specifications,seo_title,seo_description,canonical_path),
  UPDATE(name,slug,description,category_id,brand_id,price,image_url,in_stock,is_whatsapp_inquiry,model,product_type,finish,sku,currency,sales_mode,stock_status,stock_quantity,featured,specifications,seo_title,seo_description,canonical_path) ON public.products TO authenticated;
GRANT INSERT(name,slug,description,parent_id,default_sales_mode,seo_title,seo_description,canonical_path),UPDATE(name,slug,description,parent_id,default_sales_mode,seo_title,seo_description,canonical_path) ON public.categories TO authenticated;
GRANT INSERT(name,slug,description,kind,seo_title,seo_description,canonical_path),UPDATE(name,slug,description,kind,seo_title,seo_description,canonical_path) ON public.brands TO authenticated;
GRANT INSERT(bucket_id,object_name,mime_type,alt_text,width,height,is_placeholder) ON public.catalog_media TO authenticated;
CREATE POLICY admin_media_insert ON public.catalog_media FOR INSERT TO authenticated WITH CHECK (app_private.is_admin() AND verified_at IS NULL AND verified_by IS NULL);
GRANT INSERT(product_id,media_id,sort_order), UPDATE(sort_order,archived_at) ON public.product_images TO authenticated;
CREATE POLICY admin_gallery_insert ON public.product_images FOR INSERT TO authenticated WITH CHECK (app_private.is_admin() AND EXISTS (SELECT 1 FROM public.products p WHERE p.id=product_id AND p.publication_status='draft'));
CREATE POLICY admin_gallery_update ON public.product_images FOR UPDATE TO authenticated USING (app_private.is_admin() AND EXISTS (SELECT 1 FROM public.products p WHERE p.id=product_id AND p.publication_status='draft')) WITH CHECK (app_private.is_admin() AND EXISTS (SELECT 1 FROM public.products p WHERE p.id=product_id AND p.publication_status='draft'));
GRANT INSERT(product_id,category_id) ON public.product_categories TO authenticated;
CREATE POLICY admin_category_assignment ON public.product_categories FOR INSERT TO authenticated WITH CHECK (app_private.is_admin() AND EXISTS (SELECT 1 FROM public.products p WHERE p.id=product_id AND p.publication_status='draft'));
-- Append-only revision and audit tables: no browser INSERT/UPDATE/DELETE grants.
ALTER TABLE app_private.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_private.invalidation_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON app_private.audit_log, app_private.invalidation_events FROM PUBLIC,anon,authenticated;
GRANT SELECT ON app_private.audit_log, app_private.invalidation_events TO authenticated;
CREATE POLICY admin_audit ON app_private.audit_log FOR SELECT TO authenticated USING (app_private.is_admin());
CREATE POLICY admin_outbox ON app_private.invalidation_events FOR SELECT TO authenticated USING (app_private.is_admin());

INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
VALUES ('catalog-private','catalog-private',false,20971520,ARRAY['image/jpeg','image/png','image/webp','image/avif'])
ON CONFLICT (id) DO NOTHING;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM storage.buckets WHERE id='catalog-private' AND public) THEN RAISE EXCEPTION 'catalog-private must not be public'; END IF; END $$;
CREATE POLICY catalog_private_read ON storage.objects FOR SELECT TO authenticated USING (bucket_id='catalog-private' AND app_private.is_staff());
CREATE POLICY catalog_private_upload ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id='catalog-private' AND app_private.is_admin());
-- Restrictive boundaries survive pre-existing permissive storage policies.
CREATE POLICY catalog_private_boundary ON storage.objects AS RESTRICTIVE FOR ALL TO PUBLIC
  USING (bucket_id<>'catalog-private' OR app_private.is_staff())
  WITH CHECK (bucket_id<>'catalog-private' OR app_private.is_admin());
CREATE POLICY catalog_private_no_overwrite ON storage.objects AS RESTRICTIVE FOR UPDATE TO PUBLIC
  USING (bucket_id<>'catalog-private') WITH CHECK (bucket_id<>'catalog-private');
CREATE POLICY catalog_private_no_delete ON storage.objects AS RESTRICTIVE FOR DELETE TO PUBLIC USING (bucket_id<>'catalog-private');
-- No overwrite/delete policy: replacements get new object paths and media IDs.

CREATE VIEW public.catalog_products_public WITH (security_barrier=true) AS
SELECT p.id,p.name,p.slug,p.description,p.sku,p.model,p.product_type,p.finish,p.specifications,p.category_id,p.brand_id,
  CASE WHEN EXISTS (SELECT 1 FROM public.categories c WHERE c.id=p.category_id AND c.default_sales_mode='quotation') THEN 'quotation' ELSE p.sales_mode END AS sales_mode,
  p.currency,p.featured,p.published_at,p.updated_at,p.seo_title,p.seo_description,p.canonical_path,
  CASE WHEN p.sales_mode='online' AND p.price_verified_at IS NOT NULL AND p.price>0 AND p.price::text<>'NaN' AND NOT EXISTS (SELECT 1 FROM public.categories c WHERE c.id=p.category_id AND c.default_sales_mode='quotation') THEN p.price END AS price,
  CASE WHEN p.stock_verified_at IS NOT NULL THEN p.stock_status ELSE 'unknown' END AS availability,
  app_private.product_indexable(p.id) AS is_indexable
FROM public.products p WHERE app_private.visible(p.publication_status,p.archived_at,p.reviewed_at,p.approved_at);
CREATE VIEW public.catalog_categories_public WITH (security_barrier=true) AS
SELECT id,name,slug,description,parent_id,default_sales_mode,seo_title,seo_description,canonical_path,updated_at,
  app_private.taxonomy_indexable(publication_status,archived_at,reviewed_at,approved_at,identity_verified,content_verified,indexing_approved,description,seo_title,seo_description,canonical_path,'/category/'||slug) AS is_indexable
FROM public.categories WHERE app_private.visible(publication_status,archived_at,reviewed_at,approved_at);
CREATE VIEW public.catalog_brands_public WITH (security_barrier=true) AS
SELECT id,name,slug,description,kind,seo_title,seo_description,canonical_path,updated_at,
  app_private.taxonomy_indexable(publication_status,archived_at,reviewed_at,approved_at,identity_verified,content_verified,indexing_approved,description,seo_title,seo_description,canonical_path,'/brand/'||slug) AS is_indexable
FROM public.brands WHERE app_private.visible(publication_status,archived_at,reviewed_at,approved_at);
CREATE VIEW public.catalog_images_public WITH (security_barrier=true) AS
SELECT i.product_id,m.id AS media_id,m.alt_text,m.width,m.height,m.mime_type,i.sort_order
FROM public.product_images i JOIN public.catalog_media m ON m.id=i.media_id JOIN public.catalog_products_public p ON p.id=i.product_id
WHERE i.archived_at IS NULL AND m.verified_at IS NOT NULL AND m.verified_by IS NOT NULL AND NOT m.is_placeholder;
CREATE VIEW public.catalog_routes_public WITH (security_barrier=true) AS
SELECT 'product'::text AS kind,id,name,slug,coalesce(canonical_path,'/product/'||slug) AS canonical_path,seo_title,seo_description,is_indexable,updated_at FROM public.catalog_products_public
UNION ALL SELECT 'category',id,name,slug,coalesce(canonical_path,'/category/'||slug),seo_title,seo_description,is_indexable,updated_at FROM public.catalog_categories_public
UNION ALL SELECT 'brand',id,name,slug,coalesce(canonical_path,'/brand/'||slug),seo_title,seo_description,is_indexable,updated_at FROM public.catalog_brands_public;
CREATE VIEW public.catalog_settings_public WITH (security_barrier=true) AS SELECT business_name,street_address,city,country_code,main_whatsapp,secondary_whatsapp FROM public.site_settings WHERE is_public;
CREATE VIEW public.catalog_banners_public WITH (security_barrier=true) AS
SELECT b.id,b.title,b.subtitle,b.cta_label,b.cta_path,b.media_id,b.sort_order FROM public.homepage_banners b JOIN public.catalog_media m ON m.id=b.media_id WHERE b.active AND m.verified_at IS NOT NULL AND NOT m.is_placeholder;
GRANT SELECT ON public.catalog_products_public,public.catalog_categories_public,public.catalog_brands_public,public.catalog_images_public,public.catalog_routes_public,public.catalog_settings_public,public.catalog_banners_public TO anon,authenticated;

-- Default EXECUTE privileges must not expose private trigger/predicate functions.
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA app_private FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app_private.is_staff(),app_private.is_admin() TO anon,authenticated;
GRANT EXECUTE ON FUNCTION app_private.visible(text,timestamptz,timestamptz,timestamptz),
  app_private.taxonomy_indexable(text,timestamptz,timestamptz,timestamptz,boolean,boolean,boolean,text,text,text,text,text),
  app_private.product_indexable(uuid) TO anon,authenticated;
COMMIT;
