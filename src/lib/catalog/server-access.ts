import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { canManage, canPreview, isCleanSlug, type CatalogKind, type CatalogRole, type PublicProduct, type PublicRoute } from './publication';

// Phase 3 supplies a request-scoped authenticated SSR client. Never cache this
// check, trust user_metadata roles, or instantiate a browser service-role client.
export async function requireCatalogActor(client: SupabaseClient, permission: 'preview' | 'manage') {
  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user) throw new Error('Authentication required');
  const role = await client.rpc('current_catalog_role');
  if (role.error || !canPreview(role.data) || (permission === 'manage' && !canManage(role.data))) throw new Error('Catalog permission denied');
  return { userId: user.id, role: role.data as CatalogRole };
}
export async function getAuthorizedProductPreview(client: SupabaseClient, productId: string) {
  await requireCatalogActor(client, 'preview');
  const { data, error } = await client.rpc('catalog_admin_preview', { product_id: productId });
  if (error) throw new Error('Authorized preview unavailable');
  return data;
}
export async function getPublicProduct(client: SupabaseClient, slug: string): Promise<PublicProduct | null> {
  if (!isCleanSlug(slug)) return null;
  const { data, error } = await client.from('catalog_products_public').select('*').eq('slug', slug).maybeSingle();
  if (error) throw new Error('Public catalog unavailable');
  return data as PublicProduct | null;
}
export async function getPublicCatalogPage(client: SupabaseClient, page = 1, pageSize = 24) {
  if (!Number.isSafeInteger(page) || page < 1 || !Number.isInteger(pageSize) || pageSize < 1 || pageSize > 48 || page > 100000) throw new Error('Invalid pagination');
  const start = (page - 1) * pageSize;
  const { data, error, count } = await client.from('catalog_products_public').select('*', { count: 'exact' }).order('published_at', { ascending: false }).order('id').range(start, start + pageSize - 1);
  if (error) throw new Error('Public catalog unavailable');
  return { products: data as PublicProduct[], total: count ?? 0 };
}
export async function getPublicRoute(client: SupabaseClient, kind: CatalogKind, slug: string): Promise<PublicRoute | null> {
  if (!isCleanSlug(slug)) return null;
  const { data, error } = await client.from('catalog_routes_public').select('*').eq('kind', kind).eq('slug', slug).maybeSingle();
  if (error) throw new Error('Public catalog route unavailable');
  return data as PublicRoute | null;
}
