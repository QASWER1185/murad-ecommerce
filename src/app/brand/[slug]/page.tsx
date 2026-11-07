import SanitaryPage from '@/components/sanitary/SanitaryPage';
import { shopBrands } from '@/components/sanitary/catalog-options';
import { Suspense } from 'react';
export function generateStaticParams() { return shopBrands.map(item => ({ slug: item.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const brand = shopBrands.find(item => item.slug === slug);
  return { title: `${brand?.name ?? 'Brand'} | Sanitary & Bathroom | M Murad Sons` };
}
async function Content({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <SanitaryPage brandSlug={slug} />;
}
export default function Page(props: { params: Promise<{ slug: string }> }) { return <Suspense fallback={<p>Loading brand…</p>}><Content {...props} /></Suspense>; }
