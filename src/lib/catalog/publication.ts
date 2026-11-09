/** Public projections come exclusively from catalog_*_public SQL views.
 * Raw authoring records must never be passed to public metadata or sitemap code.
 */
export type PublicationStatus = 'draft' | 'ready_for_review' | 'published';
export type CatalogRole = 'admin' | 'editor';
export type CatalogKind = 'product' | 'category' | 'brand';
export type StockStatus = 'unknown' | 'in_stock' | 'out_of_stock';
export type SalesMode = 'online' | 'quotation';
export interface WorkflowRecord {
  publication_status: PublicationStatus;
  version: number; reviewed_version: number | null;
  reviewed_at: string | null; reviewed_by: string | null;
  approved_at: string | null; approved_by: string | null;
  archived_at: string | null; identity_verified: boolean; content_verified: boolean;
}
export interface PublicRoute {
  id: string; kind: CatalogKind; name: string; slug: string;
  canonical_path: string; seo_title: string | null; seo_description: string | null;
  is_indexable: boolean; updated_at: string;
}
export interface PublicProduct {
  id: string; name: string; slug: string; sku: string | null; model: string | null;
  description: string | null; category_id: string | null; brand_id: string | null;
  price: number | null; currency: string; sales_mode: SalesMode;
  availability: StockStatus; is_indexable: boolean;
}
export interface IndexContext {
  production: boolean; indexingEnabled: boolean; adminPreview?: boolean; searchOrFilter?: boolean;
}
export const indexingDisabled: IndexContext = Object.freeze({ production: false, indexingEnabled: false });
export const isCleanSlug = (slug: string) => /^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug);
export function isPubliclyVisible(record: WorkflowRecord): boolean {
  return record.publication_status === 'published' && !record.archived_at
    && record.identity_verified && record.content_verified
    && !!record.reviewed_at && !!record.reviewed_by && !!record.approved_at && !!record.approved_by
    && record.reviewed_version === record.version;
}
export function canPreview(role: unknown): role is CatalogRole { return role === 'admin' || role === 'editor'; }
export function canManage(role: unknown): boolean { return role === 'admin'; }
export function isIndexable(route: PublicRoute | null, context: IndexContext = indexingDisabled): boolean {
  return !!route && route.is_indexable === true && context.production && context.indexingEnabled
    && !context.adminPreview && !context.searchOrFilter && isCleanSlug(route.slug)
    && route.canonical_path === `/${route.kind}/${route.slug}`
    && !!route.seo_title?.trim() && !!route.seo_description?.trim();
}
export function canEmitOffer(product: PublicProduct, route: PublicRoute, context: IndexContext): boolean {
  return product.id === route.id && product.slug === route.slug && product.is_indexable === true
    && route.kind === 'product' && isIndexable(route, context)
    && product.sales_mode === 'online' && product.price !== null && Number.isFinite(product.price)
    && product.price > 0 && /^[A-Z]{3}$/.test(product.currency);
}
