import { Suspense } from "react";
import { connection } from "next/server";
import { BusinessPage } from "@/components/catalog/BusinessPage";
import { businessMetadata } from "@/lib/storefront/business-seo";
export async function generateMetadata({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) { await connection(); return businessMetadata("/contact", Object.keys(await searchParams).length > 0); }
export default function Page() { return <Suspense fallback={<p>Loading store contacts…</p>}><BusinessPage kind="contact" /></Suspense>; }
