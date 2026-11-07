"use client";

import React, { useState } from "react";
import Link from "next/link";
import MuradLogo from "@/components/ui/MuradLogo";
import {
  Search,
  User,
  Heart,
  ShoppingCart,
  Menu,
  X,
  Phone,
  ChevronDown,
  MessageCircle,
  MapPin,
  ArrowRight,
} from "lucide-react";

interface CategoryMenuItem {
  name: string;
  count: number;
  slug: string;
}

const shopByCategoriesList: CategoryMenuItem[] = [
  { name: "Porta Sanitary", count: 78, slug: "sanitary" },
  { name: "Faisal Sanitary & Fittings", count: 145, slug: "sanitary" },
  { name: "Chinese Marble Basins & Sinks", count: 52, slug: "sanitary" },
  { name: "Luxury Bathroom Vanities", count: 35, slug: "sanitary" },
  { name: "Popular PPR-C & uPVC Pipes", count: 120, slug: "sanitary" },
  { name: "DuraFlow & DuraMax Fittings", count: 85, slug: "sanitary" },
  { name: "GM & New Age Cables", count: 94, slug: "electric" },
  { name: "Electric Switches & Sockets", count: 62, slug: "electric" },
  { name: "Dura Water Tanks", count: 38, slug: "sanitary" },
  { name: "Bestway Cement & Site Material", count: 24, slug: "building-material" },
];

export default function Navbar() {
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
          1. TOP BAR: bg-[#185DB5] text-white text-xs sm:text-sm py-2 px-4
      ======================================================== */}
      <div className="bg-[#185DB5] text-white text-xs sm:text-sm py-2 px-4 border-b border-blue-600/40">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          {/* Left/Center Address Notice */}
          <div className="flex items-center gap-1.5 font-medium text-white/95">
            <MapPin className="w-3.5 h-3.5 text-amber-300 shrink-0" />
            <span>
              Opposite Lake City, Adda Plot, Al Kabir Town, Raiwind Road, Lahore
            </span>
          </div>

          {/* Right: Phone & WhatsApp Links */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-1 text-white font-semibold">
              <Phone className="w-3.5 h-3.5 text-amber-300" />
              <span>Call / WhatsApp:</span>
              <a
                href="https://wa.me/923217165000"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline font-bold text-amber-300"
              >
                0321-7165000
              </a>
              <span className="text-white/60">|</span>
              <a
                href="tel:03086235608"
                className="hover:underline text-white/90"
              >
                0308-6235608
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          2. MAIN WHITE HEADER: bg-white py-4 px-4 sticky top-0 z-50 shadow-sm
      ======================================================== */}
      <div className="bg-white py-3.5 sm:py-4 px-4 sm:px-8 border-b border-slate-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Logo with Geometric Gold & Royal Blue Emblem */}
          <div className="shrink-0">
            <MuradLogo />
          </div>

          {/* Center Search Bar Container */}
          <form
            onSubmit={handleSearchSubmit}
            className="hidden md:flex flex-1 max-w-2xl mx-4 items-center border border-slate-300 focus-within:border-[#185DB5] rounded-full overflow-hidden bg-white shadow-xs transition"
          >
            {/* Category Dropdown Selector */}
            <div className="relative pl-3 pr-2 py-1.5 flex items-center shrink-0 border-r border-slate-200 bg-slate-50/70">
              <select
                value={searchCategory}
                onChange={(e) => setSearchCategory(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-800 pr-5 py-1 focus:outline-none cursor-pointer appearance-none"
              >
                <option value="all">Category</option>
                <option value="sanitary">Porta &amp; Faisal</option>
                <option value="sinks">Chinese Sinks &amp; Basins</option>
                <option value="vanities">Bathroom Vanities</option>
                <option value="pipes">Popular &amp; DuraFlow Pipes</option>
                <option value="cables">GM &amp; New Age Cables</option>
                <option value="tanks">Dura Water Tanks</option>
                <option value="building">Cement, Sand &amp; Bricks</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 pointer-events-none absolute right-1.5" />
            </div>

            {/* Input */}
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search building materials, Chinese sinks, Porta, Faisal, Popular pipes, GM cable..."
              className="flex-1 px-4 py-2 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none bg-transparent"
            />

            {/* Royal Blue #185DB5 Search Button */}
            <button
              type="submit"
              className="bg-[#185DB5] hover:bg-[#13498F] text-white font-bold px-6 py-2 rounded-full m-1 text-xs sm:text-sm tracking-wide transition shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <Search className="w-4 h-4" />
              <span>Search</span>
            </button>
          </form>

          {/* Right Action Icons */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            {/* Account Icon */}
            <a
              href="tel:03217165000"
              className="hidden lg:flex flex-col items-center justify-center text-slate-700 hover:text-[#185DB5] transition p-1"
              title="Customer Service"
            >
              <User className="w-6 h-6 stroke-[1.6]" />
              <span className="text-[10px] font-bold text-slate-500 mt-0.5">Account</span>
            </a>

            {/* Wishlist Heart Icon with Gold Counter Badge bg-[#C59B27] */}
            <div
              className="relative p-1.5 text-slate-700 hover:text-[#185DB5] transition cursor-pointer"
              title="Wishlist"
              onClick={() => alert("Wishlist item count: 0")}
            >
              <Heart className="w-6 h-6 stroke-[1.6]" />
              <span className="absolute -top-1 -right-1 bg-[#C59B27] text-slate-950 text-[10px] font-black rounded-full h-4 w-4 flex items-center justify-center shadow-xs">
                0
              </span>
            </div>

            {/* Cart Icon with Gold Counter Badge bg-[#C59B27] */}
            <button
              type="button"
              onClick={() => setCartDrawerOpen(true)}
              className="relative p-1.5 text-slate-700 hover:text-[#185DB5] transition cursor-pointer"
              title="Shopping Cart"
            >
              <ShoppingCart className="w-6 h-6 stroke-[1.6]" />
              <span className="absolute -top-1 -right-1 bg-[#C59B27] text-slate-950 text-[10px] font-black rounded-full h-4 w-4 flex items-center justify-center shadow-xs">
                0
              </span>
            </button>

            {/* Green WhatsApp Quick Quote Button */}
            <a
              href="https://wa.me/923217165000?text=Assalam-o-Alaikum!%20I%20would%20like%20to%20get%20a%20quick%20quote%20for%20building%20materials."
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#25D366] hover:bg-emerald-600 text-white font-bold text-xs shadow-xs transition"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              <span>Quick Quote</span>
            </a>

            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-800 hover:text-[#185DB5] rounded-md transition"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Search Input */}
        <form
          onSubmit={handleSearchSubmit}
          className="mt-3 md:hidden flex items-center border border-slate-300 rounded-full overflow-hidden bg-white shadow-xs"
        >
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products & rates..."
            className="flex-1 px-4 py-2 text-xs text-slate-800 focus:outline-none"
          />
          <button
            type="submit"
            className="bg-[#185DB5] text-white text-xs font-bold px-4 py-2 rounded-full m-1"
          >
            Search
          </button>
        </form>
      </div>

      {/* ========================================================
          3. SUB-NAVIGATION BAR: bg-[#222222] text-white
      ======================================================== */}
      <nav className="bg-[#222222] text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex items-center justify-between relative">
          {/* Left: Gold Button labeled 'SHOP BY CATEGORY ☰' */}
          <div
            className="relative py-2"
            onMouseEnter={() => setCategoryDropdownOpen(true)}
            onMouseLeave={() => setCategoryDropdownOpen(false)}
          >
            <button
              type="button"
              onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
              className="bg-[#C59B27] hover:bg-[#b08920] text-slate-950 font-black px-5 py-2.5 rounded-md flex items-center gap-2 text-xs sm:text-sm tracking-wide transition shadow-sm cursor-pointer"
            >
              <Menu className="w-4 h-4 stroke-[3]" />
              <span>SHOP BY CATEGORY ☰</span>
              <ChevronDown
                className={`w-3.5 h-3.5 ml-1 transition-transform duration-200 ${
                  categoryDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Dropdown Menu */}
            {categoryDropdownOpen && (
              <div className="absolute left-0 top-full w-80 bg-white text-slate-900 border border-slate-200 rounded-b-xl shadow-2xl py-2 z-50">
                <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider">
                    Store Categories
                  </span>
                  <span className="text-[10px] font-bold text-[#185DB5] bg-blue-50 px-2 py-0.5 rounded">
                    Popular List
                  </span>
                </div>
                <div className="max-h-[65vh] overflow-y-auto divide-y divide-slate-100">
                  {shopByCategoriesList.map((cat, idx) => (
                    <Link
                      key={idx}
                      href={`/category/${cat.slug}`}
                      onClick={() => setCategoryDropdownOpen(false)}
                      className="px-4 py-2.5 flex items-center justify-between text-xs font-bold hover:bg-[#EEF5FC] hover:text-[#185DB5] transition group"
                    >
                      <span className="text-slate-800 group-hover:text-[#185DB5]">{cat.name}</span>
                      <span className="text-[11px] font-black bg-slate-100 group-hover:bg-[#185DB5] group-hover:text-white px-2 py-0.5 rounded-full text-slate-600 transition">
                        {cat.count}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Center Navigation Links */}
          <div className="hidden lg:flex items-center gap-7 text-xs font-bold uppercase tracking-wider text-white">
            <Link
              href="/"
              className="py-3.5 text-white border-b-2 border-[#C59B27] hover:text-[#C59B27] transition"
            >
              Home
            </Link>
            <Link href="/category/sanitary" className="py-3.5 hover:text-[#C59B27] transition">
              New Arrivals
            </Link>
            <Link href="/category/sanitary" className="py-3.5 hover:text-[#C59B27] transition">
              Sinks &amp; Sanitary
            </Link>
            <Link href="/category/electric" className="py-3.5 hover:text-[#C59B27] transition">
              Piping &amp; Electrical
            </Link>
            <Link href="/category/building-material" className="py-3.5 hover:text-[#C59B27] transition">
              Building Material
            </Link>
            <a href="#best-sellers" className="py-3.5 hover:text-[#C59B27] transition text-amber-300">
              Live Rate List
            </a>
            <a href="#brands" className="py-3.5 hover:text-[#C59B27] transition">
              Brands
            </a>
          </div>

          {/* Right Direct Call CTA */}
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-xs text-slate-300">Fast Lahore Delivery</span>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-[#1c1c1c] border-t border-slate-800 px-4 py-4 space-y-2.5 text-xs font-bold uppercase">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-white border-b border-slate-800 hover:text-[#C59B27]"
            >
              Home
            </Link>
            <Link
              href="/category/sanitary"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-white border-b border-slate-800 hover:text-[#C59B27]"
            >
              New Arrivals
            </Link>
            <Link
              href="/category/sanitary"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-white border-b border-slate-800 hover:text-[#C59B27]"
            >
              Sinks &amp; Sanitary
            </Link>
            <Link
              href="/category/electric"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-white border-b border-slate-800 hover:text-[#C59B27]"
            >
              Piping &amp; Electrical
            </Link>
            <Link
              href="/category/building-material"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-white border-b border-slate-800 hover:text-[#C59B27]"
            >
              Building Material
            </Link>
            <a
              href="#best-sellers"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-amber-300 border-b border-slate-800 hover:text-white"
            >
              Live Rate List
            </a>
            <a
              href="#brands"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-white hover:text-[#C59B27]"
            >
              Brands
            </a>
          </div>
        )}
      </nav>

      {/* Slide-out Cart Drawer Modal */}
      {cartDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs transition-opacity">
          <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between p-6">
            <div>
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-[#185DB5]" />
                  <h3 className="font-black text-lg text-slate-900">Your Shopping Cart</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setCartDrawerOpen(false)}
                  className="p-1 text-slate-500 hover:text-slate-900 rounded-md"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="py-12 text-center text-slate-500">
                <div className="w-16 h-16 rounded-full bg-[#EEF5FC] text-[#185DB5] flex items-center justify-center mx-auto mb-3">
                  <ShoppingCart className="w-8 h-8 stroke-[1.75]" />
                </div>
                <p className="font-bold text-sm text-slate-900">Your cart is currently empty</p>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  Browse our genuine Sanitary, Popular Pipes, Dura Tanks &amp; GM Cables catalog.
                </p>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-4 space-y-3">
              <a
                href="https://wa.me/923217165000?text=Assalam-o-Alaikum!%20I%20want%20to%20place%20an%20order%20for%20materials."
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 rounded-full bg-[#185DB5] hover:bg-[#13498F] text-white font-bold text-sm flex items-center justify-center gap-2 transition"
              >
                <span>WhatsApp Order: 0321-7165000</span>
                <ArrowRight className="w-4 h-4" />
              </a>
              <button
                type="button"
                onClick={() => setCartDrawerOpen(false)}
                className="w-full py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs transition"
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
