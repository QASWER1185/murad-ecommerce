export type Category = 'sanitary' | 'kitchen' | 'hobs' | 'hoods' | 'geysers' | 'pipes' | 'tanks' | 'electric' | 'building-material';
export type Product = { id: string; name: string; brand: string; price: number; category: Category; asset?: string; rating?: string; reviews?: number; bestseller?: boolean; imported?: boolean; deal?: boolean; inquiry?: boolean };

export const categories: { id: Category; label: string; lines: [string, string]; asset: string }[] = [
  { id: 'sanitary', label: 'Sanitary & Bathroom', lines: ['Sanitary &', 'Bathroom'], asset: 'category-sanitary' },
  { id: 'kitchen', label: 'Kitchen Sinks & Faucets', lines: ['Kitchen', 'Sinks & Faucets'], asset: 'category-kitchen' },
  { id: 'hobs', label: 'Cooking Hobs & Ranges', lines: ['Cooking Hobs', '& Ranges'], asset: 'category-hobs' },
  { id: 'hoods', label: 'Kitchen Hoods', lines: ['Kitchen', 'Hoods'], asset: 'category-hoods' },
  { id: 'geysers', label: 'Geysers (Gas & Electric)', lines: ['Geysers', '(Gas & Electric)'], asset: 'category-geysers' },
  { id: 'pipes', label: 'Pipes & Fittings', lines: ['Pipes &', 'Fittings'], asset: 'category-pipes' },
  { id: 'tanks', label: 'Water Tanks', lines: ['Water', 'Tanks'], asset: 'category-tanks' },
  { id: 'electric', label: 'Electrical Products', lines: ['Electrical', 'Products'], asset: 'category-electric' },
  { id: 'building-material', label: 'Building Material', lines: ['Building', 'Material'], asset: 'category-building' },
];
export const brands = [
  { id: 'Faisal Sanitary', label: 'Faisal Sanitary Fittings', asset: 'brand-faisal' },
  { id: 'Porta', label: 'Porta Ceramics', asset: 'brand-porta-ceramics' },
  { id: 'Porta', label: 'Porta Sanitary Fittings', asset: 'brand-porta-sanitary' },
  { id: 'Dell Ceramics', label: 'Dell Ceramics', asset: 'brand-dell' },
  { id: 'Popular Pipes', label: 'Popular Pipes & Fittings', asset: 'brand-popular' },
  { id: 'DuraMax', label: 'DuraMax Pipes & Fittings', asset: 'brand-duramax' },
  { id: 'DuraFlow', label: 'DuraFlow Pipes & Fittings', asset: 'brand-duraflow' },
  { id: 'Imported', label: 'Imported Collection', asset: 'brand-imported' },
];
export const products: Product[] = [
  { id: 'porta-fancy-commode', name: 'Porta Fancy Commode', brand: 'Porta Sanitary', price: 15000, category: 'sanitary', asset: 'product-commode', rating: '4.8', reviews: 36, bestseller: true },
  { id: 'faisal-sanitary-basin', name: 'Faisal Sanitary Wash Basin', brand: 'Faisal Sanitary', price: 8000, category: 'sanitary', asset: 'product-basin', rating: '4.7', reviews: 28 },
  { id: 'basin-mixer', name: 'Basin Mixer', brand: 'Imported', price: 7500, category: 'sanitary', asset: 'product-mixer', rating: '4.9', reviews: 42, imported: true },
  { id: 'rain-shower', name: 'Shower Set (Rain Shower)', brand: 'Imported', price: 18500, category: 'sanitary', asset: 'product-shower', rating: '4.8', reviews: 19, imported: true },
  { id: 'kitchen-sink', name: 'Kitchen Sink (Single Bowl)', brand: 'Imported', price: 22000, category: 'kitchen', asset: 'product-sink', rating: '4.8', reviews: 25, imported: true },
  { id: 'gas-hob', name: 'Built-in Gas Hob (3 Burner)', brand: 'Imported', price: 28000, category: 'hobs', asset: 'product-hob', rating: '4.7', reviews: 77, imported: true },
  // Keep the existing storefront inventory searchable and available to order.
  { id: 'porta-rimless-commode', name: 'Porta Rimless One-Piece Commode', brand: 'Porta', price: 32500, category: 'sanitary', deal: true },
  { id: 'faisal-shower-set', name: 'Faisal Rain Shower Set Complete', brand: 'Faisal Sanitary', price: 18700, category: 'sanitary', deal: true },
  { id: 'dell-art-basin', name: 'Dell Ceramics Art Basin (Gujranwala)', brand: 'Dell Ceramics', price: 12400, category: 'sanitary' },
  { id: 'china-vanity', name: 'Imported China Luxury Vanity Cabinet', brand: 'Imported China', price: 45000, category: 'sanitary', imported: true },
  { id: 'nano-sink', name: 'Nano Black Waterfall Kitchen Sink', brand: 'Imported China', price: 28500, category: 'kitchen', imported: true },
  { id: 'nasgas-geyser', name: 'NASGAS Instant Electric Water Geyser', brand: 'NASGAS', price: 16500, category: 'geysers' },
  { id: 'kitchen-hood', name: 'Modern Kitchen Hood & Chimney Glass', brand: 'Kitchen Appliances', price: 24000, category: 'hoods' },
  { id: 'popular-pipes', name: 'Popular PPR-C Pipe & Fittings Bundle', brand: 'Popular Pipes', price: 4500, category: 'pipes', deal: true },
  { id: 'duramax-pipe', name: 'DuraMax U-PVC 4-Inch Drainage Pipe', brand: 'DuraMax', price: 1850, category: 'pipes', deal: true },
  { id: 'gm-cable', name: 'GM Cable 3/29 Pure Copper Coil', brand: 'GM Cables', price: 5000, category: 'electric' },
  { id: 'new-age-cable', name: 'New Age Cable 7/29 Coil', brand: 'New Age', price: 8500, category: 'electric' },
  { id: 'bestway-cement', name: 'Bestway Fresh Cement (50kg Bag)', brand: 'Bestway Cement', price: 1300, category: 'building-material', inquiry: true },
  { id: 'sand-crush', name: 'Ravi Sand & Margalla Crush Trolley', brand: 'M. Murad Sons', price: 0, category: 'building-material', inquiry: true },
];
export const money = (value: number) => value.toLocaleString('en-PK');
export const whatsapp = (text?: string) => `https://wa.me/923086235608${text ? `?text=${encodeURIComponent(text)}` : ''}`;
