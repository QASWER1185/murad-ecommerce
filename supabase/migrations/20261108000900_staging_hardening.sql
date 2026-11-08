-- Phase 7: additive only. Empty worker keyring; no accounts or credentials provisioned.
BEGIN;
DO $$ BEGIN IF current_setting('app.catalog_cutover_approved',true) IS DISTINCT FROM 'yes' THEN RAISE EXCEPTION 'Catalog cutover not approved'; END IF; END $$;
CREATE TABLE app_private.catalog_security_policy(
 singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton),
 require_mfa boolean NOT NULL DEFAULT false
);
INSERT INTO app_private.catalog_security_policy VALUES(true,false);
ALTER TABLE app_private.catalog_security_policy ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON app_private.catalog_security_policy FROM PUBLIC,anon,authenticated;
-- Read only the gateway-validated JWT claims. Never consult user_metadata.
CREATE FUNCTION app_private.catalog_aal() RETURNS text LANGUAGE sql STABLE SET search_path='' AS $$
 SELECT coalesce(nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'aal','aal1')
$$;
REVOKE ALL ON FUNCTION app_private.catalog_aal() FROM PUBLIC;
CREATE OR REPLACE FUNCTION app_private.is_staff() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT coalesce(public.current_catalog_role() IN ('admin','editor'),false)
 AND (NOT (SELECT require_mfa FROM app_private.catalog_security_policy WHERE singleton) OR app_private.catalog_aal()='aal2')
$$;
CREATE OR REPLACE FUNCTION app_private.is_admin() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT coalesce(public.current_catalog_role()='admin',false)
 AND (NOT (SELECT require_mfa FROM app_private.catalog_security_policy WHERE singleton) OR app_private.catalog_aal()='aal2')
$$;
-- Minimal step-up information only. Does not grant access to authoring data.
CREATE FUNCTION public.catalog_session_access() RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT jsonb_build_object('role',public.current_catalog_role(),'aal',app_private.catalog_aal(),
 'mfa_required',(SELECT require_mfa FROM app_private.catalog_security_policy WHERE singleton))
 WHERE auth.uid() IS NOT NULL
$$;
REVOKE ALL ON FUNCTION public.catalog_session_access() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.catalog_session_access() TO authenticated;
CREATE TABLE app_private.catalog_worker_keys(
 key_id text PRIMARY KEY CHECK(key_id ~ '^[a-z0-9-]{1,40}$'),
 signing_secret text NOT NULL CHECK(length(signing_secret)>=64),
 origin text NOT NULL CHECK(origin ~ '^https?://[^/]+$'),
 active boolean NOT NULL DEFAULT true,created_at timestamptz NOT NULL DEFAULT now(),
 last_seen_at timestamptz,last_claim_at timestamptz,last_ack_at timestamptz
);
CREATE TABLE app_private.catalog_worker_nonces(
 key_id text NOT NULL REFERENCES app_private.catalog_worker_keys(key_id),
 nonce uuid NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),PRIMARY KEY(key_id,nonce)
);
CREATE INDEX catalog_worker_nonce_expiry ON app_private.catalog_worker_nonces(created_at);
ALTER TABLE app_private.catalog_worker_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_private.catalog_worker_nonces ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON app_private.catalog_worker_keys,app_private.catalog_worker_nonces FROM PUBLIC,anon,authenticated;
CREATE INDEX catalog_outbox_pending ON app_private.invalidation_events(id) WHERE processed_at IS NULL;
-- One capability: lease/ack catalog invalidations and read aggregate queue health.
-- HMAC domain separation prevents reusing an order-gateway signature here.
CREATE FUNCTION public.catalog_worker_gateway(p_envelope text,p_signature text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE e jsonb;k app_private.catalog_worker_keys;a text;n uuid;result jsonb;lim integer;affected integer;
BEGIN
 IF p_envelope IS NULL OR octet_length(p_envelope)>4096 THEN RAISE EXCEPTION 'WORKER_DENIED' USING ERRCODE='42501';END IF;
 BEGIN e:=p_envelope::jsonb;n:=(e->>'nonce')::uuid;
 EXCEPTION WHEN OTHERS THEN RAISE EXCEPTION 'WORKER_DENIED' USING ERRCODE='42501';END;
 IF e->>'v' IS DISTINCT FROM 'catalog-worker-v1' OR n IS NULL OR coalesce(e->>'issued','') !~ '^[0-9]{10}$' THEN RAISE EXCEPTION 'WORKER_DENIED' USING ERRCODE='42501';END IF;
 IF abs(extract(epoch FROM clock_timestamp())-(e->>'issued')::bigint)>60 THEN RAISE EXCEPTION 'WORKER_EXPIRED' USING ERRCODE='42501';END IF;
 SELECT * INTO k FROM app_private.catalog_worker_keys WHERE key_id=e->>'key_id' AND active FOR UPDATE;
 -- Serialize the tiny signed transaction per credential: avoids lock-upgrade
 -- deadlocks when updating its heartbeat and makes revocation transactional.
 IF NOT FOUND OR e->>'origin' IS DISTINCT FROM k.origin OR NOT app_private.order_signature_equal(p_signature,app_private.order_hmac('catalog-worker-v1:'||p_envelope,k.signing_secret)) THEN RAISE EXCEPTION 'WORKER_DENIED' USING ERRCODE='42501';END IF;
 a:=e->>'action';
 IF a NOT IN ('claim','ack','stats') OR a IS NULL THEN RAISE EXCEPTION 'WORKER_DENIED' USING ERRCODE='42501';END IF;
 INSERT INTO app_private.catalog_worker_nonces(key_id,nonce) VALUES(k.key_id,n) ON CONFLICT DO NOTHING;
 GET DIAGNOSTICS affected=ROW_COUNT;IF affected<>1 THEN RAISE EXCEPTION 'WORKER_REPLAY' USING ERRCODE='42501';END IF;
 DELETE FROM app_private.catalog_worker_nonces WHERE (key_id,nonce) IN (SELECT key_id,nonce FROM app_private.catalog_worker_nonces WHERE created_at<now()-interval '5 minutes' ORDER BY created_at LIMIT 1000);
 UPDATE app_private.catalog_worker_keys SET last_seen_at=now() WHERE key_id=k.key_id;
 IF a='claim' THEN
  lim:=coalesce((e->>'limit')::integer,25);IF lim NOT BETWEEN 1 AND 25 THEN RAISE EXCEPTION 'Bounded worker batch required';END IF;
  WITH selected AS (SELECT id FROM app_private.invalidation_events WHERE processed_at IS NULL AND (lease_until IS NULL OR lease_until<now()) ORDER BY id FOR UPDATE SKIP LOCKED LIMIT lim),claimed AS (
   UPDATE app_private.invalidation_events x SET lease_token=gen_random_uuid(),lease_until=now()+interval '2 minutes',attempts=attempts+1 FROM selected s WHERE x.id=s.id RETURNING x.id,x.lease_token)
  SELECT coalesce(jsonb_agg(jsonb_build_object('id',id::text,'token',lease_token) ORDER BY id),'[]'::jsonb) INTO result FROM claimed;
  UPDATE app_private.catalog_worker_keys SET last_claim_at=now() WHERE key_id=k.key_id;
  RETURN result;
 ELSIF a='ack' THEN
  IF e->>'outcome' NOT IN ('ok','retry') OR e->>'outcome' IS NULL THEN RAISE EXCEPTION 'Invalid worker outcome';END IF;
  UPDATE app_private.invalidation_events SET processed_at=CASE WHEN e->>'outcome'='ok' THEN now() END,
   last_error=CASE WHEN e->>'outcome'='retry' THEN 'Framework invalidation failed' END,lease_token=NULL,
   lease_until=CASE WHEN e->>'outcome'='retry' THEN now()+interval '15 seconds' END
  WHERE id=(e->>'id')::bigint AND lease_token=(e->>'token')::uuid AND lease_until>=now() AND processed_at IS NULL;
  GET DIAGNOSTICS affected=ROW_COUNT;
  UPDATE app_private.catalog_worker_keys SET last_ack_at=now() WHERE key_id=k.key_id AND affected=1;
  RETURN to_jsonb(affected=1);
 ELSE
  SELECT jsonb_build_object('pending',count(*),'retrying',count(*) FILTER(WHERE attempts>=5),
   'oldest_seconds',coalesce(floor(extract(epoch FROM now()-min(created_at))),0),
   'leased',count(*) FILTER(WHERE lease_until>=now())) INTO result FROM app_private.invalidation_events WHERE processed_at IS NULL;
  RETURN result;
 END IF;
END $$;
REVOKE ALL ON FUNCTION public.catalog_worker_gateway(text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.catalog_worker_gateway(text,text) TO anon,authenticated;
-- Audit operator policy/key changes without ever copying signing material.
CREATE FUNCTION app_private.audit_catalog_security() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE before_safe jsonb;after_safe jsonb;identity uuid;BEGIN
 IF TG_TABLE_NAME='catalog_security_policy' THEN
  IF OLD.require_mfa IS NOT DISTINCT FROM NEW.require_mfa THEN RETURN NEW;END IF;
  identity:='f0000000-0000-0000-0000-000000000007'::uuid;
  before_safe:=jsonb_build_object('require_mfa',OLD.require_mfa);
  after_safe:=jsonb_build_object('require_mfa',NEW.require_mfa);
 ELSE
  IF TG_OP='UPDATE' THEN
   IF OLD.active=NEW.active AND OLD.signing_secret=NEW.signing_secret AND OLD.origin=NEW.origin THEN RETURN NEW;END IF;
   before_safe:=jsonb_build_object('key_id',OLD.key_id,'active',OLD.active);
  END IF;
  identity:=md5('catalog-worker:'||NEW.key_id)::uuid;
  after_safe:=jsonb_build_object('key_id',NEW.key_id,'active',NEW.active,'credential_changed',true);
 END IF;
 INSERT INTO app_private.audit_log(entity_type,entity_id,action,actor_id,before_data,after_data)
 VALUES(TG_TABLE_NAME,identity,'SECURITY_'||TG_OP,auth.uid(),before_safe,after_safe);
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION app_private.audit_catalog_security() FROM PUBLIC;
CREATE TRIGGER catalog_mfa_policy_audit AFTER UPDATE ON app_private.catalog_security_policy FOR EACH ROW EXECUTE FUNCTION app_private.audit_catalog_security();
CREATE TRIGGER catalog_worker_key_audit AFTER INSERT OR UPDATE ON app_private.catalog_worker_keys FOR EACH ROW EXECUTE FUNCTION app_private.audit_catalog_security();
COMMENT ON TABLE app_private.catalog_security_policy IS 'Operator-controlled MFA activation only after verified TOTP enrollment/recovery rehearsal. Default false preserves existing accounts; not production-ready until enabled.';
COMMENT ON FUNCTION public.catalog_worker_gateway(text,text) IS 'Dedicated machine capability only; empty keyring until separately authorized operator provisioning. No product, role, media or customer access.';
COMMIT;
