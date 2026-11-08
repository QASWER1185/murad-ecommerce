import type { Product } from '@/lib/storefront/types';

export const shopBrands = [
  { slug: 'porta', name: 'Porta', asset: 'brand-porta', card: 'brand-card-porta' },
  { slug: 'faisal-sanitary', name: 'Faisal Sanitary', asset: 'brand-faisal', card: 'brand-card-faisal' },
  { slug: 'dell-ceramics', name: 'Dell Ceramics', asset: 'brand-dell', card: 'brand-card-dell' },
  { slug: 'imported-china', name: 'Imported Collection', asset: 'brand-imported', card: 'brand-card-imported' },
] as const;
export const productTypes = ['Commodes', 'Wash Basins', 'Basin Mixers', 'Shower Sets', 'Vanities', 'Bathroom Accessories'];
export function typeOf(product: Product) { return product.product_type; }
export const formatPrice = (price: number) => `PKR ${price.toLocaleString('en-PK')}`;
export const contacts = [
  { number: '0321-7165000', url: 'https://wa.me/923217165000', label: 'Main' },
  { number: '0308-6235608', url: 'https://wa.me/923086235608', label: 'Secondary' },
] as const;
