export type Category = 'sanitary' | 'kitchen' | 'hobs' | 'hoods' | 'geysers' | 'pipes' | 'tanks' | 'electric' | 'building-material';
export type Product = { id: string; name: string; brand: string; price: number; currency?: string; publishedAt?: string; category: Category; asset?: string; slug?: string; rating?: string; reviews?: number; bestseller?: boolean; imported?: boolean; deal?: boolean; inquiry?: boolean };

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
  { slug: 'faisal-sanitary', id: 'Faisal Sanitary', label: 'Faisal Sanitary Fittings', asset: 'brand-faisal' },
  { slug: 'porta', id: 'Porta', label: 'Porta Ceramics', asset: 'brand-porta-ceramics' },
  { slug: 'porta', id: 'Porta', label: 'Porta Sanitary Fittings', asset: 'brand-porta-sanitary' },
  { slug: 'dell-ceramics', id: 'Dell Ceramics', label: 'Dell Ceramics', asset: 'brand-dell' },
  { slug: 'popular-pipes', id: 'Popular Pipes', label: 'Popular Pipes & Fittings', asset: 'brand-popular' },
  { slug: 'duramax', id: 'DuraMax', label: 'DuraMax Pipes & Fittings', asset: 'brand-duramax' },
  { slug: 'duraflow', id: 'DuraFlow', label: 'DuraFlow Pipes & Fittings', asset: 'brand-duraflow' },
  { slug: 'imported-china', id: 'Imported', label: 'Imported Collection', asset: 'brand-imported' },
];
export const money = (value: number) => value.toLocaleString('en-PK');
export const whatsapp = (text?: string) => `https://wa.me/923086235608${text ? `?text=${encodeURIComponent(text)}` : ''}`;
