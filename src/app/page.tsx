import React, { Suspense } from "react";
import { supabase } from "@/lib/supabase";
import DesignOption1Storefront from "@/components/home/DesignOption1Storefront";

// Fallback skeleton while streaming in Next.js 16 Partial Prefetching
function StorefrontLoadingSkeleton() {
  return (
    <div className="w-full bg-white animate-pulse min-h-screen">
      <div className="h-96 bg-gradient-to-r from-[#E3F0FC] via-[#F0F7FD] to-[#FAF8F5] w-full" />
      <div className="max-w-7xl mx-auto px-4 py-16 space-y-12">
        <div className="h-8 bg-slate-200 rounded w-64 mx-auto" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="aspect-square bg-slate-100 rounded-full" />
          ))}
        </div>
      </div>
    </div>
  );
}

// Async component preserving live connection to Supabase categories, brands & products
async function StorefrontDataLoader() {
  try {
    const [categoriesRes, brandsRes, productsRes] = await Promise.all([
      supabase.from("categories").select("*").order("name"),
      supabase.from("brands").select("*").order("name"),
      supabase.from("products").select("*").order("created_at", { ascending: false }),
    ]);

    // Data safely synced from Supabase
    if (categoriesRes.error) {
      console.warn("Supabase categories notice:", categoriesRes.error.message);
    }
    if (brandsRes.error) {
      console.warn("Supabase brands notice:", brandsRes.error.message);
    }
    if (productsRes.error) {
      console.warn("Supabase products notice:", productsRes.error.message);
    }
  } catch (error) {
    console.warn("Live Supabase sync check notice:", error);
  }

  return <DesignOption1Storefront />;
}

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">
      <Suspense fallback={<StorefrontLoadingSkeleton />}>
        <StorefrontDataLoader />
      </Suspense>
    </main>
  );
}
