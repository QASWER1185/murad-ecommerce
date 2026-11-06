-- Seed Initial Inventory Products for M Murad Sons Traders
INSERT INTO products (
  name,
  slug,
  description,
  price,
  category_id,
  brand_id,
  in_stock,
  is_whatsapp_inquiry
)
VALUES
  (
    'GM Cable 3/29 Coil',
    'gm-cable-3-29',
    'High-conductivity 99.9% pure copper 3/29 single-core cable coil by GM Cables. Ideal for domestic wiring and general power points.',
    5000,
    (SELECT id FROM categories WHERE slug = 'electric' LIMIT 1),
    (SELECT id FROM brands WHERE slug = 'gm-cables' LIMIT 1),
    true,
    false
  ),
  (
    'New Age Cable 7/29 Coil',
    'new-age-cable-7-29',
    'Heavy-duty 7/29 pure copper insulated cable coil by New Age Cables. Recommended for main line distribution and air conditioner circuits.',
    8500,
    (SELECT id FROM categories WHERE slug = 'electric' LIMIT 1),
    (SELECT id FROM brands WHERE slug = 'new-age-cables' LIMIT 1),
    true,
    false
  ),
  (
    'Porta Fancy Commode',
    'porta-fancy-commode',
    'Premium one-piece dual flush ceramic commode by Porta. Features soft-closing seat cover, high stain resistance, and sleek modern styling.',
    15000,
    (SELECT id FROM categories WHERE slug = 'sanitary' LIMIT 1),
    (SELECT id FROM brands WHERE slug = 'porta' LIMIT 1),
    true,
    false
  ),
  (
    'Faisal Sanitary Wash Basin',
    'faisal-sanitary-basin',
    'Durable vitreous china bathroom wash basin by Faisal Sanitary. Master glazed finish with overflow protection and smooth easy-to-clean contours.',
    8000,
    (SELECT id FROM categories WHERE slug = 'sanitary' LIMIT 1),
    (SELECT id FROM brands WHERE slug = 'faisal-sanitary' LIMIT 1),
    true,
    false
  ),
  (
    'Dura Max U-PVC Pipe 3 inch',
    'dura-max-upvc-3',
    'High-impact resistance 3-inch U-PVC drainage pipe. Corrosion-proof, leak-tight joints, ideal for residential sanitary and soil waste lines.',
    1200,
    (SELECT id FROM categories WHERE slug = 'sanitary' LIMIT 1),
    (SELECT id FROM brands WHERE slug = 'imported-china' LIMIT 1),
    true,
    false
  ),
  (
    'Bestway Cement Bag',
    'bestway-cement-bag',
    '50kg bag of premium Ordinary Portland Cement (OPC) by Bestway. Superior compressive strength and fast setting time for structural construction.',
    1300,
    (SELECT id FROM categories WHERE slug = 'building-material' LIMIT 1),
    (SELECT id FROM brands WHERE slug = 'bestway-cement' LIMIT 1),
    true,
    false
  )
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  category_id = EXCLUDED.category_id,
  brand_id = EXCLUDED.brand_id,
  in_stock = EXCLUDED.in_stock,
  is_whatsapp_inquiry = EXCLUDED.is_whatsapp_inquiry;
