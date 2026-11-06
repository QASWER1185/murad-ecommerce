"use client";

import React, { useState } from "react";
import Link from "next/link";
import MuradLogo from "@/components/ui/MuradLogo";
import {
  Search,
  User,
  Heart,
  ShoppingBag,
  Menu,
  X,
  Phone,
  ChevronDown,
  Layers,
  ArrowRight,
  Sparkles,
} from "lucide-react";

interface CategoryMenuItem {
  name: string;
  count: number;
  slug: string;
}

const shopByCategoriesList: CategoryMenuItem[] = [
  { name: "Chinese Kitchen Sinks", count: 18, slug: "sanitary" },
  { name: "Chinese Marble Basins", count: 24, slug: "sanitary" },
  { name: "Bathroom Vanities", count: 15, slug: "sanitary" },
  { name: "Porta Sanitary & Commodes", count: 32, slug: "sanitary" },
  { name: "Faisal Sanitary Fittings", count: 45, slug: "sanitary" },
  { name: "Shower Sets & Mixers", count: 28, slug: "sanitary" },
  { name: "Popular PPR-C & uPVC Pipes", count: 64, slug: "sanitary" },
  { name: "DuraFlow & DuraMax Fittings", count: 50, slug: "sanitary" },
  { name: "GM & New Age Cables", count: 36, slug: "electric" },
  { name: "Electric Switches & Sockets", count: 42, slug: "electric" },
  { name: "Dura Water Tanks", count: 12, slug: "sanitary" },
  { name: "Cement, Bricks & Sand", count: 10, slug: "building-material" },
];

export default function Navbar() {
  const [topBarVisible, setTopBarVisible] = useState(true);
  const [searchCategory, setSearchCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const target = document.getElementById("best-sellers");
    if (target) {
      target.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <header className="w-full relative font-sans">
      {/* ========================================================
          BAR 1: Dismissible Top Royal Blue Announcement Bar
          bg-[#185DB5] text-white text-xs sm:text-sm py-2 px-4
      ======================================================== */}
      {topBarVisible && (
        <div className="bg-[#185DB5] text-white text-xs sm:text-sm py-2 px-4 relative flex items-center justify-between z-40 transition-all">
          <div className="max-w-7xl mx-auto flex-1 flex items-center justify-center text-center font-medium pr-6 sm:pr-0">
            <span>
              Fast delivery in Lahore - Call / WhatsApp :{" "}
              <a
                href="https://wa.me/923217165000"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold underline underline-offset-2 hover:text-white/90"
              >
                0321-7165000
              </a>{" "}
              | Opposite Lake City, Adda Plot, Raiwind Road
            </span>
          </div>
          <button
            type="button"
            onClick={() => setTopBarVisible(false)}
            className="text-white/80 hover:text-white text-xs font-semibold px-2 py-0.5 rounded cursor-pointer shrink-0 transition"
            aria-label="Close Announcement Bar"
          >
            ✕ close
          </button>
        </div>
      )}

      {/* ========================================================
          BAR 2: Main White Header (Logo, Pill Search, 3 Icons)
          bg-white py-4 px-4 sm:px-8 border-b border-[#E5E5E5]
      ======================================================== */}
      <div className="bg-white py-3 sm:py-4 px-4 sm:px-8 border-b border-[#E5E5E5]">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Left: Custom Monogram Logo */}
          <div className="shrink-0">
            <MuradLogo />
          </div>

          {/* Center: Exact NASGAS Pill Search Bar Container */}
          <form
            onSubmit={handleSearchSubmit}
            className="hidden md:flex flex-1 max-w-2xl mx-4 items-center border-2 border-[#E5E5E5] focus-within:border-[#185DB5] rounded-full overflow-hidden transition-all bg-white shadow-xs"
          >
            {/* Category Select Dropdown inside search */}
            <div className="relative pl-3 pr-2 py-1.5 flex items-center shrink-0 border-r border-[#E5E5E5] bg-gray-50/70">
              <select
                value={searchCategory}
                onChange={(e) => setSearchCategory(e.target.value)}
                className="bg-transparent text-xs font-semibold text-[#222222] pr-6 py-1 focus:outline-none cursor-pointer appearance-none"
              >
                <option value="all">All Categories</option>
                <option value="porta">Porta Sanitary</option>
                <option value="faisal">Faisal Fittings</option>
                <option value="sinks">Chinese Kitchen Sinks</option>
                <option value="basins">Chinese Marble Basins</option>
                <option value="vanities">Bathroom Vanities</option>
                <option value="pipes">Popular Pipes</option>
                <option value="duraflow">DuraFlow Fittings</option>
                <option value="cables">GM Cables</option>
                <option value="tanks">Dura Water Tanks</option>
                <option value="building">Building Material</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-gray-500 pointer-events-none absolute right-2" />
            </div>

            {/* Input Field */}
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for products, brands, rates..."
              className="flex-1 px-4 py-2 text-sm text-[#222222] placeholder:text-gray-400 focus:outline-none bg-transparent"
            />

            {/* NASGAS Pill Royal Blue Button reading 'search' */}
            <button
              type="submit"
              className="bg-[#185DB5] hover:bg-[#13498F] text-white font-medium px-6 py-2 rounded-full m-1 text-sm tracking-wide transition shadow-xs cursor-pointer"
            >
              search
            </button>
          </form>

          {/* Right: 3 Outline Icons (Account, Wishlist, Bag with Cart preview) */}
          <div className="flex items-center gap-3 sm:gap-5 shrink-0">
            {/* User Account */}
            <a
              href="tel:03217165000"
              className="hidden lg:flex flex-col items-center justify-center text-[#222222] hover:text-[#185DB5] transition p-1"
              title="Customer Support / Account"
            >
              <User className="w-6 h-6 stroke-[1.5]" />
              <span className="text-[10px] font-medium text-gray-500 mt-0.5">Support</span>
            </a>

            {/* Wishlist */}
            <div
              className="relative p-1 text-[#222222] hover:text-[#185DB5] transition cursor-pointer"
              title="Wishlist"
              onClick={() => alert("Wishlist is saved locally.")}
            >
              <Heart className="w-6 h-6 stroke-[1.5]" />
              <span className="absolute -top-1 -right-1 bg-[#185DB5] text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                0
              </span>
            </div>

            {/* Shopping Bag / Cart */}
            <button
              type="button"
              onClick={() => setCartDrawerOpen(true)}
              className="flex items-center gap-2 p-1 text-[#222222] hover:text-[#185DB5] transition cursor-pointer group"
              title="Shopping Cart"
            >
              <div className="relative">
                <ShoppingBag className="w-6 h-6 stroke-[1.5]" />
                <span className="absolute -top-1 -right-1 bg-[#185DB5] text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                  0
                </span>
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-[11px] font-bold text-[#111111] group-hover:text-[#185DB5] leading-tight">
                  0 / Rs.0.00
                </span>
                <span className="text-[9px] uppercase tracking-wider text-gray-400 font-medium">
                  My Cart
                </span>
              </div>
            </button>

            {/* Mobile Hamburger Menu Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-[#222222] hover:text-[#185DB5] rounded-md transition"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar (visible on small viewports) */}
        <form
          onSubmit={handleSearchSubmit}
          className="mt-3 md:hidden flex items-center border border-[#E5E5E5] focus-within:border-[#185DB5] rounded-full overflow-hidden bg-white shadow-xs"
        >
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products & rates..."
            className="flex-1 px-4 py-2 text-xs text-[#222222] focus:outline-none"
          />
          <button
            type="submit"
            className="bg-[#185DB5] text-white text-xs font-semibold px-4 py-2 rounded-full m-1"
          >
            search
          </button>
        </form>
      </div>

      {/* ========================================================
          BAR 3: Sticky Dark Charcoal Navigation Bar
          bg-[#222222] text-white sticky top-0 z-50 shadow-md
      ======================================================== */}
      <nav className="bg-[#222222] text-white sticky top-0 z-50 shadow-md border-b border-black/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex items-center justify-between relative">
          {/* Left: Full-Height Royal Blue '≡ SHOP BY CATEGORY' button */}
          <div
            className="relative"
            onMouseEnter={() => setCategoryDropdownOpen(true)}
            onMouseLeave={() => setCategoryDropdownOpen(false)}
          >
            <button
              type="button"
              onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
              className="bg-[#185DB5] hover:bg-[#13498F] text-white font-bold px-6 py-3.5 flex items-center gap-3 uppercase text-xs sm:text-sm tracking-wide transition-colors cursor-pointer"
            >
              <Menu className="w-4 h-4 stroke-[2.5]" />
              <span>≡ SHOP BY CATEGORY</span>
              <ChevronDown
                className={`w-3.5 h-3.5 ml-1 transition-transform duration-200 ${
                  categoryDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Mega Dropdown Menu for Shop By Category */}
            {categoryDropdownOpen && (
              <div className="absolute left-0 top-full w-80 bg-white text-[#222222] border border-[#E5E5E5] rounded-b-xl shadow-2xl py-2 z-50">
                <div className="px-4 py-2 bg-gray-50 border-b border-[#E5E5E5] flex items-center justify-between">
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    All Store Departments
                  </span>
                  <span className="text-[10px] font-semibold text-[#185DB5] bg-blue-50 px-2 py-0.5 rounded">
                    12 Categories
                  </span>
                </div>
                <div className="max-h-[70vh] overflow-y-auto divide-y divide-gray-100">
                  {shopByCategoriesList.map((cat, idx) => (
                    <Link
                      key={idx}
                      href={`/category/${cat.slug}`}
                      onClick={() => setCategoryDropdownOpen(false)}
                      className="px-4 py-2.5 flex items-center justify-between text-xs font-semibold hover:bg-blue-50 hover:text-[#185DB5] transition group"
                    >
                      <span className="text-[#333333] group-hover:text-[#185DB5]">{cat.name}</span>
                      <span className="text-[11px] font-bold bg-gray-100 group-hover:bg-[#185DB5] group-hover:text-white px-2 py-0.5 rounded-full text-gray-600 transition">
                        {cat.count}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Center: Exact NASGAS Navigation Links */}
          <div className="hidden lg:flex items-center gap-7 text-xs font-bold uppercase tracking-wider text-white">
            <Link href="/" className="hover:text-blue-400 py-3.5 transition">
              HOME
            </Link>
            <Link href="/category/sanitary" className="hover:text-blue-400 py-3.5 transition">
              CHINESE IMPORTED
            </Link>
            <Link href="/category/sanitary" className="hover:text-blue-400 py-3.5 transition">
              SANITARY &amp; SINKS
            </Link>
            <Link href="/category/electric" className="hover:text-blue-400 py-3.5 transition">
              PIPES &amp; ELECTRIC
            </Link>
            <a href="#best-sellers" className="hover:text-blue-400 py-3.5 transition text-amber-300">
              LIVE RATE LIST
            </a>
            <Link href="/category/building-material" className="hover:text-blue-400 py-3.5 transition">
              BUILDING MATERIAL
            </Link>
            <a href="#footer-contact" className="hover:text-blue-400 py-3.5 transition">
              CONTACT US
            </a>
          </div>

          {/* Right: Phone Icon + Bold Underlined White Contact */}
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-[#185DB5] fill-[#185DB5]" />
            <a
              href="tel:03217165000"
              className="text-white text-xs sm:text-sm font-bold tracking-wider underline underline-offset-4 hover:text-blue-400 transition"
            >
              0321-7165000
            </a>
          </div>
        </div>

        {/* Mobile Dropdown Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-[#1a1a1a] border-t border-gray-800 px-4 py-4 space-y-3 text-sm font-bold uppercase">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-white hover:text-blue-400 border-b border-gray-800"
            >
              HOME
            </Link>
            <Link
              href="/category/sanitary"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-white hover:text-blue-400 border-b border-gray-800"
            >
              CHINESE IMPORTED
            </Link>
            <Link
              href="/category/sanitary"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-white hover:text-blue-400 border-b border-gray-800"
            >
              SANITARY &amp; SINKS
            </Link>
            <Link
              href="/category/electric"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-white hover:text-blue-400 border-b border-gray-800"
            >
              PIPES &amp; ELECTRIC
            </Link>
            <a
              href="#best-sellers"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-amber-400 hover:text-amber-300 border-b border-gray-800"
            >
              LIVE RATE LIST
            </a>
            <Link
              href="/category/building-material"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-white hover:text-blue-400 border-b border-gray-800"
            >
              BUILDING MATERIAL
            </Link>
            <a
              href="#footer-contact"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-white hover:text-blue-400"
            >
              CONTACT US
            </a>
          </div>
        )}
      </nav>

      {/* Slide-out Cart Drawer Modal */}
      {cartDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs transition-opacity">
          <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between p-6">
            <div>
              <div className="flex items-center justify-between border-b border-gray-200 pb-4">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-[#185DB5]" />
                  <h3 className="font-bold text-lg text-[#111111]">Your Shopping Cart</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setCartDrawerOpen(false)}
                  className="p-1 text-gray-500 hover:text-[#111111] rounded-md"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="py-12 text-center text-gray-500">
                <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="font-semibold text-sm text-[#222222]">Your cart is currently empty</p>
                <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
                  Browse our authentic sanitary, pipe &amp; electric catalog or ask for custom builder estimates.
                </p>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4 space-y-3">
              <a
                href="https://wa.me/923217165000?text=Assalam-o-Alaikum%20M.%20Murad%20Sons!%20I%20want%20to%20place%20an%20order."
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 rounded-full bg-[#185DB5] hover:bg-[#13498F] text-white font-bold text-sm flex items-center justify-center gap-2 transition"
              >
                <span>Direct WhatsApp Order: 0321-7165000</span>
                <ArrowRight className="w-4 h-4" />
              </a>
              <button
                type="button"
                onClick={() => setCartDrawerOpen(false)}
                className="w-full py-2.5 rounded-full bg-gray-100 hover:bg-gray-200 text-[#222222] font-semibold text-xs transition"
              >
                Continue Browsing
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
