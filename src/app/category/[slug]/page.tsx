import React, { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import AddToCartButton from "@/components/products/AddToCartButton";
import {
  Bath,
  Zap,
  Building2,
  PackageOpen,
  MessageCircle,
  ChevronRight,
  Home,
  ShieldCheck,
  Truck,
  Layers,
  ArrowRight,
} from "lucide-react";

interface PageProps {
  params: Promise<{ slug: string }>;
}

interface ProductWithBrand {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category_id: string;
  brand_id: string | null;
  is_whatsapp_inquiry: boolean;
  in_stock: boolean;
  brands?:
    | {
        id: string;
        name: string;
        slug: string;
      }
    | {
        id: string;
        name: string;
        slug: string;
      }[]
    | null;
}

// Category theme styling helper
const categoryThemes: Record<
  string,
  {
    icon: typeof Bath;
    badgeText: string;
    description: string;
    gradient: string;
    accentBg: string;
    accentBorder: string;
    accentText: string;
  }
> = {
  sanitary: {
    icon: Bath,
    badgeText: "Sanitary & Bathroom Ware",
    description:
      "Explore premium sanitary fixtures, luxury commodes, vanity basins, faucets, and UPVC drainage pipes by top manufacturers.",
    gradient: "from-blue-600 via-sky-600 to-indigo-700",
    accentBg: "bg-blue-50",
    accentBorder: "border-blue-200",
    accentText: "text-blue-700",
  },
  electric: {
    icon: Zap,
    badgeText: "Electric Cables & Accessories",
    description:
      "High-conductivity 99.9% pure copper coils, industrial wiring, breakers, and distribution accessories from certified manufacturers.",
    gradient: "from-amber-600 via-yellow-600 to-orange-700",
    accentBg: "bg-amber-50",
    accentBorder: "border-amber-200",
    accentText: "text-amber-800",
  },
  "building-material": {
    icon: Building2,
    badgeText: "Building & Construction Material",
    description:
      "Direct manufacturer supply of premium cement, structural materials, and construction essentials delivered across Lahore.",
    gradient: "from-emerald-700 via-teal-700 to-slate-800",
    accentBg: "bg-emerald-50",
    accentBorder: "border-emerald-200",
    accentText: "text-emerald-800",
  },
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const { data: category } = await supabase
      .from("categories")
      .select("name, slug")
      .eq("slug", slug)
      .single();

    if (!category) {
      return {
        title: "Category Not Found | M Murad Sons",
        description: "Category could not be found.",
      };
    }

    return {
      title: `${category.name} Catalog | M Murad Sons Lahore`,
      description: `Shop authentic ${category.name} products, building materials, and sanitary ware at wholesale and retail rates in Lahore.`,
    };
  } catch {
    return {
      title: "Category Catalog | M Murad Sons",
    };
  }
}

// Loading Skeleton for partial prefetching streaming
function CategoryLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 animate-pulse pb-20">
      <div className="bg-white border-b border-gray-200 h-10 w-full" />
      <div className="bg-slate-800 h-56 w-full" />
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="h-6 w-48 bg-gray-200 rounded mb-8" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-gray-200 h-80 flex flex-col p-5"
            >
              <div className="bg-gray-100 rounded-xl h-44 mb-4" />
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-1/2 mb-4" />
              <div className="mt-auto h-10 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

async function CategoryContent({ params }: PageProps) {
  const { slug } = await params;

  // 1. Fetch Category by Slug
  let category: { id: string; name: string; slug: string } | null = null;
  let products: ProductWithBrand[] = [];

  try {
    const { data: catData } = await supabase
      .from("categories")
      .select("id, name, slug")
      .eq("slug", slug)
      .single();

    category = catData;

    if (category) {
      const { data: prodData } = await supabase
        .from("products")
        .select(`
          id,
          name,
          slug,
          description,
          price,
          image_url,
          category_id,
          brand_id,
          is_whatsapp_inquiry,
          in_stock,
          brands (
            id,
            name,
            slug
          )
        `)
        .eq("category_id", category.id)
        .order("created_at", { ascending: false });

      if (prodData) {
        products = prodData as unknown as ProductWithBrand[];
      }
    }
  } catch (err) {
    console.error("Error loading category page data:", err);
  }

  // Handle Category Not Found
  if (!category) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-2xl p-8 sm:p-12 shadow-sm border border-gray-200">
          <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <PackageOpen className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2">
            Category Not Found
          </h1>
          <p className="text-slate-600 max-w-md mx-auto mb-8 text-sm">
            We could not locate the category{" "}
            <span className="font-mono text-rose-600 font-semibold">{slug}</span>
            . Please browse one of our verified collections below:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto mb-8">
            <Link
              href="/category/sanitary"
              className="p-4 rounded-xl border border-blue-200 bg-blue-50/50 hover:bg-blue-100/50 text-blue-900 font-semibold text-sm transition-all"
            >
              Sanitary Products
            </Link>
            <Link
              href="/category/electric"
              className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 hover:bg-amber-100/50 text-amber-900 font-semibold text-sm transition-all"
            >
              Electric Cables
            </Link>
            <Link
              href="/category/building-material"
              className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100/50 text-emerald-900 font-semibold text-sm transition-all"
            >
              Building Materials
            </Link>
          </div>

          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold transition-colors"
          >
            <Home className="w-4 h-4" />
            <span>Return to Homepage</span>
          </Link>
        </div>
      </div>
    );
  }

  const theme = categoryThemes[category.slug] || {
    icon: Layers,
    badgeText: `${category.name} Collection`,
    description: `Explore quality ${category.name} products with dependable rates and fast delivery across Lahore.`,
    gradient: "from-slate-800 via-slate-900 to-slate-950",
    accentBg: "bg-slate-100",
    accentBorder: "border-slate-300",
    accentText: "text-slate-800",
  };

  const CategoryIcon = theme.icon;

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* 1. Breadcrumbs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-2 text-xs sm:text-sm text-slate-500">
          <Link href="/" className="hover:text-blue-600 flex items-center gap-1 transition-colors">
            <Home className="w-3.5 h-3.5" />
            <span>Home</span>
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-400">Categories</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-semibold text-slate-900">{category.name}</span>
        </div>
      </div>

      {/* 2. Modern Header Banner */}
      <div className={`bg-gradient-to-r ${theme.gradient} text-white shadow-inner`}>
        <div className="max-w-7xl mx-auto px-4 py-10 sm:py-14">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold tracking-wide">
                <CategoryIcon className="w-3.5 h-3.5" />
                <span>{theme.badgeText}</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight">
                {category.name}
              </h1>
              <p className="text-sm sm:text-base text-slate-100/90 leading-relaxed">
                {theme.description}
              </p>
            </div>

            {/* Quick Contractor & WhatsApp Assistance Box */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5 text-white md:max-w-xs shrink-0">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-300 mb-1">
                <ShieldCheck className="w-4 h-4" />
                <span>Contractor &amp; Site Supply</span>
              </div>
              <p className="text-xs text-slate-200 mb-3">
                Need customized estimation, bulk quotation, or on-site delivery in Lahore?
              </p>
              <a
                href="https://wa.me/923086235608"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors shadow-md"
              >
                <MessageCircle className="w-4 h-4 fill-slate-950" />
                <span>WhatsApp 0308-6235608</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Products Section */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:py-12">
        {/* Results Bar */}
        <div className="flex items-center justify-between border-b border-gray-200 pb-4 mb-8">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              All {category.name} Products
            </h2>
            <p className="text-xs text-slate-500">
              Showing {products.length} {products.length === 1 ? "item" : "items"} available for delivery
            </p>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500">
            <Truck className="w-4 h-4 text-emerald-600" />
            <span>Fast dispatch from Raiwind Rd, Lahore</span>
          </div>
        </div>

        {/* 4. Products Grid or Graceful Empty State */}
        {products.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-10 sm:p-16 text-center max-w-2xl mx-auto shadow-sm">
            <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <PackageOpen className="w-8 h-8 stroke-[1.5]" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              No products found in this category yet
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed mb-6">
              We are actively updating our online inventory with new stock from our Lahore warehouse. In the meantime, you can message us directly for instant stock availability, customized orders, or contractor pricing.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href="https://wa.me/923086235608"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-colors shadow-sm"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Ask Availability on WhatsApp</span>
              </a>
              <Link
                href="/"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-sm transition-colors"
              >
                <span>Browse Other Categories</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => {
              const brandData = Array.isArray(product.brands)
                ? product.brands[0]
                : product.brands;
              const brandName = brandData?.name;

              const formattedPrice = new Intl.NumberFormat("en-PK", {
                style: "currency",
                currency: "PKR",
                maximumFractionDigits: 0,
              }).format(Number(product.price));

              const whatsappUrl = `https://wa.me/923086235608?text=${encodeURIComponent(
                `Hello M Murad Sons, I would like to get the latest rate/quotation for "${product.name}".`
              )}`;

              return (
                <div
                  key={product.id}
                  className="bg-white rounded-2xl border border-gray-200/90 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden group"
                >
                  {/* Card Visual / Thumbnail */}
                  <div className="relative aspect-4/3 bg-gradient-to-br from-slate-50 to-slate-100 border-b border-gray-100 flex items-center justify-center p-6 overflow-hidden">
                    {product.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="object-contain w-full h-full group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-400 group-hover:text-blue-600 transition-colors">
                        <CategoryIcon className="w-14 h-14 stroke-[1.25] mb-2" />
                        <span className="text-[11px] font-semibold tracking-wider uppercase text-slate-400">
                          {brandName || category.name}
                        </span>
                      </div>
                    )}

                    {/* In Stock Badge */}
                    <div className="absolute top-3 right-3">
                      {product.in_stock ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                          In Stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          Out of Stock
                        </span>
                      )}
                    </div>

                    {/* Brand Pill */}
                    {brandName && (
                      <div className="absolute top-3 left-3">
                        <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-white/90 backdrop-blur-sm text-slate-800 border border-slate-200 shadow-xs">
                          {brandName}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Card Body */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <h3 className="font-bold text-slate-900 text-base leading-snug group-hover:text-blue-600 transition-colors line-clamp-2">
                        {product.name}
                      </h3>

                      {product.description && (
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                          {product.description}
                        </p>
                      )}
                    </div>

                    {/* Price and Action Section */}
                    <div className="pt-2 border-t border-gray-100 space-y-3">
                      <div className="flex items-baseline justify-between">
                        <div>
                          <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                            Price
                          </span>
                          <span className="text-lg font-extrabold text-slate-900 tracking-tight">
                            {formattedPrice}
                          </span>
                        </div>

                        {product.is_whatsapp_inquiry && (
                          <span className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-medium">
                            Fluctuating Rate
                          </span>
                        )}
                      </div>

                      {/* Action Button: WhatsApp vs Add To Cart */}
                      {product.is_whatsapp_inquiry ? (
                        <a
                          href={whatsappUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-sm"
                        >
                          <MessageCircle className="w-4 h-4 fill-current" />
                          <span>Get Rate on WhatsApp</span>
                        </a>
                      ) : (
                        <AddToCartButton
                          productId={product.id}
                          productName={product.name}
                          price={Number(product.price)}
                        />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CategoryPage({ params }: PageProps) {
  return (
    <Suspense fallback={<CategoryLoadingSkeleton />}>
      <CategoryContent params={params} />
    </Suspense>
  );
}
