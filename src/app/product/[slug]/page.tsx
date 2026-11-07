import SanitaryPage from '@/components/sanitary/SanitaryPage';
import { Suspense } from 'react';
export const metadata = { title: 'Product Details | M Murad Sons' };
async function Content({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <SanitaryPage productSlug={slug} />;
}
export default function Page(props: { params: Promise<{ slug: string }> }) { return <Suspense fallback={<p>Loading product…</p>}><Content {...props} /></Suspense>; }
