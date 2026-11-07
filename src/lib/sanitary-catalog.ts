import 'server-only';
import { cache } from 'react';
import { supabase } from './supabase';

export type ShopBrand = { id: string; name: string; slug: string };
export type SanitaryProduct = {
  id: string; name: string; slug: string; description: string | null;
  price: number; image_url: string | null; in_stock: boolean;
  is_whatsapp_inquiry: boolean; created_at: string;
  model: string | null; finish: string | null; product_type: string | null;
  brand: ShopBrand | null;
};
export const getSanitaryCatalog = cache(async () => {
  const { data: category, error: categoryError } = await supabase.from('categories').select('id').eq('slug', 'sanitary').single();
  if (categoryError || !category) throw new Error('The sanitary catalog is temporarily unavailable.');
  const [inventory, brands] = await Promise.all([
    supabase.from('products').select('*, brands(id,name,slug)').eq('category_id', category.id).order('created_at', { ascending: false }),
    supabase.from('brands').select('id,name,slug').in('slug', ['porta', 'faisal-sanitary', 'dell-ceramics', 'imported-china']),
  ]);
  if (inventory.error || brands.error) throw new Error('The sanitary catalog is temporarily unavailable.');
  const products: SanitaryProduct[] = (inventory.data ?? []).map(row => ({
    id: row.id, name: row.name, slug: row.slug, description: row.description,
    price: Number(row.price), image_url: row.image_url, in_stock: row.in_stock,
    is_whatsapp_inquiry: row.is_whatsapp_inquiry, created_at: row.created_at,
    model: row.model ?? null, finish: row.finish ?? null, product_type: row.product_type ?? null,
    brand: Array.isArray(row.brands) ? row.brands[0] ?? null : row.brands,
  }));
  return { products, brands: brands.data as ShopBrand[] };
});
