import Link from "next/link";
import {
  ShieldCheck,
  Truck,
  MessageCircle,
  ArrowRight,
  Sparkles,
  Zap,
  Bath,
} from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white py-16 md:py-24 px-4 sm:px-6 lg:px-8">
        {/* Subtle background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto relative z-10 text-center">
          {/* Top Pill / Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-xs font-semibold text-emerald-400 mb-6 backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Authorized Sanitary &amp; Electrical Distributors in Lahore</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight">
            Welcome to{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-sky-300 to-emerald-400">
              M Murad Sons
            </span>
          </h1>

          {/* Subheading */}
          <p className="mt-5 text-base sm:text-lg md:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Your trusted store for Sanitary and Electric materials. Featuring
            genuine brands including Porta, Faisal Sanitary, Dell Ceramics, and
            premium imported materials.
          </p>

          {/* Action CTAs */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <Link
              href="/category/sanitary"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-lg shadow-blue-600/30 transition-all hover:-translate-y-0.5"
            >
              <Bath className="w-4 h-4" />
              <span>Browse Sanitary</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/category/electric"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-100 font-semibold transition-all hover:-translate-y-0.5"
            >
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Explore Electric</span>
            </Link>

            <a
              href="https://wa.me/923086235608"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-lg shadow-emerald-600/30 transition-all hover:-translate-y-0.5"
            >
              <MessageCircle className="w-4 h-4 fill-current" />
              <span>Get WhatsApp Rates</span>
            </a>
          </div>

          {/* Value Props Bar */}
          <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4 pt-10 border-t border-slate-800 text-left">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/40 border border-slate-700/50">
              <Truck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h2 className="text-sm font-semibold text-white">Fast Lahore Delivery</h2>
                <p className="text-xs text-slate-400">Direct to your construction site or doorstep</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/40 border border-slate-700/50">
              <ShieldCheck className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
              <div>
                <h2 className="text-sm font-semibold text-white">100% Genuine Brands</h2>
                <p className="text-xs text-slate-400">Porta, Faisal, Dell &amp; Imported</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/40 border border-slate-700/50">
              <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h2 className="text-sm font-semibold text-white">Wholesale Rates</h2>
                <p className="text-xs text-slate-400">Best bulk rates for contractors &amp; builders</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/40 border border-slate-700/50">
              <MessageCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h2 className="text-sm font-semibold text-white">Instant WhatsApp Rates</h2>
                <p className="text-xs text-slate-400">Daily updated pricing quotes via 0308 6235608</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* QUICK BRAND SHOWCASE */}
      <section className="py-12 bg-white px-4 border-b border-gray-100">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-6">
            Featured Sanitary &amp; Ceramic Brands
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { name: "Porta", desc: "Premium Sanitary Ware", href: "/category/sanitary/porta" },
              { name: "Faisal Sanitary", desc: "Master Craft Bathroom Taps", href: "/category/sanitary/faisal-sanitary" },
              { name: "Dell Ceramics", desc: "Luxury Bathroom Solutions", href: "/category/sanitary/dell-ceramics" },
              { name: "Imported China", desc: "Modern Vanities & Accessories", href: "/category/sanitary/imported-china" },
            ].map((brand) => (
              <Link
                key={brand.name}
                href={brand.href}
                className="group p-5 rounded-xl border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all text-left bg-gray-50 hover:bg-white"
              >
                <span className="text-base font-bold text-gray-900 group-hover:text-blue-600 transition-colors block">
                  {brand.name}
                </span>
                <span className="text-xs text-gray-500 mt-1 block">
                  {brand.desc}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
