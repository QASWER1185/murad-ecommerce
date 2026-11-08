-- Phase 7: local capacity rehearsal exposed pathological nested-loop plans
-- across the existing security-barrier views. Keep their exact projections,
-- publication predicates, RLS and single-statement snapshot unchanged.
BEGIN;
DO $$ BEGIN IF current_setting('app.catalog_cutover_approved',true) IS DISTINCT FROM 'yes' THEN RAISE EXCEPTION 'Catalog cutover not approved'; END IF; END $$;
-- Scope planner settings to this read-only RPC and its nested SQL only. Do not
-- change global database settings or mark security functions leakproof/immutable.
-- Disabling JIT avoids compilation overhead for these short web requests.
ALTER FUNCTION public.catalog_storefront(text,text,jsonb) SET enable_nestloop=off;
ALTER FUNCTION public.catalog_storefront(text,text,jsonb) SET jit=off;
COMMIT;
