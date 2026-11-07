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
  ShoppingBag,
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
  Flame,
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
  iconType: "sink" | "basin" | "vanity" | "commode" | "shower" | "tap" | "pipe" | "cable" | "tank" | "cement" | "brick" | "sand";
}

const defaultProductsCatalog: StoreProduct[] = [
  {
    id: "p-1",
    name: "Chinese Black Nano Waterfall Kitchen Sink with Pull-Down Digital Mixer",
    slug: "chinese-black-nano-waterfall-sink",
    categorySlug: "chinese-sinks",
    categoryName: "Chinese Sinks & Basins",
    brand: "Imported China",
    oldPrice: 42000,
    price: 34500,
    discount: "-18%",
    rating: 5,
    reviewsCount: 18,
    inStock: true,
    description: "Heavy 304 stainless steel honeycomb embossed basin, cup washer, piano key digital LED waterfall dispenser, and pull-out 3-mode faucet.",
    iconType: "sink",
  },
  {
    id: "p-2",
    name: "Imported Chinese Natural Marble Tabletop Art Basin (Gold & Cream Vein)",
    slug: "chinese-natural-marble-basin",
    categorySlug: "chinese-sinks",
    categoryName: "Chinese Sinks & Basins",
    brand: "Imported China",
    oldPrice: 24000,
    price: 19500,
    discount: "-19%",
    rating: 5,
    reviewsCount: 12,
    inStock: true,
    description: "Handcrafted natural stone vanity wash vessel basin with polished stain-resistant glaze. Perfect for powder washrooms and master baths.",
    iconType: "basin",
  },
  {
    id: "p-3",
    name: "Imported Wall-Hung Bathroom Vanity Cabinet with Smart LED Touch Mirror",
    slug: "wall-hung-bathroom-vanity-led-mirror",
    categorySlug: "chinese-sinks",
    categoryName: "Chinese Sinks & Basins",
    brand: "Imported China",
    oldPrice: 65000,
    price: 54000,
    discount: "-17%",
    rating: 5,
    reviewsCount: 9,
    inStock: true,
    description: "Waterproof solid plywood vanity cabinet with seamless ceramic basin and defogger smart sensor touch LED mirror.",
    iconType: "vanity",
  },
  {
    id: "p-4",
    name: "Porta Rimless One-Piece Luxury Commode (Soft-Close Seat & Dual Flush)",
    slug: "porta-rimless-one-piece-commode",
    categorySlug: "porta",
    categoryName: "Porta Sanitary",
    brand: "Porta",
    oldPrice: 44000,
    price: 37400,
    discount: "-15%",
    rating: 5,
    reviewsCount: 27,
    inStock: true,
    description: "High-grade vitreous china ceramic with siphon jet 360-degree rimless tornado flushing and UF heavy soft-closing hydraulic seat.",
    iconType: "commode",
  },
  {
    id: "p-5",
    name: "Porta Complete Bathroom Set (Commode + Pedestal Basin + Accessories)",
    slug: "porta-complete-bathroom-set",
    categorySlug: "porta",
    categoryName: "Porta Sanitary",
    brand: "Porta",
    oldPrice: 58000,
    price: 49300,
    discount: "-15%",
    rating: 5,
    reviewsCount: 14,
    inStock: true,
    description: "Official Porta sanitary full set including luxury commode, matching full pedestal wash basin, floor waste, and hardware fixtures.",
    iconType: "commode",
  },
  {
    id: "p-6",
    name: "Faisal Sanitary Complete Rain Shower & Mixer Set (Heavy Brass Chrome)",
    slug: "faisal-sanitary-rain-shower-set",
    categorySlug: "faisal",
    categoryName: "Faisal Fittings",
    brand: "Faisal Sanitary",
    oldPrice: 32000,
    price: 28800,
    discount: "-10%",
    rating: 5,
    reviewsCount: 31,
    inStock: true,
    description: "100% solid brass core master shower column with overhead ultra-slim rain head, hand sprayer, and anti-scalding thermostatic mixer.",
    iconType: "shower",
  },
  {
    id: "p-7",
    name: "Faisal Sanitary Single-Lever Wash Basin Mixer Tap",
    slug: "faisal-sanitary-basin-mixer-tap",
    categorySlug: "faisal",
    categoryName: "Faisal Fittings",
    brand: "Faisal Sanitary",
    oldPrice: 9500,
    price: 8550,
    discount: "-10%",
    rating: 5,
    reviewsCount: 22,
    inStock: true,
    description: "Premium chrome mirror plating with high-durability ceramic cartridge tested for 500,000 smooth cycles. Authentic Faisal warranty.",
    iconType: "tap",
  },
  {
    id: "p-8",
    name: "Popular PPR-C Pipe 25mm (PN-16, 4M Length — Hot & Cold Water)",
    slug: "popular-pprc-pipe-25mm",
    categorySlug: "pipes",
    categoryName: "Popular & DuraFlow Pipes",
    brand: "Popular Pipes",
    oldPrice: 740,
    price: 481,
    discount: "-35%",
    rating: 5,
    reviewsCount: 42,
    inStock: true,
    description: "Food-grade certified PPR-C pressure piping for residential concealed plumbing. Maximum heat and high pressure endurance.",
    iconType: "pipe",
  },
  {
    id: "p-9",
    name: "Popular U-PVC Drainage Pipe 4 Inch (Class 'O' Medium 13ft)",
    slug: "popular-upvc-drainage-pipe-4-inch",
    categorySlug: "pipes",
    categoryName: "Popular & DuraFlow Pipes",
    brand: "Popular Pipes",
    oldPrice: 6271,
    price: 3763,
    discount: "-40%",
    rating: 5,
    reviewsCount: 38,
    inStock: true,
    description: "Heavy-duty 4-inch underground & vertical soil waste line pipe. Chemical-resistant, leak-proof solvent cement weld jointing.",
    iconType: "pipe",
  },
  {
    id: "p-10",
    name: "DuraFlow PPR-C Pipe 32mm (PN-16, 4M Length)",
    slug: "duraflow-pprc-pipe-32mm",
    categorySlug: "pipes",
    categoryName: "Popular & DuraFlow Pipes",
    brand: "DuraFlow",
    oldPrice: 2381,
    price: 1429,
    discount: "-40%",
    rating: 5,
    reviewsCount: 19,
    inStock: true,
    description: "Specialized 32mm PPR-C main delivery pipe for multi-story residential plumbing networks and high-volume water pump lines.",
    iconType: "pipe",
  },
  {
    id: "p-11",
    name: "Dura Max U-PVC Pipe 3 Inch (13ft Length)",
    slug: "dura-max-upvc-pipe-3-inch",
    categorySlug: "pipes",
    categoryName: "Popular & DuraFlow Pipes",
    brand: "DuraMax",
    oldPrice: 5360,
    price: 2787,
    discount: "-48%",
    rating: 5,
    reviewsCount: 25,
    inStock: true,
    description: "Smooth interior bore to prevent clogging and sludge accumulation. 48% direct wholesale discount for contractors and builders.",
    iconType: "pipe",
  },
  {
    id: "p-12",
    name: "GM Cable 7/029 Single Core Pure Copper PVC (90 Meter Coil)",
    slug: "gm-cable-7-029-copper-coil",
    categorySlug: "cables",
    categoryName: "GM Cables & Electric",
    brand: "GM Cables",
    oldPrice: 15630,
    price: 13754,
    discount: "-12%",
    rating: 5,
    reviewsCount: 50,
    inStock: true,
    description: "99.9% pure electrolytic annealed copper wire. Ideal for air conditioner distribution, main distribution boards, and heavy appliances.",
    iconType: "cable",
  },
  {
    id: "p-13",
    name: "GM Cable 3/029 Single Core Pure Copper PVC (90 Meter Coil)",
    slug: "gm-cable-3-029-copper-coil",
    categorySlug: "cables",
    categoryName: "GM Cables & Electric",
    brand: "GM Cables",
    oldPrice: 7200,
    price: 6336,
    discount: "-12%",
    rating: 5,
    reviewsCount: 36,
    inStock: true,
    description: "Standard domestic lighting and power circuit cable. Fire-retardant grade insulation with certified resistance standards.",
    iconType: "cable",
  },
  {
    id: "p-14",
    name: "Dura Heavy-Duty Food-Grade Triple-Layer Water Tank (1000 Liters)",
    slug: "dura-triple-layer-water-tank-1000l",
    categorySlug: "tanks",
    categoryName: "Dura Water Tanks",
    brand: "Dura Tanks",
    oldPrice: 22000,
    price: 18500,
    discount: "-16%",
    rating: 5,
    reviewsCount: 15,
    inStock: true,
    description: "Anti-bacterial inner layer, UV sun-block thermal middle insulation, and reinforced ribbed outer body. Keeps water cool in extreme summer.",
    iconType: "tank",
  },
  // 4 Fluctuating Daily Rate Items
  {
    id: "p-15",
    name: "Bestway Cement 50kg Bag (OPC / High Strength Structural Grade)",
    slug: "bestway-cement-50kg-bag",
    categorySlug: "building-rates",
    categoryName: "Building Material Rates",
    brand: "Bestway Cement",
    oldPrice: null,
    price: 0,
    discount: null,
    rating: 5,
    reviewsCount: 65,
    inStock: true,
    isDailyRate: true,
    unit: "50kg Bag",
    description: "Fresh factory dispatch. Daily market regulated wholesale prices for residential & commercial foundations, slabs, and plastering.",
    iconType: "cement",
  },
  {
    id: "p-16",
    name: "A-Grade Awal Red Clay Bricks (Per 1000 / Site Dumper Trolley)",
    slug: "awal-red-clay-bricks-lahore",
    categorySlug: "building-rates",
    categoryName: "Building Material Rates",
    brand: "Awal Bhatta Bricks",
    oldPrice: null,
    price: 0,
    discount: null,
    rating: 5,
    reviewsCount: 48,
    inStock: true,
    isDailyRate: true,
    unit: "Per 1000 Bricks",
    description: "Machine-molded, kiln-baked sharp-edge Awal bricks. Uniform red color and high compressive strength delivered direct to site.",
    iconType: "brick",
  },
  {
    id: "p-17",
    name: "Ravi & Chenab Pure Sifted Sand (Rait Truck / Dumper / Trolley)",
    slug: "chenab-ravi-sand-rait-trolley",
    categorySlug: "building-rates",
    categoryName: "Building Material Rates",
    brand: "Chenab & Ravi Rait",
    oldPrice: null,
    price: 0,
    discount: null,
    rating: 5,
    reviewsCount: 39,
    inStock: true,
    isDailyRate: true,
    unit: "Trolley / Truck Dumper",
    description: "Washed river sand free from clay and organic matter. Coarse grade for structural concrete and ultra-fine grade for flawless plaster.",
    iconType: "sand",
  },
  {
    id: "p-18",
    name: "Sargodha Mountain Plant Crush / Bajri (Truck Dumper / Trolley)",
    slug: "sargodha-mountain-crush-bajri",
    categorySlug: "building-rates",
    categoryName: "Building Material Rates",
    brand: "Sargodha Plant Bajri",
    oldPrice: null,
    price: 0,
    discount: null,
    rating: 5,
    reviewsCount: 44,
    inStock: true,
    isDailyRate: true,
    unit: "Per 100 CFT / Trolley",
    description: "100% original Sargodha blue-granite crushed stone aggregate (1/2 inch & 3/4 inch). Highest load-bearing capacity for lintels and slabs.",
    iconType: "brick",
  },
];

// 12 Exact Categories from Section 2
const shopByCategoriesCards = [
  { name: "Chinese Kitchen Sinks", count: 18, filterKey: "chinese-sinks", icon: "sink", subtitle: "Waterfall & Nano" },
  { name: "Chinese Marble Basins", count: 24, filterKey: "chinese-sinks", icon: "basin", subtitle: "Art Tabletop Basins" },
  { name: "Bathroom Vanities", count: 15, filterKey: "chinese-sinks", icon: "vanity", subtitle: "Smart LED Mirrors" },
  { name: "Porta Sanitary & Commodes", count: 32, filterKey: "porta", icon: "commode", subtitle: "Rimless & 1-Piece" },
  { name: "Faisal Sanitary Fittings", count: 45, filterKey: "faisal", icon: "tap", subtitle: "Solid Brass Mixers" },
  { name: "Shower Sets & Mixers", count: 28, filterKey: "faisal", icon: "shower", subtitle: "Rain Showers" },
  { name: "Popular PPR-C & uPVC Pipes", count: 64, filterKey: "pipes", icon: "pipe", subtitle: "Hot/Cold & Drainage" },
  { name: "DuraFlow & DuraMax Fittings", count: 50, filterKey: "pipes", icon: "pipe", subtitle: "Up to 48% OFF" },
  { name: "GM & New Age Cables", count: 36, filterKey: "cables", icon: "cable", subtitle: "99.9% Pure Copper" },
  { name: "Electric Switches & Sockets", count: 42, filterKey: "cables", icon: "cable", subtitle: "Modern Panels" },
  { name: "Dura Water Tanks", count: 12, filterKey: "tanks", icon: "tank", subtitle: "Triple Layer UV" },
  { name: "Cement, Bricks & Sand", count: 10, filterKey: "building-rates", icon: "cement", subtitle: "Daily Market Rates" },
];

export default function NasgasStorefront() {
  // 1. Hero Carousel state
  const [currentSlide, setCurrentSlide] = useState(0);
  const heroSlides = [
    {
      title: "BUILT ON TRUST. MADE FOR LIFE.",
      subtitle: "Imported Chinese Waterfall Kitchen Sinks, Marble Basins & Luxury Bathroom Vanities",
      tagline: "Direct Wholesale Importer & Stockist",
      accent: "from-blue-50/80 via-white to-sky-50/60",
      cta: "Shop Now",
      filterTarget: "chinese-sinks",
    },
    {
      title: "AUTHORIZED SANITARY & PLUMBING PARTNER",
      subtitle: "Complete Porta Commodes, Faisal Shower Sets, Popular Pipes & DuraFlow Fittings at Wholesale Rates",
      tagline: "Exclusive Builder Packages & Up to 48% OFF",
      accent: "from-amber-50/80 via-white to-orange-50/50",
      cta: "Shop Now",
      filterTarget: "porta",
    },
    {
      title: "GENUINE ELECTRICAL & WATER STORAGE",
      subtitle: "GM Copper Cables, Switches, Dura Water Tanks & Daily Construction Material Rates",
      tagline: "Fast Same-Day Delivery Across Lahore",
      accent: "from-emerald-50/80 via-white to-teal-50/50",
      cta: "Shop Now",
      filterTarget: "cables",
    },
  ];

  // Auto-slide 5000ms
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  // 2. Filter Pills State
  const [selectedFilter, setSelectedFilter] = useState("all");

  // 3. Products List & Load More State
  const [visibleCount, setVisibleCount] = useState(6);
  const [quickViewProduct, setQuickViewProduct] = useState<StoreProduct | null>(null);
  const [addedNotice, setAddedNotice] = useState<string | null>(null);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);

  // Filter products based on selected filter
  const filteredProducts =
    selectedFilter === "all"
      ? defaultProductsCatalog
      : defaultProductsCatalog.filter((p) => p.categorySlug === selectedFilter);

  // When filter changes, reset visible count to 6 or all if fewer
  const displayedProducts = filteredProducts.slice(0, visibleCount);

  const handleFilterClick = (filterKey: string) => {
    setSelectedFilter(filterKey);
    setVisibleCount(6);
  };

  const handleCategoryCardClick = (filterKey: string) => {
    setSelectedFilter(filterKey);
    setVisibleCount(12);
    const target = document.getElementById("best-sellers");
    if (target) {
      target.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleAddToCart = (product: StoreProduct) => {
    setAddedNotice(product.name);
    setTimeout(() => {
      setAddedNotice(null);
    }, 2200);
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail.trim()) {
      setNewsletterSubscribed(true);
      setTimeout(() => setNewsletterSubscribed(false), 4000);
      setNewsletterEmail("");
    }
  };

  // Helper renderer for product visuals
  const renderProductGraphic = (type: StoreProduct["iconType"]) => {
    switch (type) {
      case "sink":
        return (
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-950 text-white flex flex-col items-center justify-center p-3 shadow-inner">
            <Droplets className="w-10 h-10 text-sky-400 mb-1" />
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-300">Nano Sink</span>
          </div>
        );
      case "basin":
        return (
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-br from-amber-100 to-amber-200 border border-amber-300/60 text-amber-900 flex flex-col items-center justify-center p-3 shadow-inner">
            <Sparkles className="w-10 h-10 text-amber-700 mb-1" />
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-950">Marble Basin</span>
          </div>
        );
      case "vanity":
        return (
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-br from-slate-200 to-slate-300 border border-slate-300 text-slate-800 flex flex-col items-center justify-center p-3 shadow-inner">
            <Layers className="w-10 h-10 text-blue-700 mb-1" />
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-900">Vanity Set</span>
          </div>
        );
      case "commode":
        return (
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-br from-white to-blue-50 border border-blue-200 text-blue-900 flex flex-col items-center justify-center p-3 shadow-inner">
            <ShieldCheck className="w-10 h-10 text-[#185DB5] mb-1" />
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-900">Porta Commode</span>
          </div>
        );
      case "shower":
      case "tap":
        return (
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-300 text-slate-800 flex flex-col items-center justify-center p-3 shadow-inner">
            <Droplets className="w-10 h-10 text-cyan-600 mb-1" />
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-900">Brass Chrome</span>
          </div>
        );
      case "pipe":
        return (
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-300 text-emerald-900 flex flex-col items-center justify-center p-3 shadow-inner">
            <Layers className="w-10 h-10 text-emerald-700 mb-1" />
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-950">PPR-C &amp; uPVC</span>
          </div>
        );
      case "cable":
        return (
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-br from-orange-50 to-amber-100 border border-orange-300 text-orange-900 flex flex-col items-center justify-center p-3 shadow-inner">
            <Zap className="w-10 h-10 text-orange-600 mb-1" />
            <span className="text-[10px] font-black uppercase tracking-wider text-orange-950">Pure Copper</span>
          </div>
        );
      case "tank":
        return (
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-br from-blue-100 to-sky-200 border border-blue-300 text-blue-950 flex flex-col items-center justify-center p-3 shadow-inner">
            <Package className="w-10 h-10 text-[#185DB5] mb-1" />
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-950">Dura Tank</span>
          </div>
        );
      case "cement":
      case "brick":
      case "sand":
      default:
        return (
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-br from-stone-100 to-stone-200 border border-stone-300 text-stone-800 flex flex-col items-center justify-center p-3 shadow-inner">
            <Building2 className="w-10 h-10 text-stone-700 mb-1" />
            <span className="text-[10px] font-black uppercase tracking-wider text-stone-900">Site Supply</span>
          </div>
        );
    }
  };

  return (
    <div className="w-full bg-white text-[#222222] font-sans">
      {/* Toast notification for Add to Cart */}
      {addedNotice && (
        <div className="fixed top-20 right-5 z-50 bg-[#185DB5] text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-300" />
          <span className="text-xs font-bold">Added to cart: {addedNotice}</span>
        </div>
      )}

      {/* ========================================================
          SECTION 1: Full-Width Hero Banner Slider (16:9 Carousel)
      ======================================================== */}
      <section className="relative w-full overflow-hidden bg-white border-b border-[#E5E5E5]">
        <div className="relative min-h-[460px] sm:min-h-[520px] flex items-center transition-all duration-700">
          {heroSlides.map((slide, idx) => (
            <div
              key={idx}
              className={`absolute inset-0 w-full h-full flex items-center transition-opacity duration-700 ${
                idx === currentSlide ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
              } bg-gradient-to-r ${slide.accent}`}
            >
              <div className="max-w-7xl mx-auto px-6 sm:px-12 w-full py-16 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                {/* Left Text Block */}
                <div className="lg:col-span-7 space-y-4 text-left">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#185DB5]/10 text-[#185DB5] text-xs font-black tracking-widest uppercase">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{slide.tagline}</span>
                  </div>

                  <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#111111] tracking-tight leading-[1.1]">
                    {slide.title}
                  </h1>

                  <p className="text-sm sm:text-lg text-[#555555] max-w-xl font-medium leading-relaxed">
                    {slide.subtitle}
                  </p>

                  <div className="pt-2 flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => handleCategoryCardClick(slide.filterTarget)}
                      className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#185DB5] hover:bg-[#13498F] text-white font-bold text-sm tracking-wide shadow-lg shadow-[#185DB5]/30 transition transform hover:-translate-y-0.5 cursor-pointer"
                    >
                      <span>{slide.cta}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <a
                      href="https://wa.me/923217165000"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-white border border-[#E5E5E5] hover:border-[#185DB5] text-[#222222] font-bold text-sm shadow-xs transition"
                    >
                      <MessageCircle className="w-4 h-4 text-emerald-600 fill-emerald-600" />
                      <span>WhatsApp Rates</span>
                    </a>
                  </div>
                </div>

                {/* Right Visual Badge Grid */}
                <div className="hidden lg:flex lg:col-span-5 justify-center">
                  <div className="relative w-80 h-80 rounded-3xl bg-white/90 backdrop-blur-md p-8 border-2 border-[#E5E5E5] shadow-xl flex flex-col justify-between">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                        Authorized Lahore Hub
                      </span>
                      <span className="text-xs font-black text-[#185DB5] bg-blue-50 px-2 py-0.5 rounded">
                        100% Genuine
                      </span>
                    </div>

                    <div className="py-4 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-50 text-[#185DB5] flex items-center justify-center shrink-0">
                          <Check className="w-5 h-5 stroke-[2.5]" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[#111111]">Direct Company Dispatch</p>
                          <p className="text-[11px] text-gray-500">Porta, Faisal, Popular &amp; GM Cables</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                          <Truck className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[#111111]">Same-Day Lahore Site Delivery</p>
                          <p className="text-[11px] text-gray-500">Lake City, Adda Plot, Raiwind Road</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                          <Award className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[#111111]">Transparent Builder Rates</p>
                          <p className="text-[11px] text-gray-500">Up to 48% Off Official Price Lists</p>
                        </div>
                      </div>
                    </div>

                    <div className="text-[11px] text-center font-bold text-[#185DB5] bg-blue-50 py-2 rounded-xl">
                      Call 0321-7165000 | 0308-6235608
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Carousel Prev/Next Arrow Buttons */}
        <button
          type="button"
          onClick={() => setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length)}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/80 hover:bg-white text-[#222222] shadow flex items-center justify-center transition border border-[#E5E5E5] cursor-pointer"
          aria-label="Previous Slide"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={() => setCurrentSlide((prev) => (prev + 1) % heroSlides.length)}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/80 hover:bg-white text-[#222222] shadow flex items-center justify-center transition border border-[#E5E5E5] cursor-pointer"
          aria-label="Next Slide"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Exact NASGAS Bottom Center Pagination Dots (Active: elongated Royal Blue pill) */}
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
          SECTION 2: Shop By Categories (Exact 12 Categories, 2 Rows of 6)
      ======================================================== */}
      <section className="py-14 sm:py-20 px-4 sm:px-8 max-w-7xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold text-[#111111] text-center mb-10 tracking-tight">
          Shop By Categories
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-5">
          {shopByCategoriesCards.map((cat, idx) => (
            <div
              key={idx}
              onClick={() => handleCategoryCardClick(cat.filterKey)}
              className="flex flex-col items-center cursor-pointer group"
            >
              {/* Light soft grey rounded-square image box bg-[#F5F5F7] */}
              <div className="w-full bg-[#F5F5F7] rounded-2xl p-5 aspect-square flex items-center justify-center relative border border-transparent group-hover:border-[#185DB5] group-hover:shadow-md transition-all duration-300">
                {/* Top-Right Count Badge: Dark charcoal rounded pill badge */}
                <span className="bg-[#222222] text-white text-[11px] font-bold px-2 py-0.5 rounded-md absolute top-2.5 right-2.5 shadow-xs">
                  {cat.count}
                </span>

                {/* Central Category Illustration */}
                <div className="transform group-hover:scale-110 transition-transform duration-300">
                  {renderProductGraphic(cat.icon as StoreProduct["iconType"])}
                </div>
              </div>

              {/* Below Box: Bold Black Title & Subtitle */}
              <h3 className="text-xs sm:text-sm font-bold text-[#111111] group-hover:text-[#185DB5] text-center mt-3 leading-snug transition-colors">
                {cat.name}
              </h3>
              <p className="text-[11px] text-[#777777] text-center mt-0.5 font-medium">
                {cat.count} Products
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================
          SECTION 3: Showroom Highlight Banner (Between Categories & Reliability)
      ======================================================== */}
      <section className="bg-gradient-to-r from-blue-900 via-[#185DB5] to-[#13498F] text-white py-10 px-4 sm:px-8 my-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1.5 text-center md:text-left">
            <span className="text-xs font-black uppercase tracking-widest text-amber-300">
              100% Genuine Brands &amp; Transparent Online Rate List
            </span>
            <h3 className="text-xl sm:text-2xl lg:text-3xl font-black">
              Check Wholesale Discounts on Popular (40% OFF), DuraMax (48% OFF), GM Cables &amp; Imported Sanitary
            </h3>
            <p className="text-xs sm:text-sm text-white/80">
              Contractor and builder on-site supply available throughout Lahore.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <a
              href="#best-sellers"
              className="px-6 py-3 rounded-full bg-white text-[#185DB5] font-bold text-xs sm:text-sm hover:bg-slate-100 transition shadow"
            >
              Check Rates Below
            </a>
            <a
              href="https://wa.me/923217165000"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 rounded-full bg-[#25D366] text-white font-bold text-xs sm:text-sm hover:bg-emerald-600 transition shadow flex items-center gap-1.5"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              <span>WhatsApp Estimate: 0321-7165000</span>
            </a>
          </div>
        </div>
      </section>

      {/* ========================================================
          SECTION 4: Reliability Redefined. Smarter Living. (4 Banner Cards in 1 Row)
      ======================================================== */}
      <section className="py-14 sm:py-20 px-4 sm:px-8 max-w-7xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold text-[#111111] text-center mb-10 tracking-tight">
          Reliability Redefined. Smarter Living.
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1 */}
          <div
            onClick={() => handleCategoryCardClick("chinese-sinks")}
            className="rounded-2xl overflow-hidden relative h-80 group shadow-sm border border-[#E5E5E5] bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 flex flex-col justify-between cursor-pointer"
          >
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-sky-400">
                Direct Import
              </span>
              <h3 className="text-lg font-black tracking-tight leading-snug">
                CHINESE SINKS &amp; VANITIES
              </h3>
              <p className="text-xs text-slate-300">
                Nano Waterfall Sinks, Marble Basins &amp; LED Mirror Vanities.
              </p>
            </div>
            <div>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-white group-hover:text-sky-300 group-hover:translate-x-1 transition">
                Shop Now →
              </span>
            </div>
          </div>

          {/* Card 2 */}
          <div
            onClick={() => handleCategoryCardClick("porta")}
            className="rounded-2xl overflow-hidden relative h-80 group shadow-sm border border-[#E5E5E5] bg-gradient-to-br from-blue-900 to-indigo-950 text-white p-6 flex flex-col justify-between cursor-pointer"
          >
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-300">
                Authorized Dealer
              </span>
              <h3 className="text-lg font-black tracking-tight leading-snug">
                PORTA &amp; FAISAL SANITARY
              </h3>
              <p className="text-xs text-blue-200">
                1-Piece Rimless Commodes, Rain Showers &amp; Heavy Brass Taps.
              </p>
            </div>
            <div>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-white group-hover:text-amber-300 group-hover:translate-x-1 transition">
                Shop Now →
              </span>
            </div>
          </div>

          {/* Card 3 */}
          <div
            onClick={() => handleCategoryCardClick("pipes")}
            className="rounded-2xl overflow-hidden relative h-80 group shadow-sm border border-[#E5E5E5] bg-gradient-to-br from-emerald-950 to-slate-900 text-white p-6 flex flex-col justify-between cursor-pointer"
          >
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                Up to 48% OFF
              </span>
              <h3 className="text-lg font-black tracking-tight leading-snug">
                POPULAR PIPES &amp; DURA TANKS
              </h3>
              <p className="text-xs text-emerald-200">
                PPR-C, uPVC Conduit, Fittings &amp; Heavy Triple-Layer Tanks.
              </p>
            </div>
            <div>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-white group-hover:text-emerald-300 group-hover:translate-x-1 transition">
                Shop Now →
              </span>
            </div>
          </div>

          {/* Card 4 */}
          <div
            onClick={() => handleCategoryCardClick("cables")}
            className="rounded-2xl overflow-hidden relative h-80 group shadow-sm border border-[#E5E5E5] bg-gradient-to-br from-amber-950 to-slate-900 text-white p-6 flex flex-col justify-between cursor-pointer"
          >
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">
                100% Pure Copper
              </span>
              <h3 className="text-lg font-black tracking-tight leading-snug">
                GM CABLES &amp; ELECTRICAL
              </h3>
              <p className="text-xs text-amber-200">
                Certified 3/29, 7/29 Coils, Breakers &amp; Site Electricals.
              </p>
            </div>
            <div>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-white group-hover:text-amber-300 group-hover:translate-x-1 transition">
                Shop Now →
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          SECTION 5: Best Sellers (Top seller in the week) + Load More
      ======================================================== */}
      <section id="best-sellers" className="py-14 sm:py-20 px-4 sm:px-8 max-w-7xl mx-auto scroll-mt-24">
        {/* Section Heading + Italic Grey Subtitle */}
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#111111] tracking-tight">
            Best Sellers
          </h2>
          <p className="text-sm italic text-[#777777] mt-1">
            Top seller in the week
          </p>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center justify-center flex-wrap gap-2 sm:gap-3 mb-10">
          {[
            { key: "all", label: "All Products" },
            { key: "chinese-sinks", label: "Chinese Sinks & Basins" },
            { key: "porta", label: "Porta Sanitary" },
            { key: "faisal", label: "Faisal Fittings" },
            { key: "pipes", label: "Popular & DuraFlow Pipes" },
            { key: "cables", label: "GM Cables & Electric" },
            { key: "tanks", label: "Dura Water Tanks" },
            { key: "building-rates", label: "Building Material Rates" },
          ].map((pill) => (
            <button
              key={pill.key}
              type="button"
              onClick={() => handleFilterClick(pill.key)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition cursor-pointer ${
                selectedFilter === pill.key
                  ? "bg-[#185DB5] text-white shadow-md shadow-blue-500/20"
                  : "bg-gray-100 hover:bg-gray-200 text-[#444444]"
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>

        {/* Product Cards Grid: Exact NASGAS anatomy */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedProducts.map((product) => (
            <div
              key={product.id}
              className="bg-white border border-[#E5E5E5] rounded-xl overflow-hidden group hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
            >
              {/* Image Container: bg-[#F8F9FA] aspect-square */}
              <div className="bg-[#F8F9FA] aspect-square p-6 relative flex items-center justify-center overflow-hidden">
                {/* Top-Right Royal Blue Discount Badge */}
                {product.discount && (
                  <span className="bg-[#185DB5] text-white text-xs font-bold px-2.5 py-1 rounded absolute top-3 right-3 z-10 shadow-xs">
                    {product.discount}
                  </span>
                )}

                {/* Top-Left Hover Action Icons (Heart & Compare) */}
                <div className="absolute top-3 left-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <button
                    type="button"
                    onClick={() => alert(`Added ${product.name} to wishlist.`)}
                    className="w-8 h-8 rounded-full bg-white text-[#222222] hover:text-[#185DB5] shadow flex items-center justify-center transition"
                    title="Add to Wishlist"
                  >
                    <Heart className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickViewProduct(product)}
                    className="w-8 h-8 rounded-full bg-white text-[#222222] hover:text-[#185DB5] shadow flex items-center justify-center transition"
                    title="Quick View"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>

                {/* Center Hover Action Buttons */}
                <div className="absolute inset-x-6 bottom-4 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0 z-10">
                  <button
                    type="button"
                    onClick={() => setQuickViewProduct(product)}
                    className="px-4 py-2 rounded-full bg-white hover:bg-gray-100 text-[#222222] text-xs font-bold shadow-md transition"
                  >
                    Quick view
                  </button>
                  {!product.isDailyRate ? (
                    <button
                      type="button"
                      onClick={() => handleAddToCart(product)}
                      className="px-4 py-2 rounded-full bg-[#185DB5] hover:bg-[#13498F] text-white text-xs font-bold shadow-md transition"
                    >
                      Add to cart
                    </button>
                  ) : (
                    <a
                      href="https://wa.me/923217165000"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded-full bg-[#25D366] hover:bg-emerald-600 text-white text-xs font-bold shadow-md transition flex items-center gap-1"
                    >
                      <MessageCircle className="w-3.5 h-3.5 fill-white" />
                      <span>WhatsApp Rate</span>
                    </a>
                  )}
                </div>

                {/* Product Illustration */}
                <div className="transform group-hover:scale-105 transition-transform duration-300">
                  {renderProductGraphic(product.iconType)}
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 text-left space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  {product.brand}
                </span>

                <h3 className="text-[15px] font-semibold text-[#222222] hover:text-[#185DB5] line-clamp-2 transition-colors cursor-pointer"
                    onClick={() => setQuickViewProduct(product)}>
                  {product.name}
                </h3>

                {/* 5 Yellow Stars + Review Count */}
                <div className="flex items-center gap-1 text-[11px] text-[#777777]">
                  <div className="flex items-center text-[#FFC107]">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-[#FFC107]" />
                    ))}
                  </div>
                  <span className="ml-1">({product.reviewsCount} reviews)</span>
                </div>

                {/* Price Row: Strikethrough grey original price + Bold Royal Blue net price */}
                <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                  {!product.isDailyRate ? (
                    <div>
                      {product.oldPrice && (
                        <span className="text-sm text-[#777777] line-through mr-2 font-medium">
                          Rs.{product.oldPrice.toLocaleString("en-PK")}.00
                        </span>
                      )}
                      <span className="text-[17px] font-bold text-[#185DB5]">
                        Rs.{product.price.toLocaleString("en-PK")}.00
                      </span>
                    </div>
                  ) : (
                    <div className="w-full flex items-center justify-between">
                      <span className="inline-block px-2.5 py-1 rounded bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold">
                        Daily Market Rate
                      </span>
                      <a
                        href="https://wa.me/923217165000"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-bold text-[#25D366] hover:underline flex items-center gap-1"
                      >
                        <MessageCircle className="w-3.5 h-3.5 fill-current" />
                        <span>Ask Today&apos;s Rate</span>
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Exact NASGAS 'Load More' Progress Bar Footer below Grid */}
        <div className="mt-12 text-center max-w-sm mx-auto space-y-4">
          <p className="text-xs text-[#777777] font-medium">
            You&apos;ve viewed {displayedProducts.length} of {filteredProducts.length} products
          </p>

          {/* Thin Progress Bar: bg-[#E5E5E5] track with bg-[#185DB5] fill */}
          <div className="w-full bg-[#E5E5E5] h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-[#185DB5] h-full rounded-full transition-all duration-300"
              style={{
                width: `${Math.min(100, (displayedProducts.length / filteredProducts.length) * 100)}%`,
              }}
            />
          </div>

          {/* Oval Charcoal Pill Button */}
          {displayedProducts.length < filteredProducts.length && (
            <button
              type="button"
              onClick={() => setVisibleCount((prev) => prev + 6)}
              className="bg-[#222222] hover:bg-[#185DB5] text-white font-semibold px-10 py-3 rounded-full text-xs sm:text-sm tracking-wide transition shadow cursor-pointer"
            >
              Load More
            </button>
          )}
        </div>
      </section>

      {/* ========================================================
          SECTION 6: Prestigious Brands & Certifications
      ======================================================== */}
      <section className="py-14 sm:py-16 bg-[#F8F9FA] border-y border-[#E5E5E5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#111111] tracking-tight">
            Prestigious Brands &amp; Certifications
          </h2>

          {/* Award Ribbon Divider Icon */}
          <div className="flex items-center justify-center my-4">
            <div className="h-px bg-gray-300 w-16"></div>
            <Award className="w-5 h-5 text-[#185DB5] mx-3" />
            <div className="h-px bg-gray-300 w-16"></div>
          </div>

          <p className="text-xs sm:text-sm text-[#777777] max-w-lg mx-auto mb-10">
            Authorized supply partners providing manufacturer-sealed materials, test certificates, and warranty.
          </p>

          {/* Clean Horizontal Grid of Brand Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {[
              "PORTA",
              "FAISAL SANITARY",
              "POPULAR PIPES",
              "DURAFLOW",
              "DURAMAX",
              "GM CABLES",
              "NEW AGE CABLES",
              "DURA WATER TANKS",
              "NASGAS",
              "BESTWAY CEMENT",
            ].map((brand, i) => (
              <div
                key={i}
                className="bg-white border border-[#E5E5E5] rounded-xl p-4 flex items-center justify-center text-center shadow-xs hover:border-[#185DB5] hover:shadow-md transition-all group"
              >
                <span className="text-xs sm:text-sm font-black tracking-wider text-[#222222] group-hover:text-[#185DB5] transition">
                  {brand}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================
          SECTION 7: Why buy from us? (Exact NASGAS Asymmetric Layout)
      ======================================================== */}
      <section className="py-14 sm:py-20 px-4 sm:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row items-center gap-10">
          {/* Left side (lg:w-1/4): Bold heading */}
          <div className="lg:w-1/4 text-center lg:text-left space-y-3">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#111111] tracking-tight leading-snug">
              Why buy from us?
            </h2>
            <p className="text-xs sm:text-sm text-[#777777] leading-relaxed">
              We eliminate middleman overheads and ensure genuine materials straight from authorized factories to your site.
            </p>
          </div>

          {/* Right side (lg:w-3/4): 3 white rounded boxes with Royal Blue borders */}
          <div className="lg:w-3/4 grid grid-cols-1 sm:grid-cols-3 gap-6 w-full">
            {/* Box 1 */}
            <div className="bg-white border-2 border-[#185DB5] rounded-2xl p-6 flex flex-col items-center text-center space-y-3 shadow-sm hover:shadow-md transition">
              <div className="w-12 h-12 rounded-full bg-blue-50 text-[#185DB5] flex items-center justify-center">
                <Truck className="w-6 h-6 stroke-[2]" />
              </div>
              <h3 className="text-sm font-bold uppercase tracking-wide text-[#111111]">
                FAST DELIVERY IN LAHORE
              </h3>
              <p className="text-xs text-[#555555] leading-relaxed">
                Same-day delivery near Lake City, Adda Plot &amp; Raiwind Road. Dedicated transport fleet.
              </p>
            </div>

            {/* Box 2 */}
            <div className="bg-white border-2 border-[#185DB5] rounded-2xl p-6 flex flex-col items-center text-center space-y-3 shadow-sm hover:shadow-md transition">
              <div className="w-12 h-12 rounded-full bg-blue-50 text-[#185DB5] flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 stroke-[2]" />
              </div>
              <h3 className="text-sm font-bold uppercase tracking-wide text-[#111111]">
                100% GENUINE &amp; SECURE
              </h3>
              <p className="text-xs text-[#555555] leading-relaxed">
                Authorized dealer of Porta, Faisal, Popular &amp; GM Cables. Zero counterfeit tolerance.
              </p>
            </div>

            {/* Box 3 */}
            <div className="bg-white border-2 border-[#185DB5] rounded-2xl p-6 flex flex-col items-center text-center space-y-3 shadow-sm hover:shadow-md transition">
              <div className="w-12 h-12 rounded-full bg-blue-50 text-[#185DB5] flex items-center justify-center">
                <Headphones className="w-6 h-6 stroke-[2]" />
              </div>
              <h3 className="text-sm font-bold uppercase tracking-wide text-[#111111]">
                WHOLESALE RATES &amp; SUPPORT
              </h3>
              <p className="text-xs text-[#555555] leading-relaxed">
                Direct rates &amp; estimates on WhatsApp 0321-7165000. Transparent pricing for home builders.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          SECTION 8: Subscribe to our newsletter (Light Grey #F5F5F7 Strip)
      ======================================================== */}
      <section className="bg-[#F5F5F7] py-14 px-4 sm:px-8 border-t border-[#E5E5E5]">
        <div className="max-w-2xl mx-auto text-center space-y-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#111111] tracking-tight">
            Subscribe to our newsletter
          </h2>
          <p className="text-xs sm:text-sm text-[#777777]">
            Get our emails for info on new items, daily rate updates and wholesale offers.
          </p>

          <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row items-center gap-2 max-w-md mx-auto pt-2">
            <input
              type="email"
              required
              value={newsletterEmail}
              onChange={(e) => setNewsletterEmail(e.target.value)}
              placeholder="Your email address"
              className="w-full bg-white border border-[#E5E5E5] focus:border-[#185DB5] rounded-full px-5 py-3 text-xs sm:text-sm text-[#222222] focus:outline-none shadow-xs"
            />
            <button
              type="submit"
              className="w-full sm:w-auto bg-[#222222] hover:bg-[#185DB5] text-white font-bold px-8 py-3 rounded-full text-xs sm:text-sm tracking-wide transition shadow-xs cursor-pointer shrink-0"
            >
              Subscribe
            </button>
          </form>

          {newsletterSubscribed && (
            <p className="text-xs font-bold text-emerald-600 animate-fade-in pt-1">
              ✓ Thank you for subscribing! You will receive daily rate updates.
            </p>
          )}
        </div>
      </section>

      {/* ========================================================
          QUICK VIEW MODAL
      ======================================================== */}
      {quickViewProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl relative border border-[#E5E5E5] animate-scale-in">
            <button
              type="button"
              onClick={() => setQuickViewProduct(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-gray-400 hover:text-[#111111] hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
              <div className="bg-[#F8F9FA] rounded-xl aspect-square flex items-center justify-center p-6 border border-[#E5E5E5] relative">
                {quickViewProduct.discount && (
                  <span className="bg-[#185DB5] text-white text-xs font-bold px-2 py-0.5 rounded absolute top-3 right-3">
                    {quickViewProduct.discount}
                  </span>
                )}
                {renderProductGraphic(quickViewProduct.iconType)}
              </div>

              <div className="space-y-3 text-left">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#185DB5] bg-blue-50 px-2 py-0.5 rounded">
                  {quickViewProduct.brand}
                </span>
                <h3 className="text-lg font-bold text-[#111111] leading-snug">
                  {quickViewProduct.name}
                </h3>
                <p className="text-xs text-[#666666] leading-relaxed">
                  {quickViewProduct.description}
                </p>

                <div className="pt-2 border-t border-gray-100">
                  {!quickViewProduct.isDailyRate ? (
                    <div>
                      {quickViewProduct.oldPrice && (
                        <span className="text-sm text-[#777777] line-through mr-2 font-medium">
                          Rs.{quickViewProduct.oldPrice.toLocaleString("en-PK")}.00
                        </span>
                      )}
                      <span className="text-xl font-black text-[#185DB5]">
                        Rs.{quickViewProduct.price.toLocaleString("en-PK")}.00
                      </span>
                    </div>
                  ) : (
                    <span className="inline-block px-3 py-1 bg-amber-50 text-amber-800 text-xs font-bold rounded border border-amber-200">
                      Daily Market Rate
                    </span>
                  )}
                </div>

                <div className="pt-3 space-y-2">
                  {!quickViewProduct.isDailyRate ? (
                    <button
                      type="button"
                      onClick={() => {
                        handleAddToCart(quickViewProduct);
                        setQuickViewProduct(null);
                      }}
                      className="w-full py-3 rounded-full bg-[#185DB5] hover:bg-[#13498F] text-white font-bold text-xs tracking-wide shadow transition flex items-center justify-center gap-2"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      <span>Add to Cart</span>
                    </button>
                  ) : (
                    <a
                      href={`https://wa.me/923217165000?text=${encodeURIComponent(
                        `Assalam-o-Alaikum! Please quote today's rate for: ${quickViewProduct.name}`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3 rounded-full bg-[#25D366] hover:bg-emerald-600 text-white font-bold text-xs tracking-wide shadow transition flex items-center justify-center gap-2"
                    >
                      <MessageCircle className="w-4 h-4 fill-white" />
                      <span>Ask Today&apos;s Rate on WhatsApp</span>
                    </a>
                  )}

                  <a
                    href="tel:03217165000"
                    className="w-full py-2.5 rounded-full bg-gray-100 hover:bg-gray-200 text-[#222222] font-semibold text-xs tracking-wide flex items-center justify-center gap-1.5 transition"
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

