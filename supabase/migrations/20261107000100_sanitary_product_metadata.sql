-- Optional verified catalog attributes. No product facts or prices are seeded.
-- Apply through the existing Supabase migration workflow when ready.
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS model text,
  ADD COLUMN IF NOT EXISTS product_type text,
  ADD COLUMN IF NOT EXISTS finish text;

COMMENT ON COLUMN public.products.model IS 'Verified manufacturer model, nullable when unknown';
COMMENT ON COLUMN public.products.product_type IS 'Verified shopping product type, nullable when unknown';
COMMENT ON COLUMN public.products.finish IS 'Verified manufacturer finish, nullable when unknown';
