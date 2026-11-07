import { Suspense } from 'react';
import { connection } from 'next/server';
import { notFound } from 'next/navigation';
import { getSanitaryCatalog } from '@/lib/sanitary-catalog';
import { shopBrands } from './catalog-options';
import SanitaryShop from './SanitaryShop';

async function Catalog({ brandSlug, productSlug }: { brandSlug?: string; productSlug?: string }) {
  await connection();
  if (brandSlug && !shopBrands.some(brand => brand.slug === brandSlug)) notFound();
  const catalog = await getSanitaryCatalog();
  if (productSlug && !catalog.products.some(product => product.slug === productSlug)) notFound();
  return <SanitaryShop key={productSlug ?? brandSlug ?? 'all'} {...catalog} brandSlug={brandSlug} productSlug={productSlug} />;
}
export default function SanitaryPage(props: { brandSlug?: string; productSlug?: string }) {
  return <Suspense fallback={<p role="status" style={{ padding: 32 }}>Loading sanitary products…</p>}><Catalog {...props} /></Suspense>;
}
