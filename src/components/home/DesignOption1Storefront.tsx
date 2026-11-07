"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Star,
  Heart,
  Eye,
  ShoppingCart,
  Check,
  Truck,
  ShieldCheck,
  Headphones,
  MessageCircle,
  Award,
  Layers,
  CheckCircle2,
  X,
  Phone,
  Droplets,
  Zap,
  Building2,
  Package,
} from "lucide-react";

export interface StoreProduct {
  id: string;
  name: string;
  slug: string;
  categorySlug: string;
  categoryName: string;
  brand: string;
  oldPrice: number | null;
  price: number;
  discount: string | null;
  rating: number;
  reviewsCount: number;
  inStock: boolean;
  isDailyRate?: boolean;
  unit?: string;
  description: string;
  graphicType:
    | "nano-sink"
    | "marble-basin"
    | "vanity-set"
    | "porta-commode"
    | "rain-shower"
    | "faisal-shower"
    | "basin-mixer"
    | "pprc-pipe"
    | "duraflow-pipe"
    | "upvc-pipe"
    | "gm-cable-729"
    | "gm-cable-329"
    | "dura-tank"
    | "bestway-cement"
    | "bricks"
    | "sand"
    | "crush";
}

const option1Catalog: StoreProduct[] = [
  {
    id: "p-1",
    name: "Chinese Black Nano Waterfall Kitchen Sink (Double Bowl + Pull-Down Mixer)",
    slug: "chinese-black-nano-waterfall-sink",
    categorySlug: "chinese-sinks",
    categoryName: "Chinese Sinks & Marble Basins",
    brand: "Imported China",
    oldPrice: 42000,
    price: 34500,
    discount: "-18%",
    rating: 5,
    reviewsCount: 24,
    inStock: true,
    description: "Premium SUS-304 honeycomb nano embossed basin with digital water temperature LED display, cup rinser, cutting board, and 3-mode gold pull-down spray faucet.",
    graphicType: "nano-sink",
  },
  {
    id: "p-2",
    name: "Chinese Natural Marble Tabletop Wash Basin (Warm Gold Vein)",
    slug: "chinese-natural-marble-basin",
    categorySlug: "chinese-sinks",
    categoryName: "Chinese Sinks & Marble Basins",
    brand: "Imported China",
    oldPrice: 24000,
    price: 19500,
    discount: "-19%",
    rating: 5,
    reviewsCount: 16,
    inStock: true,
    description: "Carved from solid natural marble with warm gold and cream veining. High-gloss stain-resistant protective seal. Ideal for luxury powder rooms.",
    graphicType: "marble-basin",
  },
  {
    id: "p-3",
    name: "Imported Luxury Bathroom Vanity Set with Smart LED Mirror",
    slug: "luxury-bathroom-vanity-smart-mirror",
    categorySlug: "chinese-sinks",
    categoryName: "Chinese Sinks & Marble Basins",
    brand: "Imported China",
    oldPrice: 65000,
    price: 54000,
    discount: "-17%",
    rating: 5,
    reviewsCount: 19,
    inStock: true,
    description: "Multi-layer waterproof solid plywood floating vanity cabinet, seamless porcelain wash basin, soft-close hardware, and touch-sensor defogger LED mirror.",
    graphicType: "vanity-set",
  },
  {
    id: "p-4",
    name: "Porta Rimless One-Piece Fancy Commode",
    slug: "porta-rimless-one-piece-commode",
    categorySlug: "sanitary",
    categoryName: "Sanitary & Porta/Faisal",
    brand: "Porta",
    oldPrice: 44000,
    price: 37400,
    discount: "-15%",
    rating: 5,
    reviewsCount: 35,
    inStock: true,
    description: "Authentic Porta luxury one-piece water closet. 360-degree rimless tornado siphon jet flushing, anti-bacterial glaze, and heavy UF soft-close hydraulic seat.",
    graphicType: "porta-commode",
  },
  {
    id: "p-5",
    name: "Porta Complete Rain Shower & Mixer Set",
    slug: "porta-complete-rain-shower-set",
    categorySlug: "sanitary",
    categoryName: "Sanitary & Porta/Faisal",
    brand: "Porta",
    oldPrice: 31000,
    price: 26500,
    discount: "-15%",
    rating: 5,
    reviewsCount: 21,
    inStock: true,
    description: "Solid brass column with ultra-thin stainless steel rain shower head, handheld telephone shower, and dual-diverter thermostatic mixer valve.",
    graphicType: "rain-shower",
  },
  {
    id: "p-6",
    name: "Faisal Sanitary Complete Shower Set (Chrome Brass)",
    slug: "faisal-sanitary-shower-set-chrome",
    categorySlug: "sanitary",
    categoryName: "Sanitary & Porta/Faisal",
    brand: "Faisal Sanitary",
    oldPrice: 32000,
    price: 28800,
    discount: "-10%",
    rating: 5,
    reviewsCount: 29,
    inStock: true,
    description: "Heavy forged brass body with multi-layer nickel-chrome mirror finish. Lifetime casing integrity and anti-drip ceramic discs.",
    graphicType: "faisal-shower",
  },
  {
    id: "p-7",
    name: "Faisal Sanitary Lever Wash Basin Mixer",
    slug: "faisal-sanitary-basin-mixer",
    categorySlug: "sanitary",
    categoryName: "Sanitary & Porta/Faisal",
    brand: "Faisal Sanitary",
    oldPrice: 9500,
    price: 8550,
    discount: "-10%",
    rating: 5,
    reviewsCount: 38,
    inStock: true,
    description: "Ergonomic single-lever hot and cold water mixing tap. High-flow honeycomb aerator for splash-free, water-saving stream.",
    graphicType: "basin-mixer",
  },
  {
    id: "p-8",
    name: "Popular PPR-C Pipe 25mm (PN-16, 4M Length)",
    slug: "popular-pprc-pipe-25mm",
    categorySlug: "pipes",
    categoryName: "Pipes & Water Tanks",
    brand: "Popular Pipes",
    oldPrice: 740,
    price: 481,
    discount: "-35% Wholesale",
    rating: 5,
    reviewsCount: 52,
    inStock: true,
    description: "Official Popular PPR-C hot & cold concealed plumbing pipe. High pressure PN-16 rating, fusion-weld leak-proof joints, 50-year service life.",
    graphicType: "pprc-pipe",
  },
  {
    id: "p-9",
    name: "DuraFlow PPR-C Pipe 32mm (PN-16, 4M Length)",
    slug: "duraflow-pprc-pipe-32mm",
    categorySlug: "pipes",
    categoryName: "Pipes & Water Tanks",
    brand: "DuraFlow",
    oldPrice: 2381,
    price: 1429,
    discount: "-40% Wholesale",
    rating: 5,
    reviewsCount: 28,
    inStock: true,
    description: "32mm main distribution pressure pipe for residential multi-bath plumbing lines. Factory direct discount for contractors.",
    graphicType: "duraflow-pipe",
  },
  {
    id: "p-10",
    name: "Dura Max U-PVC Pipe 3 Inch / 4 Inch (13ft Length)",
    slug: "dura-max-upvc-pipe-3-4-inch",
    categorySlug: "pipes",
    categoryName: "Pipes & Water Tanks",
    brand: "DuraMax",
    oldPrice: 5360,
    price: 2787,
    discount: "-48% Wholesale",
    rating: 5,
    reviewsCount: 34,
    inStock: true,
    description: "High-impact unplasticized PVC soil waste and drainage pipe. Corrosion-free, mirror-smooth interior to eliminate blockage.",
    graphicType: "upvc-pipe",
  },
  {
    id: "p-11",
    name: "GM Cable 7/29 Single Core Pure Copper (90m Coil)",
    slug: "gm-cable-7-29-pure-copper",
    categorySlug: "electric",
    categoryName: "Electric & GM Cables",
    brand: "GM Cables",
    oldPrice: 15630,
    price: 13754,
    discount: "-12%",
    rating: 5,
    reviewsCount: 64,
    inStock: true,
    description: "Certified 99.9% pure copper electrolytic wire for air conditioning circuits, sub-mains, and heavy load residential installations.",
    graphicType: "gm-cable-729",
  },
  {
    id: "p-12",
    name: "GM Cable 3/29 Single Core Pure Copper (90m Coil)",
    slug: "gm-cable-3-29-pure-copper",
    categorySlug: "electric",
    categoryName: "Electric & GM Cables",
    brand: "GM Cables",
    oldPrice: 7200,
    price: 6336,
    discount: "-12%",
    rating: 5,
    reviewsCount: 45,
    inStock: true,
    description: "Standard domestic wiring single-core cable for general lighting, sockets, and switchboards. Guaranteed low electrical resistance.",
    graphicType: "gm-cable-329",
  },
  {
    id: "p-13",
    name: "Dura Heavy-Duty Triple-Layer Water Tank (1000 Liters)",
    slug: "dura-triple-layer-water-tank-1000l",
    categorySlug: "pipes",
    categoryName: "Pipes & Water Tanks",
    brand: "Dura Water Tanks",
    oldPrice: 22000,
    price: 18500,
    discount: "-16%",
    rating: 5,
    reviewsCount: 22,
    inStock: true,
    description: "100% virgin food-grade polymer. Inner anti-algae layer, middle heat insulation barrier, and outer UV-stabilized weather barrier.",
    graphicType: "dura-tank",
  },
  // 4 Fluctuating Daily Rate Items
  {
    id: "p-14",
    name: "Bestway Cement 50kg Bag (Ordinary Portland Cement)",
    slug: "bestway-cement-50kg",
    categorySlug: "building-material",
    categoryName: "Building Material",
    brand: "Bestway Cement",
    oldPrice: null,
    price: 0,
    discount: null,
    rating: 5,
    reviewsCount: 78,
    inStock: true,
    isDailyRate: true,
    unit: "50kg Bag",
    description: "Fresh factory batch OPC for concrete slabs, columns, and structural masonry. Daily government/factory regulated rates.",
    graphicType: "bestway-cement",
  },
  {
    id: "p-15",
    name: "A-Grade Awal Red Clay Bricks (Per 1000 / Site Dumper Trolley)",
    slug: "awal-red-clay-bricks",
    categorySlug: "building-material",
    categoryName: "Building Material",
    brand: "Awal Bhatta Bricks",
    oldPrice: null,
    price: 0,
    discount: null,
    rating: 5,
    reviewsCount: 56,
    inStock: true,
    isDailyRate: true,
    unit: "Per 1000 Bricks",
    description: "First-class machine-baked kiln bricks with ringing metallic sound and uniform sharp edges. Direct dispatch from Bhatta to Lahore sites.",
    graphicType: "bricks",
  },
  {
    id: "p-16",
    name: "Ravi & Chenab Sifted Sand (Rait Truck Dumper / Trolley)",
    slug: "chenab-ravi-sand-trolley",
    categorySlug: "building-material",
    categoryName: "Building Material",
    brand: "Chenab & Ravi Sand",
    oldPrice: null,
    price: 0,
    discount: null,
    rating: 5,
    reviewsCount: 41,
    inStock: true,
    isDailyRate: true,
    unit: "Trolley / Truck Dumper",
    description: "Triple-sifted, zero-silt washed river sand for high-strength concrete mixing, plastering, and masonry leveling.",
    graphicType: "sand",
  },
  {
    id: "p-17",
    name: "Sargodha Mountain Plant Crush / Bajri (Truck Dumper / Trolley)",
    slug: "sargodha-mountain-crush",
    categorySlug: "building-material",
    categoryName: "Building Material",
    brand: "Sargodha Plant Bajri",
    oldPrice: null,
    price: 0,
    discount: null,
    rating: 5,
    reviewsCount: 49,
    inStock: true,
    isDailyRate: true,
    unit: "Per 100 CFT / Trolley",
    description: "Pure Sargodha granite crushed gravel (1/2 inch & 3/4 inch mix). Optimum aggregate grading for heavy load slabs and foundations.",
    graphicType: "crush",
  },
];

// Circular Popular Categories (Section 2)
const popularCategoriesCircular = [
  { name: "Porta Sanitary", count: 78, filterKey: "sanitary", icon: "commode" },
  { name: "Faisal Fittings", count: 145, filterKey: "sanitary", icon: "faucet" },
  { name: "Chinese Marble Basins & Sinks", count: 52, filterKey: "chinese-sinks", icon: "basin" },
  { name: "Popular & DuraFlow Pipes", count: 120, filterKey: "pipes", icon: "pipe" },
  { name: "GM & New Age Cables", count: 94, filterKey: "electric", icon: "cable" },
  { name: "Dura Water Tanks", count: 38, filterKey: "pipes", icon: "tank" },
];

export default function DesignOption1Storefront() {
  // Hero slider state
  const [currentSlide, setCurrentSlide] = useState(0);
  const heroSlides = [
    {
      badge: "EXCLUSIVE LAHORE WHOLESALE SHOWROOM",
      headline: "UPGRADE YOUR SPACE",
      subtitle: "Luxury Chinese Black Nano Sinks, Marble Basins & Sanitary Fittings",
      description: "Direct importer & authorized distributor. Complete bathroom vanities, Porta rimless commodes, and Popular pipes at guaranteed distributor discounts.",
      ctaPrimary: "Shop Now",
      ctaSecondary: "Check Today's Rates",
      filterTarget: "chinese-sinks",
    },
    {
      badge: "AUTHORIZED PLUMBING & SANITARY PARTNER",
      headline: "AUTHENTIC SANITARY SOLUTIONS",
      subtitle: "Porta One-Piece Commodes & Faisal Heavy Brass Shower Sets",
      description: "Official manufacturer warranty with on-site dispatch across Lake City, Adda Plot, Raiwind Road, and all of Lahore.",
      ctaPrimary: "Explore Sanitary",
      ctaSecondary: "WhatsApp Quotation",
      filterTarget: "sanitary",
    },
    {
      badge: "DIRECT FACTORY RATES & FAST SITE DISPATCH",
      headline: "GENUINE PIPING & CABLES",
      subtitle: "Popular PPR-C (40% OFF), DuraFlow (48% OFF) & GM Pure Copper",
      description: "Complete building material and electrical inventory for architects, builders, and smart homeowners.",
      ctaPrimary: "View Rate Sheet",
      ctaSecondary: "Ask Today's Rate",
      filterTarget: "pipes",
    },
  ];

  // Auto-slide 5000ms
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  // Filter and card states
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [quickViewProduct, setQuickViewProduct] = useState<StoreProduct | null>(null);
  const [cartToast, setCartToast] = useState<string | null>(null);

  const filteredProducts =
    selectedFilter === "all"
      ? option1Catalog
      : option1Catalog.filter((p) => p.categorySlug === selectedFilter);

  const handleAddToCart = (product: StoreProduct) => {
    setCartToast(product.name);
    setTimeout(() => {
      setCartToast(null);
    }, 2200);
  };

  const handleCategoryClick = (filterKey: string) => {
    setSelectedFilter(filterKey);
    const target = document.getElementById("best-sellers");
    if (target) {
      target.scrollIntoView({ behavior: "smooth" });
    }
  };

  // High-key Studio Product Graphics Generator (Zero dark shadows, pearl/ice-blue background)
  const renderStudioGraphic = (type: StoreProduct["graphicType"]) => {
    switch (type) {
      case "nano-sink":
        return (
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-b from-[#EAF3FB] to-[#F8FBFF] border border-[#D5E6F7] flex flex-col items-center justify-center p-3 shadow-sm">
            <Droplets className="w-10 h-10 text-[#185DB5] mb-1" />
            <span className="text-[10px] font-black uppercase tracking-wider text-[#185DB5]">Nano Sink</span>
          </div>
        );
      case "marble-basin":
        return (
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-b from-[#FFF9EE] to-[#FFFDF9] border border-[#E6D3A3] flex flex-col items-center justify-center p-3 shadow-sm">
            <Sparkles className="w-10 h-10 text-[#C59B27] mb-1" />
            <span className="text-[10px] font-black uppercase tracking-wider text-[#C59B27]">Marble Basin</span>
          </div>
        );
      case "vanity-set":
        return (
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-b from-[#F2F6FA] to-[#FAFCFE] border border-[#D5E6F7] flex flex-col items-center justify-center p-3 shadow-sm">
            <Layers className="w-10 h-10 text-[#185DB5] mb-1" />
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-800">LED Vanity</span>
          </div>
        );
      case "porta-commode":
        return (
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-b from-[#EAF3FB] to-[#FFFFFF] border border-[#D5E6F7] flex flex-col items-center justify-center p-3 shadow-sm">
            <ShieldCheck className="w-10 h-10 text-[#185DB5] mb-1" />
            <span className="text-[10px] font-black uppercase tracking-wider text-[#185DB5]">Porta Rimless</span>
          </div>
        );
      case "rain-shower":
      case "faisal-shower":
      case "basin-mixer":
        return (
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-b from-[#EAF3FB] to-[#F8FBFF] border border-[#D5E6F7] flex flex-col items-center justify-center p-3 shadow-sm">
            <Droplets className="w-10 h-10 text-[#C59B27] mb-1" />
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-800">Brass Chrome</span>
          </div>
        );
      case "pprc-pipe":
      case "duraflow-pipe":
      case "upvc-pipe":
        return (
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-b from-[#EEF8F2] to-[#F8FCF9] border border-[#C6EAD3] flex flex-col items-center justify-center p-3 shadow-sm">
            <Layers className="w-10 h-10 text-emerald-600 mb-1" />
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800">PPR-C &amp; uPVC</span>
          </div>
        );
      case "gm-cable-729":
      case "gm-cable-329":
        return (
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-b from-[#FFF5EC] to-[#FFFAF5] border border-[#FAD9BD] flex flex-col items-center justify-center p-3 shadow-sm">
            <Zap className="w-10 h-10 text-amber-600 mb-1" />
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-800">99.9% Copper</span>
          </div>
        );
      case "dura-tank":
        return (
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-b from-[#EAF3FB] to-[#F8FBFF] border border-[#D5E6F7] flex flex-col items-center justify-center p-3 shadow-sm">
            <Package className="w-10 h-10 text-[#185DB5] mb-1" />
            <span className="text-[10px] font-black uppercase tracking-wider text-[#185DB5]">Dura Tank</span>
          </div>
        );
      case "bestway-cement":
      case "bricks":
      case "sand":
      case "crush":
      default:
        return (
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-b from-[#F5F5F7] to-[#FAF8F5] border border-[#E6D3A3] flex flex-col items-center justify-center p-3 shadow-sm">
            <Building2 className="w-10 h-10 text-[#C59B27] mb-1" />
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-800">Daily Rate</span>
          </div>
        );
    }
  };

  return (
    <div className="w-full bg-white text-slate-900 font-sans">
      {/* Toast notification for Cart additions */}
      {cartToast && (
        <div className="fixed top-24 right-5 z-50 bg-[#185DB5] text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 animate-bounce border-2 border-[#C59B27]">
          <CheckCircle2 className="w-5 h-5 text-[#C59B27]" />
          <span className="text-xs font-bold">Added to Cart: {cartToast}</span>
        </div>
      )}

      {/* ========================================================
          1. BRIGHT HERO BANNER SLIDER (Soft Ice-Blue Studio Gradient)
          bg-gradient-to-r from-[#E3F0FC] via-[#F0F7FD] to-[#FAF8F5]
      ======================================================== */}
      <section className="relative w-full overflow-hidden border-b border-slate-200">
        <div className="relative min-h-[480px] sm:min-h-[540px] flex items-center bg-gradient-to-r from-[#E3F0FC] via-[#F0F7FD] to-[#FAF8F5]">
          {heroSlides.map((slide, idx) => (
            <div
              key={idx}
              className={`absolute inset-0 w-full h-full flex items-center transition-opacity duration-700 ${
                idx === currentSlide ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
              }`}
            >
              <div className="max-w-7xl mx-auto px-6 sm:px-12 w-full py-16 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                {/* Left Typography Block */}
                <div className="lg:col-span-7 space-y-4 text-left">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/80 border border-[#E6D3A3] text-[#C59B27] text-xs font-black tracking-widest uppercase shadow-xs">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{slide.badge}</span>
                  </div>

                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#0F294A] tracking-tight leading-[1.08]">
                    {slide.headline}
                  </h1>

                  <h2 className="text-xl sm:text-2xl font-black text-[#C59B27] tracking-tight">
                    {slide.subtitle}
                  </h2>

                  <p className="text-xs sm:text-sm text-slate-600 max-w-xl leading-relaxed font-medium">
                    {slide.description}
                  </p>

                  <div className="pt-3 flex flex-wrap items-center gap-4">
                    <button
                      type="button"
                      onClick={() => handleCategoryClick(slide.filterTarget)}
                      className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#185DB5] hover:bg-[#13498F] text-white font-black text-xs sm:text-sm tracking-wide shadow-md transition transform hover:-translate-y-0.5 cursor-pointer"
                    >
                      <span>{slide.ctaPrimary}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>

                    <a
                      href="https://wa.me/923217165000?text=Assalam-o-Alaikum!%20Please%20share%20today's%20discount%20rate%20sheet."
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-[#C59B27] hover:bg-[#b08920] text-slate-950 font-black text-xs sm:text-sm tracking-wide shadow-md transition transform hover:-translate-y-0.5"
                    >
                      <MessageCircle className="w-4 h-4 fill-slate-950" />
                      <span>{slide.ctaSecondary}</span>
                    </a>
                  </div>
                </div>

                {/* Right Bright Showroom Showcase Card */}
                <div className="hidden lg:flex lg:col-span-5 justify-center">
                  <div className="relative w-84 rounded-3xl bg-white p-7 border-2 border-[#E6D3A3] shadow-xl flex flex-col justify-between">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                        Lahore Authorized Store
                      </span>
                      <span className="text-[11px] font-black text-[#185DB5] bg-[#EAF3FB] px-2.5 py-0.5 rounded-full">
                        Original Stock
                      </span>
                    </div>

                    <div className="py-5 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#EEF5FC] text-[#185DB5] flex items-center justify-center shrink-0">
                          <Check className="w-5 h-5 stroke-[2.5]" />
                        </div>
                        <div>
                          <p className="text-xs font-black text-[#0F294A]">Direct Wholesale Rates</p>
                          <p className="text-[11px] text-slate-500">Popular (40% OFF), DuraFlow (48% OFF)</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#FFF9EE] text-[#C59B27] flex items-center justify-center shrink-0">
                          <Truck className="w-5 h-5 stroke-[2.5]" />
                        </div>
                        <div>
                          <p className="text-xs font-black text-[#0F294A]">Fast Site Delivery</p>
                          <p className="text-[11px] text-slate-500">Lake City, Adda Plot, Raiwind Road</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#EEF5FC] text-[#185DB5] flex items-center justify-center shrink-0">
                          <Award className="w-5 h-5 stroke-[2.5]" />
                        </div>
                        <div>
                          <p className="text-xs font-black text-[#0F294A]">100% Genuine Brands</p>
                          <p className="text-[11px] text-slate-500">Porta, Faisal, GM Cables, Bestway</p>
                        </div>
                      </div>
                    </div>

                    <div className="text-center font-black text-xs text-[#0F294A] bg-[#EEF5FC] py-2.5 rounded-xl border border-[#D5E6F7]">
                      📞 Direct Desk: 0321-7165000 | 0308-6235608
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Slider Controls */}
        <button
          type="button"
          onClick={() => setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length)}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-slate-800 shadow flex items-center justify-center transition border border-slate-200 cursor-pointer"
          aria-label="Previous Slide"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={() => setCurrentSlide((prev) => (prev + 1) % heroSlides.length)}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-slate-800 shadow flex items-center justify-center transition border border-slate-200 cursor-pointer"
          aria-label="Next Slide"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Bottom Pagination Dots */}
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
          {heroSlides.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentSlide(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              className={`transition-all duration-300 cursor-pointer ${
                idx === currentSlide
                  ? "w-8 h-2.5 bg-[#185DB5] rounded-full"
                  : "w-2.5 h-2.5 bg-slate-300 hover:bg-slate-400 rounded-full"
              }`}
            />
          ))}
        </div>
      </section>

      {/* ========================================================
          2. SECTION: Shop by Popular Category (Circular Studio Frames)
          w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-[#EEF5FC] border-2 border-[#E6D3A3]
      ======================================================== */}
      <section className="py-14 sm:py-20 px-4 sm:px-8 max-w-7xl mx-auto text-center">
        <h2 className="text-2xl sm:text-3xl font-black text-[#0F294A] tracking-tight mb-2">
          Shop by Popular Category
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mb-10 font-medium">
          Select any department to view authentic models, sizes, and live wholesale discounts.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 sm:gap-8 justify-items-center">
          {popularCategoriesCircular.map((cat, idx) => (
            <div
              key={idx}
              onClick={() => handleCategoryClick(cat.filterKey)}
              className="flex flex-col items-center cursor-pointer group"
            >
              {/* Circular Studio Frame */}
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-[#EEF5FC] border-2 border-[#E6D3A3] flex items-center justify-center relative shadow-sm group-hover:scale-105 group-hover:border-[#185DB5] group-hover:shadow-md transition-all duration-300">
                {/* Top-Right Count Badge */}
                <span className="bg-[#222222] text-white text-[10px] font-black px-2 py-0.5 rounded-full absolute top-1 right-1 shadow-sm">
                  {cat.count}
                </span>

                {/* Inner Graphic */}
                <div className="transform group-hover:scale-110 transition-transform duration-300">
                  {cat.icon === "commode" && <ShieldCheck className="w-10 h-10 text-[#185DB5]" />}
                  {cat.icon === "faucet" && <Droplets className="w-10 h-10 text-[#C59B27]" />}
                  {cat.icon === "basin" && <Sparkles className="w-10 h-10 text-[#C59B27]" />}
                  {cat.icon === "pipe" && <Layers className="w-10 h-10 text-emerald-600" />}
                  {cat.icon === "cable" && <Zap className="w-10 h-10 text-amber-600" />}
                  {cat.icon === "tank" && <Package className="w-10 h-10 text-[#185DB5]" />}
                </div>
              </div>

              {/* Title & Count Below */}
              <h3 className="text-xs sm:text-sm font-black text-[#0F294A] group-hover:text-[#185DB5] mt-3 leading-snug transition-colors">
                {cat.name}
              </h3>
              <span className="text-[11px] text-slate-500 font-bold mt-0.5">
                {cat.count} Items
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================
          3. SECTION: 4 Rounded Lifestyle Category Cards (Bright Sunlit Backgrounds)
      ======================================================== */}
      <section className="py-10 px-4 sm:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1 */}
          <div
            onClick={() => handleCategoryClick("sanitary")}
            className="rounded-2xl overflow-hidden relative p-6 border-2 border-[#E6D3A3] bg-gradient-to-br from-[#F0F7FD] via-[#F8FBFF] to-[#FAF8F5] shadow-sm hover:shadow-md transition flex flex-col justify-between h-72 cursor-pointer group"
          >
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#185DB5]">
                Authorized Partner
              </span>
              <h3 className="text-lg font-black text-[#0F294A] leading-snug">
                Luxury Sanitaryware
              </h3>
              <p className="text-xs text-slate-600">
                Porta &amp; Faisal Commodes, Basins &amp; Complete Shower Sets
              </p>
            </div>
            <div>
              <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#C59B27] group-hover:bg-[#b08920] text-slate-950 font-black text-xs transition shadow-xs">
                Explore →
              </span>
            </div>
          </div>

          {/* Card 2 */}
          <div
            onClick={() => handleCategoryClick("pipes")}
            className="rounded-2xl overflow-hidden relative p-6 border-2 border-[#E6D3A3] bg-gradient-to-br from-[#EFF8F3] via-[#F8FCF9] to-[#FAF8F5] shadow-sm hover:shadow-md transition flex flex-col justify-between h-72 cursor-pointer group"
          >
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700">
                Up to 48% Wholesale OFF
              </span>
              <h3 className="text-lg font-black text-[#0F294A] leading-snug">
                Advanced Plumbing
              </h3>
              <p className="text-xs text-slate-600">
                Popular &amp; DuraFlow PPR-C / uPVC Pipes &amp; Pressure Fittings
              </p>
            </div>
            <div>
              <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#C59B27] group-hover:bg-[#b08920] text-slate-950 font-black text-xs transition shadow-xs">
                Explore →
              </span>
            </div>
          </div>

          {/* Card 3 */}
          <div
            onClick={() => handleCategoryClick("electric")}
            className="rounded-2xl overflow-hidden relative p-6 border-2 border-[#E6D3A3] bg-gradient-to-br from-[#FFF7ED] via-[#FFFAF5] to-[#FAF8F5] shadow-sm hover:shadow-md transition flex flex-col justify-between h-72 cursor-pointer group"
          >
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-700">
                99.9% Pure Copper
              </span>
              <h3 className="text-lg font-black text-[#0F294A] leading-snug">
                Premium Electric
              </h3>
              <p className="text-xs text-slate-600">
                GM Cables, New Age Cables, Breakers &amp; Modern Switches
              </p>
            </div>
            <div>
              <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#C59B27] group-hover:bg-[#b08920] text-slate-950 font-black text-xs transition shadow-xs">
                Explore →
              </span>
            </div>
          </div>

          {/* Card 4 */}
          <div
            onClick={() => handleCategoryClick("chinese-sinks")}
            className="rounded-2xl overflow-hidden relative p-6 border-2 border-[#E6D3A3] bg-gradient-to-br from-[#F5F3FF] via-[#FAF8FF] to-[#FAF8F5] shadow-sm hover:shadow-md transition flex flex-col justify-between h-72 cursor-pointer group"
          >
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700">
                Direct Import
              </span>
              <h3 className="text-lg font-black text-[#0F294A] leading-snug">
                Imported Sinks &amp; Vanities
              </h3>
              <p className="text-xs text-slate-600">
                Chinese Waterfall Sinks, Marble Art Basins &amp; LED Mirror Vanities
              </p>
            </div>
            <div>
              <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#C59B27] group-hover:bg-[#b08920] text-slate-950 font-black text-xs transition shadow-xs">
                Explore →
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          4. SECTION: Best Sellers & Online Rate List (4-Column Product Grid)
      ======================================================== */}
      <section id="best-sellers" className="py-14 sm:py-20 px-4 sm:px-8 max-w-7xl mx-auto scroll-mt-24">
        {/* Title */}
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-black text-[#0F294A] tracking-tight">
            Best Sellers &amp; Online Rate List
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            Transparent market rates with guaranteed manufacturer authenticity in Lahore.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center justify-center flex-wrap gap-2 mb-10">
          {[
            { key: "all", label: "All Products" },
            { key: "sanitary", label: "Sanitary & Porta/Faisal" },
            { key: "chinese-sinks", label: "Chinese Sinks & Marble Basins" },
            { key: "pipes", label: "Pipes & Water Tanks" },
            { key: "electric", label: "Electric & GM Cables" },
            { key: "building-material", label: "Building Material" },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setSelectedFilter(tab.key)}
              className={`px-4 py-2 rounded-full text-xs font-black transition cursor-pointer ${
                selectedFilter === tab.key
                  ? "bg-[#185DB5] text-white shadow-md shadow-blue-500/20"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 4-Column Responsive Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition flex flex-col justify-between group"
            >
              <div>
                {/* Top Soft Ice-Blue Studio Container bg-gradient-to-b from-[#EAF3FB] to-[#F5F9FD] */}
                <div className="bg-gradient-to-b from-[#EAF3FB] to-[#F5F9FD] rounded-lg p-5 aspect-square relative flex items-center justify-center overflow-hidden border border-[#D5E6F7]">
                  {/* Discount Badge */}
                  {product.discount && (
                    <span className="bg-[#185DB5] text-white text-[11px] font-black px-2 py-0.5 rounded absolute top-2 right-2 z-10 shadow-xs">
                      {product.discount}
                    </span>
                  )}

                  {/* Top-Left Quick Action Icons */}
                  <div className="absolute top-2 left-2 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <button
                      type="button"
                      onClick={() => setQuickViewProduct(product)}
                      className="w-7 h-7 rounded-full bg-white text-slate-800 hover:text-[#185DB5] shadow flex items-center justify-center transition"
                      title="Quick View"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => alert(`Added ${product.name} to wishlist.`)}
                      className="w-7 h-7 rounded-full bg-white text-slate-800 hover:text-[#185DB5] shadow flex items-center justify-center transition"
                      title="Add to Wishlist"
                    >
                      <Heart className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Product Graphic */}
                  <div className="transform group-hover:scale-105 transition-transform duration-300">
                    {renderStudioGraphic(product.graphicType)}
                  </div>
                </div>

                {/* Details */}
                <div className="pt-3 space-y-1.5 text-left">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#C59B27] bg-[#FFF9EE] px-2 py-0.5 rounded border border-[#E6D3A3]">
                    {product.brand}
                  </span>

                  <h3
                    onClick={() => setQuickViewProduct(product)}
                    className="text-xs sm:text-sm font-black text-[#0F294A] hover:text-[#185DB5] line-clamp-2 transition-colors cursor-pointer pt-0.5 leading-snug"
                  >
                    {product.name}
                  </h3>

                  {/* 5 Gold Stars */}
                  <div className="flex items-center gap-1 text-[11px]">
                    <div className="flex items-center text-[#C59B27]">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-[#C59B27]" />
                      ))}
                    </div>
                    <span className="text-slate-400 font-bold ml-1">({product.reviewsCount})</span>
                  </div>

                  {/* Price Row */}
                  <div className="pt-1">
                    {!product.isDailyRate ? (
                      <div className="flex items-baseline gap-2">
                        <span className="text-base font-black text-[#185DB5]">
                          PKR {product.price.toLocaleString("en-PK")}
                        </span>
                        {product.oldPrice && (
                          <span className="text-xs text-slate-400 line-through font-semibold">
                            PKR {product.oldPrice.toLocaleString("en-PK")}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <span className="inline-block px-2 py-0.5 bg-[#FFF9EE] text-[#C59B27] border border-[#E6D3A3] text-[11px] font-black rounded">
                          Daily Market Rate
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 mt-2 border-t border-slate-100">
                {!product.isDailyRate ? (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleAddToCart(product)}
                      className="py-2 px-2 rounded-lg bg-[#185DB5] hover:bg-[#13498F] text-white font-bold text-xs transition flex items-center justify-center gap-1 shadow-xs cursor-pointer"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      <span>Add to Cart</span>
                    </button>
                    <a
                      href={`https://wa.me/923217165000?text=${encodeURIComponent(
                        `Assalam-o-Alaikum! I want to order / check rates for: ${product.name} (PKR ${product.price})`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2 px-2 rounded-lg bg-[#C59B27] hover:bg-[#b08920] text-slate-950 font-black text-xs transition flex items-center justify-center gap-1 shadow-xs"
                    >
                      <MessageCircle className="w-3.5 h-3.5 fill-slate-950" />
                      <span>Buy Now</span>
                    </a>
                  </div>
                ) : (
                  <a
                    href={`https://wa.me/923217165000?text=${encodeURIComponent(
                      `Assalam-o-Alaikum M. Murad Sons! Please quote today's daily market rate for: ${product.name}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-3 rounded-lg bg-[#25D366] hover:bg-emerald-600 text-white font-black text-xs transition flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <MessageCircle className="w-4 h-4 fill-white" />
                    <span>Ask Today&apos;s Rate on WhatsApp (0321-7165000)</span>
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================
          5. SECTION: Authorized Brand Strip
      ======================================================== */}
      <section id="brands" className="py-12 bg-[#F8FBFF] border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 text-center">
          <h2 className="text-xl sm:text-2xl font-black text-[#0F294A] tracking-tight mb-2">
            Authorized Brands &amp; Supply Partners
          </h2>
          <p className="text-xs text-slate-500 mb-8 font-medium">
            Genuine guaranteed materials with official factory warranties and test standards.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
            {[
              "Porta",
              "Faisal Sanitary",
              "Popular Pipes",
              "DuraFlow",
              "GM Cables",
              "Dura Water Tanks",
              "NASGAS",
              "Bestway Cement",
            ].map((brand, i) => (
              <div
                key={i}
                className="bg-white border border-[#E6D3A3] rounded-xl p-3.5 flex items-center justify-center text-center shadow-xs hover:border-[#185DB5] hover:shadow-md transition"
              >
                <span className="text-xs font-black text-[#0F294A] tracking-wider">
                  {brand}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================
          QUICK VIEW MODAL
      ======================================================== */}
      {quickViewProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl relative border-2 border-[#E6D3A3] animate-scale-in">
            <button
              type="button"
              onClick={() => setQuickViewProduct(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-900 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
              <div className="bg-gradient-to-b from-[#EAF3FB] to-[#F5F9FD] rounded-xl aspect-square flex items-center justify-center p-6 border border-[#D5E6F7] relative">
                {quickViewProduct.discount && (
                  <span className="bg-[#185DB5] text-white text-xs font-black px-2 py-0.5 rounded absolute top-3 right-3">
                    {quickViewProduct.discount}
                  </span>
                )}
                {renderStudioGraphic(quickViewProduct.graphicType)}
              </div>

              <div className="space-y-3 text-left">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#C59B27] bg-[#FFF9EE] px-2 py-0.5 rounded border border-[#E6D3A3]">
                  {quickViewProduct.brand}
                </span>
                <h3 className="text-base font-black text-[#0F294A] leading-snug">
                  {quickViewProduct.name}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  {quickViewProduct.description}
                </p>

                <div className="pt-2 border-t border-slate-100">
                  {!quickViewProduct.isDailyRate ? (
                    <div>
                      {quickViewProduct.oldPrice && (
                        <span className="text-xs text-slate-400 line-through mr-2 font-bold">
                          PKR {quickViewProduct.oldPrice.toLocaleString("en-PK")}
                        </span>
                      )}
                      <span className="text-lg font-black text-[#185DB5]">
                        PKR {quickViewProduct.price.toLocaleString("en-PK")}
                      </span>
                    </div>
                  ) : (
                    <span className="inline-block px-3 py-1 bg-[#FFF9EE] text-[#C59B27] text-xs font-black rounded border border-[#E6D3A3]">
                      Daily Market Rate
                    </span>
                  )}
                </div>

                <div className="pt-2 space-y-2">
                  {!quickViewProduct.isDailyRate ? (
                    <button
                      type="button"
                      onClick={() => {
                        handleAddToCart(quickViewProduct);
                        setQuickViewProduct(null);
                      }}
                      className="w-full py-2.5 rounded-full bg-[#185DB5] hover:bg-[#13498F] text-white font-bold text-xs tracking-wide shadow transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      <span>Add to Cart</span>
                    </button>
                  ) : (
                    <a
                      href={`https://wa.me/923217165000?text=${encodeURIComponent(
                        `Assalam-o-Alaikum! Please quote today's daily rate for: ${quickViewProduct.name}`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 rounded-full bg-[#25D366] hover:bg-emerald-600 text-white font-black text-xs tracking-wide shadow transition flex items-center justify-center gap-2"
                    >
                      <MessageCircle className="w-4 h-4 fill-white" />
                      <span>Ask Today&apos;s Rate on WhatsApp</span>
                    </a>
                  )}

                  <a
                    href="tel:03217165000"
                    className="w-full py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold text-xs tracking-wide flex items-center justify-center gap-1.5 transition"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call Store: 0321-7165000</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
