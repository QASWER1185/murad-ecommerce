-- 1. Create Categories Table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Create Brands Table
CREATE TABLE IF NOT EXISTS brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Create Products Table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  image_url TEXT,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  brand_id UUID REFERENCES brands(id) ON DELETE SET NULL,
  is_whatsapp_inquiry BOOLEAN NOT NULL DEFAULT false,
  in_stock BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- 5. Create Policies for Public Read Access (SELECT)
CREATE POLICY "Allow public read access on categories"
ON categories FOR SELECT
USING (true);

CREATE POLICY "Allow public read access on brands"
ON brands FOR SELECT
USING (true);

CREATE POLICY "Allow public read access on products"
ON products FOR SELECT
USING (true);

-- 6. Insert Initial Categories
INSERT INTO categories (name, slug)
VALUES
  ('Sanitary', 'sanitary'),
  ('Electric', 'electric'),
  ('Building Material', 'building-material')
ON CONFLICT (slug) DO NOTHING;

-- 7. Insert Initial Brands
INSERT INTO brands (name, slug)
VALUES
  ('Porta', 'porta'),
  ('Faisal Sanitary', 'faisal-sanitary'),
  ('Dell Ceramics', 'dell-ceramics'),
  ('Imported China', 'imported-china'),
  ('GM Cables', 'gm-cables'),
  ('New Age Cables', 'new-age-cables'),
  ('Bestway Cement', 'bestway-cement')
ON CONFLICT (slug) DO NOTHING;

