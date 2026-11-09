import { isIndexable, indexingDisabled, type PublicRoute, type IndexContext } from '../catalog/publication';

export function canonicalUrl(route: PublicRoute, siteOrigin: string): string {
  const origin = new URL(siteOrigin);
  if (!['https:','http:'].includes(origin.protocol) || origin.username || origin.password || origin.pathname !== '/' || origin.search || origin.hash) throw new Error('A trusted site origin is required');
  if (!/^\/(product|category|brand)\/[a-z0-9]+(-[a-z0-9]+)*$/.test(route.canonical_path)) throw new Error('Invalid catalog canonical path');
  return new URL(route.canonical_path, origin).href;
}
// Both consumers deliberately call the same eligibility function. These helpers
// do not modify existing routes; wiring belongs to the approved later phases.
export function catalogMetadata(route: PublicRoute, siteOrigin: string, context: IndexContext = indexingDisabled) {
  const url = canonicalUrl(route, siteOrigin);
  return {
    title: route.seo_title || `${route.name} | M Murad Sons`,
    description: route.seo_description || undefined,
    alternates: { canonical: url },
    robots: { index: isIndexable(route, context), follow: !context.adminPreview },
    openGraph: { title: route.seo_title || route.name, description: route.seo_description || undefined, url },
  };
}
export function catalogSitemap(routes: readonly PublicRoute[], siteOrigin: string, context: IndexContext = indexingDisabled) {
  return routes.filter(route => isIndexable(route, context)).map(route => {
    const updated = new Date(route.updated_at);
    return { url: canonicalUrl(route, siteOrigin), ...(Number.isFinite(updated.getTime()) ? { lastModified: updated } : {}) };
  });
}
