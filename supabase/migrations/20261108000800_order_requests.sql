-- Phase 6. Apply only to an isolated, explicitly approved environment.
BEGIN;
DO $$ BEGIN IF current_setting('app.catalog_cutover_approved',true) IS DISTINCT FROM 'yes' THEN RAISE EXCEPTION 'Catalog cutover not approved'; END IF; END $$;
CREATE TABLE app_private.order_gateway_keys(
 key_id text PRIMARY KEY CHECK(key_id ~ '^[a-z0-9-]{1,40}$'),
 signing_secret text NOT NULL CHECK(length(signing_secret)>=64),
 origin text NOT NULL, active boolean NOT NULL DEFAULT true,created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE app_private.order_rate_windows(bucket_key text PRIMARY KEY,started_at timestamptz NOT NULL,attempts integer NOT NULL);
ALTER TABLE app_private.order_gateway_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_private.order_rate_windows ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON app_private.order_gateway_keys,app_private.order_rate_windows FROM PUBLIC,anon,authenticated;

CREATE TABLE public.order_requests(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),reference text NOT NULL UNIQUE,
 guest_hash text NOT NULL CHECK(guest_hash ~ '^[a-f0-9]{64}$'),idempotency_key uuid NOT NULL UNIQUE,payload_hash text NOT NULL,
 request_kind text NOT NULL CHECK(request_kind IN ('order','quotation','mixed')),
 request_status text NOT NULL DEFAULT 'received' CHECK(request_status IN ('received','in_review','awaiting_customer','quoted','closed','cancelled')),
 customer_name text NOT NULL CHECK(length(customer_name) BETWEEN 2 AND 100),customer_phone text NOT NULL CHECK(customer_phone ~ '^\+[1-9][0-9]{6,14}$'),
 customer_note text CHECK(length(customer_note)<=500),consent_version text NOT NULL DEFAULT 'request-contact-v1',
 snapshot_version integer NOT NULL DEFAULT 1 CHECK(snapshot_version=1),known_subtotals jsonb NOT NULL,
 version bigint NOT NULL DEFAULT 1,created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(guest_hash,idempotency_key)
);
CREATE TABLE public.order_request_items(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),request_id uuid NOT NULL REFERENCES public.order_requests(id) ON DELETE RESTRICT,
 product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,quantity integer NOT NULL CHECK(quantity BETWEEN 1 AND 999),
 product_version bigint NOT NULL,product_snapshot jsonb NOT NULL,
 pricing_mode text NOT NULL CHECK(pricing_mode IN ('listed','quotation')),currency text NOT NULL,
 unit_price numeric(12,2),line_subtotal numeric(18,2),UNIQUE(request_id,product_id),
 CHECK((pricing_mode='quotation' AND unit_price IS NULL AND line_subtotal IS NULL) OR (pricing_mode='listed' AND unit_price IS NOT NULL AND line_subtotal IS NOT NULL AND unit_price>0 AND line_subtotal=unit_price*quantity))
);
CREATE TABLE public.order_request_events(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),request_id uuid NOT NULL REFERENCES public.order_requests(id) ON DELETE RESTRICT,
 from_status text,to_status text NOT NULL,request_version bigint NOT NULL,note text CHECK(length(note)<=500),
 actor_id uuid REFERENCES auth.users(id) ON DELETE RESTRICT,created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX order_requests_recent ON public.order_requests(created_at DESC,id);
CREATE INDEX order_requests_status ON public.order_requests(request_status,created_at DESC);
CREATE INDEX order_requests_kind ON public.order_requests(request_kind,created_at DESC);
CREATE INDEX order_events_request ON public.order_request_events(request_id,created_at,id);
DO $$ DECLARE t text; BEGIN FOREACH t IN ARRAY ARRAY['order_requests','order_request_items','order_request_events'] LOOP
 EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t);
 EXECUTE format('REVOKE ALL ON public.%I FROM PUBLIC,anon,authenticated',t);
 EXECUTE format('GRANT SELECT ON public.%I TO authenticated',t);
 EXECUTE format('CREATE POLICY orders_admin_read ON public.%I FOR SELECT TO authenticated USING(app_private.is_admin())',t);
END LOOP;END $$;

-- Portable HMAC-SHA256 using built-in PostgreSQL sha256; no extension/search_path dependency.
CREATE FUNCTION app_private.order_hmac(p_message text,p_secret text) RETURNS text LANGUAGE plpgsql IMMUTABLE SET search_path='' AS $$
DECLARE k bytea:=convert_to(p_secret,'UTF8');ip bytea:=decode(repeat('00',64),'hex');op bytea:=ip;i integer;b integer;BEGIN
 IF octet_length(k)>64 THEN k:=sha256(k);END IF;
 FOR i IN 0..63 LOOP b:=CASE WHEN i<octet_length(k) THEN get_byte(k,i) ELSE 0 END;ip:=set_byte(ip,i,b # 54);op:=set_byte(op,i,b # 92);END LOOP;
 RETURN encode(sha256(op||sha256(ip||convert_to(p_message,'UTF8'))),'hex');
END $$;
CREATE FUNCTION app_private.order_signature_equal(a text,b text) RETURNS boolean LANGUAGE plpgsql IMMUTABLE SET search_path='' AS $$
DECLARE delta integer:=0;i integer;BEGIN
 IF a IS NULL OR b IS NULL OR length(a)<>64 OR length(b)<>64 THEN RETURN false;END IF;
 FOR i IN 1..64 LOOP delta:=delta | (ascii(substr(a,i,1)) # ascii(substr(b,i,1)));END LOOP;RETURN delta=0;
END $$;
CREATE FUNCTION app_private.order_product_token(p public.catalog_products_public) RETURNS text LANGUAGE sql IMMUTABLE SET search_path='' AS $$
 SELECT encode(sha256(convert_to(to_jsonb(p)::text,'UTF8')),'hex')
$$;
CREATE FUNCTION public.catalog_order_preview(p_ids uuid[]) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$ BEGIN
 IF p_ids IS NULL OR cardinality(p_ids)>50 THEN RAISE EXCEPTION 'ORDER_INVALID_SELECTION';END IF;
 RETURN coalesce((SELECT jsonb_agg(app_private.storefront_product(p)||jsonb_build_object('order_token',app_private.order_product_token(p)) ORDER BY p.id) FROM public.catalog_products_public p WHERE p.id=ANY(p_ids)),'[]'::jsonb);
END $$;
REVOKE ALL ON FUNCTION public.catalog_order_preview(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.catalog_order_preview(uuid[]) TO anon,authenticated;
CREATE FUNCTION app_private.order_rate(p_key text,p_limit integer,p_seconds integer) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE n integer;BEGIN
 INSERT INTO app_private.order_rate_windows(bucket_key,started_at,attempts) VALUES(p_key,now(),1)
 ON CONFLICT(bucket_key) DO UPDATE SET started_at=CASE WHEN order_rate_windows.started_at<=now()-make_interval(secs=>p_seconds) THEN now() ELSE order_rate_windows.started_at END,
 attempts=CASE WHEN order_rate_windows.started_at<=now()-make_interval(secs=>p_seconds) THEN 1 ELSE order_rate_windows.attempts+1 END RETURNING attempts INTO n;
 RETURN n<=p_limit;
END $$;
CREATE FUNCTION app_private.order_receipt(p public.order_requests) RETURNS jsonb LANGUAGE sql IMMUTABLE SET search_path='' AS $$
 SELECT jsonb_build_object('reference',p.reference,'kind',p.request_kind,'submitted_at',p.created_at,'request_received',true)
$$;

-- Anonymous EXECUTE is safe only with this server proof. No public insert grant,
-- service role, browser-selected role, or public customer-detail lookup is added.
CREATE FUNCTION public.order_request_gateway(p_envelope text,p_signature text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE e jsonb;k app_private.order_gateway_keys;body jsonb;guest text;nonce uuid;old public.order_requests;r public.order_requests;
 item jsonb;p public.catalog_products_public;author public.products;hash text;quote_count integer:=0;line_count integer;new_id uuid;ref text;token text;qty integer;mode text;unit numeric;locked uuid;attempt integer;
BEGIN
 IF p_envelope IS NULL OR octet_length(p_envelope)>65536 THEN RAISE EXCEPTION 'ORDER_INVALID_REQUEST';END IF;
 BEGIN e:=p_envelope::jsonb;EXCEPTION WHEN OTHERS THEN RAISE EXCEPTION 'ORDER_INVALID_REQUEST';END;
 SELECT * INTO k FROM app_private.order_gateway_keys WHERE key_id=e->>'key_id' AND active;
 IF NOT FOUND OR NOT app_private.order_signature_equal(p_signature,app_private.order_hmac(p_envelope,k.signing_secret)) OR e->>'origin' IS DISTINCT FROM k.origin THEN RAISE EXCEPTION 'ORDER_GATEWAY_DENIED' USING ERRCODE='42501';END IF;
 IF coalesce(e->>'issued_at','') !~ '^[0-9]{10}$' OR abs(extract(epoch FROM clock_timestamp())-(e->>'issued_at')::bigint)>120 THEN RAISE EXCEPTION 'ORDER_GATEWAY_EXPIRED' USING ERRCODE='42501';END IF;
 guest:=e->>'guest_hash';IF guest IS NULL OR guest !~ '^[a-f0-9]{64}$' THEN RAISE EXCEPTION 'ORDER_INVALID_REQUEST';END IF;
 body:=e->'request';nonce:=(body->>'idempotency_key')::uuid;
 IF nonce IS NULL THEN RAISE EXCEPTION 'ORDER_INVALID_REQUEST';END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('order-request:'||nonce::text,0));
 SELECT * INTO old FROM public.order_requests WHERE idempotency_key=nonce;
 IF old.id IS NOT NULL AND old.guest_hash<>guest THEN
  IF e->>'action'='receipt' THEN RETURN NULL;END IF;
  RAISE EXCEPTION 'ORDER_IDEMPOTENCY_CONFLICT' USING ERRCODE='40001';
 END IF;
 IF e->>'action'='receipt' THEN RETURN CASE WHEN old.id IS NOT NULL THEN app_private.order_receipt(old) END;END IF;
 IF e->>'action' IS DISTINCT FROM 'submit' THEN RAISE EXCEPTION 'ORDER_INVALID_REQUEST';END IF;
 IF jsonb_typeof(body)<>'object' OR EXISTS(SELECT 1 FROM jsonb_object_keys(body) f WHERE f NOT IN ('idempotency_key','customer_name','customer_phone','customer_note','consent','intent','items'))
 OR length(trim(coalesce(body->>'customer_name',''))) NOT BETWEEN 2 AND 100 OR coalesce(body->>'customer_phone','') !~ '^\+[1-9][0-9]{6,14}$'
 OR length(coalesce(body->>'customer_note',''))>500 OR body->>'consent' IS DISTINCT FROM 'true' OR coalesce(body->>'intent','') NOT IN ('order','quotation') THEN RAISE EXCEPTION 'ORDER_INVALID_REQUEST';END IF;
 hash:=encode(sha256(convert_to(body::text,'UTF8')),'hex');
 IF old.id IS NOT NULL THEN IF old.payload_hash<>hash THEN RAISE EXCEPTION 'ORDER_IDEMPOTENCY_CONFLICT' USING ERRCODE='40001';END IF;RETURN app_private.order_receipt(old);END IF;
 IF coalesce(e->>'contact_hash','') !~ '^[a-f0-9]{64}$' THEN RAISE EXCEPTION 'ORDER_INVALID_REQUEST';END IF;
 IF NOT app_private.order_rate('guest:'||guest,5,900) OR NOT app_private.order_rate('contact:'||(e->>'contact_hash'),5,3600) OR NOT app_private.order_rate('global',100,60)
 OR (coalesce(e->>'ip_hash','')<>'' AND NOT app_private.order_rate('ip:'||(e->>'ip_hash'),20,900)) THEN RETURN jsonb_build_object('error','ORDER_RATE_LIMIT');END IF;
 -- The exception block retains rate accounting even for invalid/stale selections.
 BEGIN
 IF jsonb_typeof(body->'items') IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'ORDER_INVALID_SELECTION';END IF;
 line_count:=jsonb_array_length(body->'items');IF line_count NOT BETWEEN 1 AND 50 THEN RAISE EXCEPTION 'ORDER_INVALID_SELECTION';END IF;
 IF (SELECT count(DISTINCT x->>'product_id') FROM jsonb_array_elements(body->'items') x)<>line_count THEN RAISE EXCEPTION 'ORDER_INVALID_SELECTION';END IF;
 FOR item IN SELECT value FROM jsonb_array_elements(body->'items') LOOP
 IF jsonb_typeof(item)<>'object' OR EXISTS(SELECT 1 FROM jsonb_object_keys(item) f WHERE f NOT IN ('product_id','quantity','order_token')) OR coalesce(item->>'quantity','') !~ '^[1-9][0-9]{0,2}$' OR coalesce(item->>'order_token','') !~ '^[a-f0-9]{64}$' THEN RAISE EXCEPTION 'ORDER_INVALID_SELECTION';END IF;
 END LOOP;
 -- Lock every catalog dependency in stable table/id order until request commit.
 FOR locked IN WITH RECURSIVE ancestors AS(
 SELECT c.id,c.parent_id FROM public.categories c JOIN public.products locked_product ON locked_product.category_id=c.id WHERE locked_product.id IN(SELECT (x->>'product_id')::uuid FROM jsonb_array_elements(body->'items') x)
 UNION SELECT c.id,c.parent_id FROM public.categories c JOIN ancestors a ON c.id=a.parent_id)
 SELECT c.id FROM public.categories c WHERE c.id IN(SELECT a.id FROM ancestors a) ORDER BY c.id FOR SHARE LOOP NULL;END LOOP;
 FOR locked IN SELECT b.id FROM public.brands b WHERE b.id IN(SELECT locked_product.brand_id FROM public.products locked_product WHERE locked_product.id IN(SELECT (x->>'product_id')::uuid FROM jsonb_array_elements(body->'items') x)) ORDER BY b.id FOR SHARE LOOP NULL;END LOOP;
 FOR locked IN SELECT locked_product.id FROM public.products locked_product WHERE locked_product.id IN(SELECT (x->>'product_id')::uuid FROM jsonb_array_elements(body->'items') x) ORDER BY locked_product.id FOR SHARE LOOP NULL;END LOOP;
 FOR item IN SELECT value FROM jsonb_array_elements(body->'items') LOOP
 SELECT * INTO p FROM public.catalog_products_public WHERE id=(item->>'product_id')::uuid;
 IF NOT FOUND OR p.availability='out_of_stock' THEN RAISE EXCEPTION 'ORDER_UNAVAILABLE';END IF;
 IF app_private.order_product_token(p)<>item->>'order_token' THEN RAISE EXCEPTION 'ORDER_SELECTION_CHANGED' USING ERRCODE='40001';END IF;
 IF body->>'intent'='quotation' OR p.sales_mode='quotation' OR p.price IS NULL THEN quote_count:=quote_count+1;END IF;
 END LOOP;
 FOR attempt IN 1..3 LOOP
 new_id:=gen_random_uuid();ref:='MMS-'||to_char(now() AT TIME ZONE 'UTC','YYYYMMDD')||'-'||upper(left(replace(new_id::text,'-',''),12));
 INSERT INTO public.order_requests(id,reference,guest_hash,idempotency_key,payload_hash,request_kind,customer_name,customer_phone,customer_note,known_subtotals)
 VALUES(new_id,ref,guest,nonce,hash,CASE WHEN quote_count=line_count THEN 'quotation' WHEN quote_count>0 THEN 'mixed' ELSE 'order' END,trim(body->>'customer_name'),body->>'customer_phone',nullif(trim(body->>'customer_note'),''),'{}') ON CONFLICT(reference) DO NOTHING RETURNING * INTO r;
 EXIT WHEN r.id IS NOT NULL;END LOOP;
 IF r.id IS NULL THEN RAISE EXCEPTION 'ORDER_UNAVAILABLE';END IF;
 FOR item IN SELECT value FROM jsonb_array_elements(body->'items') LOOP
 SELECT * INTO p FROM public.catalog_products_public WHERE id=(item->>'product_id')::uuid;SELECT * INTO author FROM public.products WHERE id=p.id;
 qty:=(item->>'quantity')::integer;mode:=CASE WHEN body->>'intent'='quotation' OR p.sales_mode='quotation' OR p.price IS NULL THEN 'quotation' ELSE 'listed' END;unit:=CASE WHEN mode='listed' THEN p.price END;
 INSERT INTO public.order_request_items(request_id,product_id,quantity,product_version,product_snapshot,pricing_mode,currency,unit_price,line_subtotal)
 VALUES(r.id,p.id,qty,author.version,jsonb_build_object('snapshot_version',1,'name',p.name,'slug',p.slug,'sku',p.sku,'model',p.model,'availability',p.availability,'sales_mode',p.sales_mode,'catalog_updated_at',p.updated_at,'price_verified_at',author.price_verified_at,'stock_verified_at',author.stock_verified_at,'order_token',app_private.order_product_token(p)),mode,p.currency,unit,unit*qty);
 END LOOP;
 UPDATE public.order_requests SET known_subtotals=coalesce((SELECT jsonb_object_agg(currency,amount) FROM(SELECT currency,sum(line_subtotal) AS amount FROM public.order_request_items WHERE request_id=r.id AND pricing_mode='listed' GROUP BY currency) totals),'{}'::jsonb) WHERE id=r.id RETURNING * INTO r;
 INSERT INTO public.order_request_events(request_id,to_status,request_version) VALUES(r.id,'received',1);
 INSERT INTO app_private.audit_log(entity_type,entity_id,action,after_data) VALUES('order_requests',r.id,'request_submitted',jsonb_build_object('kind',r.request_kind,'status','received','version',1,'line_count',line_count));
 RETURN app_private.order_receipt(r);
 EXCEPTION WHEN SQLSTATE '40001' THEN RETURN jsonb_build_object('error','ORDER_SELECTION_CHANGED');WHEN OTHERS THEN
 IF SQLERRM IN ('ORDER_INVALID_SELECTION','ORDER_UNAVAILABLE') THEN RETURN jsonb_build_object('error',SQLERRM);END IF;RETURN jsonb_build_object('error','ORDER_INVALID_SELECTION');
 END;
END $$;
REVOKE ALL ON FUNCTION public.order_request_gateway(text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.order_request_gateway(text,text) TO anon,authenticated;

CREATE FUNCTION public.admin_order_requests(p_filters jsonb DEFAULT '{}'::jsonb) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE result jsonb;query text;page_no integer;BEGIN
 PERFORM app_private.require_admin();IF p_filters IS NULL OR jsonb_typeof(p_filters)<>'object' THEN RAISE EXCEPTION 'ORDER_INVALID_FILTER';END IF;
 query:=lower(trim(coalesce(p_filters->>'query','')));page_no:=coalesce((p_filters->>'page')::integer,1);
 IF length(query)>100 OR page_no NOT BETWEEN 1 AND 10000 THEN RAISE EXCEPTION 'ORDER_INVALID_FILTER';END IF;
 WITH filtered AS(SELECT r.* FROM public.order_requests r WHERE
 (query='' OR strpos(lower(r.reference),query)>0 OR strpos(lower(r.customer_name),query)>0 OR strpos(r.customer_phone,query)>0)
 AND (coalesce(p_filters->>'status','')='' OR r.request_status=p_filters->>'status')
 AND (coalesce(p_filters->>'kind','')='' OR r.request_kind=p_filters->>'kind' OR (p_filters->>'kind'='quotation' AND r.request_kind='mixed'))),rows AS(
 SELECT id,reference,request_kind,request_status,customer_name,version,created_at FROM filtered ORDER BY created_at DESC,id LIMIT 25 OFFSET (page_no-1)*25)
 SELECT jsonb_build_object('rows',coalesce((SELECT jsonb_agg(to_jsonb(t)) FROM rows t),'[]'::jsonb),'total',(SELECT count(*) FROM filtered),'page',page_no,
 'report',jsonb_build_object('received_today',(SELECT count(*) FROM public.order_requests WHERE created_at>=(date_trunc('day',now() AT TIME ZONE 'Asia/Karachi') AT TIME ZONE 'Asia/Karachi')),
 'open_requests',(SELECT count(*) FROM public.order_requests WHERE request_status NOT IN ('closed','cancelled')),
 'quotation_requests',(SELECT count(*) FROM public.order_requests WHERE request_kind IN ('quotation','mixed')),
 'closed_requests',(SELECT count(*) FROM public.order_requests WHERE request_status='closed'))) INTO result;RETURN result;
END $$;
CREATE FUNCTION public.admin_order_request(p_id uuid) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$ BEGIN
 PERFORM app_private.require_admin();RETURN(SELECT to_jsonb(r)-'guest_hash'-'payload_hash'-'idempotency_key'||jsonb_build_object(
 'items',coalesce((SELECT jsonb_agg(to_jsonb(i) ORDER BY i.id) FROM public.order_request_items i WHERE i.request_id=r.id),'[]'::jsonb),
 'history',coalesce((SELECT jsonb_agg(to_jsonb(e) ORDER BY e.created_at,e.id) FROM public.order_request_events e WHERE e.request_id=r.id),'[]'::jsonb)) FROM public.order_requests r WHERE r.id=p_id);
END $$;
CREATE FUNCTION public.update_order_request_status(p_id uuid,p_version bigint,p_status text,p_note text,p_confirm boolean) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE r public.order_requests;previous text;BEGIN
 PERFORM app_private.require_admin();IF p_confirm IS DISTINCT FROM true OR length(coalesce(p_note,''))>500 THEN RAISE EXCEPTION 'ORDER_EXPLICIT_CONFIRMATION_REQUIRED';END IF;
 SELECT * INTO r FROM public.order_requests WHERE id=p_id FOR UPDATE;
 IF NOT FOUND OR p_version IS NULL OR r.version<>p_version THEN RAISE EXCEPTION 'ORDER_STALE_VERSION' USING ERRCODE='40001';END IF;
 IF p_status IS NULL OR p_status NOT IN ('in_review','awaiting_customer','quoted','closed','cancelled') OR p_status=r.request_status OR r.request_status IN ('closed','cancelled')
 OR (p_status='quoted' AND r.request_kind='order') OR (r.request_status='received' AND p_status NOT IN ('in_review','cancelled')) THEN RAISE EXCEPTION 'ORDER_INVALID_TRANSITION';END IF;
 previous:=r.request_status;UPDATE public.order_requests SET request_status=p_status,version=version+1,updated_at=now() WHERE id=r.id RETURNING * INTO r;
 INSERT INTO public.order_request_events(request_id,from_status,to_status,request_version,note,actor_id) VALUES(r.id,previous,r.request_status,r.version,nullif(trim(p_note),''),auth.uid());
 INSERT INTO app_private.audit_log(entity_type,entity_id,action,actor_id,before_data,after_data) VALUES('order_requests',r.id,'request_status',auth.uid(),jsonb_build_object('status',previous,'version',p_version),jsonb_build_object('status',r.request_status,'version',r.version));
 RETURN jsonb_build_object('version',r.version,'status',r.request_status);
END $$;
REVOKE ALL ON FUNCTION public.admin_order_requests(jsonb),public.admin_order_request(uuid),public.update_order_request_status(uuid,bigint,text,text,boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_order_requests(jsonb),public.admin_order_request(uuid),public.update_order_request_status(uuid,bigint,text,text,boolean) TO authenticated;
REVOKE ALL ON FUNCTION app_private.order_hmac(text,text),app_private.order_signature_equal(text,text),app_private.order_product_token(public.catalog_products_public),app_private.order_rate(text,integer,integer),app_private.order_receipt(public.order_requests) FROM PUBLIC;
COMMIT;
