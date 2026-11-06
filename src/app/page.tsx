import { Suspense } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  Bath,
  Zap,
  Building2,
  Sparkles,
  ArrowRight,
  MessageCircle,
  Truck,
  ShieldCheck,
  BadgeCheck,
  Layers,
  ChevronRight,
} from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

interface Brand {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

// Brand to Category mapping helper
const categoryBrandMapping: Record<string, string[]> = {
  sanitary: ["porta", "faisal-sanitary", "dell-ceramics", "imported-china"],
  electric: ["gm-cables", "new-age-cables"],
  "building-material": ["bestway-cement"],
};

// Category metadata helper (icons, descriptions, color accents)
const categoryConfig: Record<
  string,
  {
    icon: typeof Bath;
    description: string;
    badgeBg: string;
    gradient: string;
  }
> = {
  sanitary: {
    icon: Bath,
    description:
      "Luxury sanitary ware, premium commodes, vanities, faucets, and high-grade plumbing fittings.",
    badgeBg: "bg-blue-50 text-blue-700 border-blue-200",
    gradient: "from-blue-600 to-sky-400",
  },
  electric: {
    icon: Zap,
    description:
      "Pure copper cables, industrial wiring, switches, breakers, and commercial electrical accessories.",
    badgeBg: "bg-amber-50 text-amber-700 border-amber-200",
    gradient: "from-amber-500 to-yellow-400",
  },
  "building-material": {
    icon: Building2,
    description:
      "High-grade cement, structural construction supplies, adhesives, and wholesale building chemicals.",
    badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
    gradient: "from-emerald-600 to-teal-400",
  },
};

// Async component that fetches live catalog data from Supabase
async function CatalogSection() {
  let categories: Category[] = [];
  let brands: Brand[] = [];

  try {
    const [categoriesRes, brandsRes] = await Promise.all([
      supabase.from("categories").select("*").order("name"),
      supabase.from("brands").select("*").order("name"),
    ]);

    if (categoriesRes.data && categoriesRes.data.length > 0) {
      categories = categoriesRes.data;
    }
    if (brandsRes.data && brandsRes.data.length > 0) {
      brands = brandsRes.data;
    }
  } catch (error) {
    console.error("Error fetching data from Supabase:", error);
  }

  // Fallbacks if database is pending first sync
  if (categories.length === 0) {
    categories = [
      { id: "1", name: "Sanitary", slug: "sanitary", created_at: "" },
      { id: "2", name: "Electric", slug: "electric", created_at: "" },
      {
        id: "3",
        name: "Building Material",
        slug: "building-material",
        created_at: "",
      },
    ];
  }

  if (brands.length === 0) {
    brands = [
      { id: "1", name: "Porta", slug: "porta", created_at: "" },
      {
        id: "2",
        name: "Faisal Sanitary",
        slug: "faisal-sanitary",
        created_at: "",
      },
      { id: "3", name: "Dell Ceramics", slug: "dell-ceramics", created_at: "" },
      {
        id: "4",
        name: "Imported China",
        slug: "imported-china",
        created_at: "",
      },
      { id: "5", name: "GM Cables", slug: "gm-cables", created_at: "" },
      {
        id: "6",
        name: "New Age Cables",
        slug: "new-age-cables",
        created_at: "",
      },
      {
        id: "7",
        name: "Bestway Cement",
        slug: "bestway-cement",
        created_at: "",
      },
    ];
  }

  return (
    <div>
      {/* Category Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
        {categories.map((category) => {
          const config = categoryConfig[category.slug] || {
            icon: Layers,
            description: `Explore quality ${category.name} supplies and trusted fittings for your project.`,
            badgeBg: "bg-slate-100 text-slate-700 border-slate-200",
            gradient: "from-slate-600 to-slate-400",
          };

          const Icon = config.icon;
          const mappedBrandSlugs = categoryBrandMapping[category.slug] || [];
          const categoryBrands = brands.filter((b) =>
            mappedBrandSlugs.includes(b.slug)
          );

          return (
            <div
              key={category.id}
              className="group relative flex flex-col justify-between bg-white rounded-2xl border border-slate-200/90 hover:border-blue-500 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden"
            >
              {/* Card top gradient bar */}
              <div className={`h-2 w-full bg-gradient-to-r ${config.gradient}`} />

              <div className="p-6 sm:p-8 flex-1">
                {/* Header row: Icon & Brand count */}
                <div className="flex items-center justify-between gap-3 mb-5">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 group-hover:bg-blue-600 group-hover:text-white text-slate-800 flex items-center justify-center transition-colors shadow-sm">
                    <Icon className="w-6 h-6 stroke-[1.75]" />
                  </div>
                  <span
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${config.badgeBg}`}
                  >
                    {categoryBrands.length} Brands
                  </span>
                </div>

                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                  {category.name}
                </h3>

                <p className="text-xs sm:text-sm text-slate-600 mt-2.5 leading-relaxed">
                  {config.description}
                </p>

                {/* Brands inside category */}
                <div className="mt-6 pt-5 border-t border-slate-100">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">
                    Featured Brands in {category.name}:
                  </p>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {categoryBrands.length > 0 ? (
                      categoryBrands.map((brand) => (
                        <Link
                          key={brand.id}
                          href={`/category/${category.slug}/${brand.slug}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-300 text-xs font-semibold transition-all group/brand"
                        >
                          <BadgeCheck className="w-3.5 h-3.5 text-blue-500 group-hover/brand:scale-110 transition-transform" />
                          <span>{brand.name}</span>
                        </Link>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400 italic">
                        Premium brands available on inquiry
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Card Footer Link */}
              <div className="px-6 sm:px-8 py-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between group-hover:bg-blue-50/50 transition-colors">
                <Link
                  href={`/category/${category.slug}`}
                  className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-blue-600 inline-flex items-center gap-1"
                >
                  <span>Explore {category.name}</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <a
                  href={`https://wa.me/923086235608?text=I%20am%20interested%20in%20${encodeURIComponent(
                    category.name
                  )}%20materials`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-emerald-600 transition-colors"
                  title="Quick WhatsApp quote"
                >
                  <MessageCircle className="w-4 h-4" />
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {/* Partner Brands Showcase Grid */}
      <div className="mt-16 sm:mt-20 p-6 sm:p-10 rounded-2xl bg-white border border-slate-200/90 shadow-sm">
        <div className="text-center max-w-xl mx-auto mb-8">
          <span className="inline-flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-widest text-slate-400 mb-1">
            Authorized Supplier
          </span>
          <h3 className="text-lg sm:text-2xl font-black text-slate-900">
            Partner Brands We Stock
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Official stockists for leading sanitary, ceramic, cable, and cement
            manufacturers.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4">
          {brands.map((brand) => (
            <div
              key={brand.id}
              className="flex flex-col items-center justify-center p-3.5 sm:p-4 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-blue-400 hover:bg-white hover:shadow-md transition-all text-center group cursor-default"
            >
              <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-blue-600 mb-2 group-hover:scale-110 transition-transform">
                <BadgeCheck className="w-4 h-4" />
              </div>
              <span className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                {brand.name}
              </span>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">
                Original
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Skeleton Placeholder for streaming Suspense
function CatalogLoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 animate-pulse shadow-sm"
        >
          <div className="w-12 h-12 bg-slate-200 rounded-xl mb-5" />
          <div className="h-6 bg-slate-200 rounded-md w-2/3 mb-3" />
          <div className="h-4 bg-slate-200 rounded-md w-full mb-2" />
          <div className="h-4 bg-slate-200 rounded-md w-4/5 mb-6" />
          <div className="flex gap-2">
            <div className="h-7 w-20 bg-slate-200 rounded-lg" />
            <div className="h-7 w-24 bg-slate-200 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900">
      {/* 1. PREMIUM HERO SECTION (Nasgas-inspired industrial aesthetic) */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-900 text-white py-16 sm:py-24 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-r from-blue-600/15 via-sky-500/10 to-emerald-500/10 blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-800/90 border border-slate-700/80 text-xs sm:text-sm font-semibold text-emerald-400 mb-6 backdrop-blur-md shadow-sm">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>Authorized Distributors &amp; Wholesale Suppliers in Lahore</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-white max-w-4xl mx-auto leading-tight sm:leading-none">
            Premier Sanitary, Electric &amp;{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-sky-300 to-emerald-400">
              Building Materials
            </span>
          </h1>

          <p className="mt-5 sm:mt-6 text-sm sm:text-lg md:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Welcome to <strong className="text-white">M Murad Sons</strong>.
            Supplying top-quality Sanitary ware, certified Electrical cables, and
            essential Building Materials with guaranteed authenticity and fast
            site delivery across Lahore.
          </p>

          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4 max-w-md mx-auto sm:max-w-none">
            <a
              href="#catalog"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg shadow-blue-600/25 transition-all hover:-translate-y-0.5 active:translate-y-0"
            >
              <span>View Catalog</span>
              <ArrowRight className="w-4 h-4" />
            </a>

            <a
              href="https://wa.me/923086235608"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-600/25 transition-all hover:-translate-y-0.5 active:translate-y-0"
            >
              <MessageCircle className="w-4 h-4 fill-current" />
              <span>Get WhatsApp Rates</span>
            </a>
          </div>

          <div className="mt-12 sm:mt-16 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 pt-8 border-t border-slate-800/80 text-left">
            <div className="flex items-center gap-3 p-3 sm:p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
              <Truck className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <h2 className="text-xs sm:text-sm font-bold text-white">
                  Fast Lahore Delivery
                </h2>
                <p className="text-[11px] sm:text-xs text-slate-400">
                  Direct to site or home
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 sm:p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
              <ShieldCheck className="w-5 h-5 text-blue-400 shrink-0" />
              <div>
                <h2 className="text-xs sm:text-sm font-bold text-white">
                  100% Genuine
                </h2>
                <p className="text-[11px] sm:text-xs text-slate-400">
                  Certified manufacturer stock
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 sm:p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
              <Layers className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <h2 className="text-xs sm:text-sm font-bold text-white">
                  Wholesale Rates
                </h2>
                <p className="text-[11px] sm:text-xs text-slate-400">
                  Contractor discounts
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 sm:p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
              <MessageCircle className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <h2 className="text-xs sm:text-sm font-bold text-white">
                  Live Rates
                </h2>
                <p className="text-[11px] sm:text-xs text-slate-400">
                  WhatsApp: 0308 6235608
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. BROWSE BY CATEGORY & BRANDS SECTION */}
      <section id="catalog" className="py-14 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 sm:mb-12 gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-600 mb-2">
                <span className="w-2 h-2 rounded-full bg-blue-600" />
                <span>Our Product Catalog</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                Browse by Category &amp; Brands
              </h2>
              <p className="text-sm sm:text-base text-slate-600 mt-2 max-w-2xl">
                Explore our full line of sanitary fixtures, industrial wiring,
                and construction supplies from Pakistan&apos;s leading brands.
              </p>
            </div>

            <a
              href="https://wa.me/923086235608?text=Hello%20M%20Murad%20Sons,%20I%20would%20like%20to%20inquire%20about%20building%20material%20rates."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs sm:text-sm font-bold transition-colors w-fit"
            >
              <MessageCircle className="w-4 h-4 fill-emerald-600 text-emerald-600" />
              <span>Inquire for Custom Order</span>
            </a>
          </div>

          {/* Suspense streaming boundary for dynamic Supabase data */}
          <Suspense fallback={<CatalogLoadingSkeleton />}>
            <CatalogSection />
          </Suspense>
        </div>
      </section>

      {/* 3. WHATSAPP FLOATING CTA BANNER */}
      <section className="bg-slate-900 text-white py-12 px-4 sm:px-6 lg:px-8 border-t border-slate-800">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-white">
              Need bulk building materials or contractor estimates?
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
              Connect directly with M Murad Sons via WhatsApp for real-time
              quotes on Porta, Faisal Sanitary, GM Cables, and Bestway Cement.
            </p>
          </div>
          <a
            href="https://wa.me/923086235608"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition-all hover:scale-105 shrink-0"
          >
            <MessageCircle className="w-5 h-5 fill-current" />
            <span>Chat on WhatsApp (0308 6235608)</span>
          </a>
        </div>
      </section>
    </div>
  );
}
