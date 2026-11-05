"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Search,
  ShoppingCart,
  Heart,
  ChevronDown,
  Menu,
  X,
  Truck,
  MessageCircle,
  Phone,
} from "lucide-react";

const sanitaryBrands = [
  { name: "Porta", href: "/category/sanitary/porta" },
  { name: "Faisal Sanitary", href: "/category/sanitary/faisal-sanitary" },
  { name: "Dell Ceramics", href: "/category/sanitary/dell-ceramics" },
  { name: "Imported China", href: "/category/sanitary/imported-china" },
];

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sanitaryDropdownOpen, setSanitaryDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Future search route handling
      console.log("Searching for:", searchQuery);
    }
  };

  return (
    <header className="w-full bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
      {/* 1. TOP BAR */}
      <div className="bg-slate-900 text-slate-200 text-xs sm:text-sm py-2 px-4 transition-colors">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          {/* Left: Delivery notice */}
          <div className="flex items-center gap-2 font-medium">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <Truck className="w-4 h-4 text-emerald-400" />
            <span>Fast Delivery in Lahore</span>
            <span className="hidden md:inline text-slate-400">| Wholesale & Retail</span>
          </div>

          {/* Right: WhatsApp Building Material Rates CTA */}
          <div className="flex items-center gap-3">
            <a
              href="https://wa.me/923086235608"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-sm transition-transform active:scale-95"
            >
              <MessageCircle className="w-3.5 h-3.5 fill-current" />
              <span>Building Material Rates</span>
            </a>
            <a
              href="tel:+923086235608"
              className="hidden lg:flex items-center gap-1 text-slate-300 hover:text-white transition-colors"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>+92 308 6235608</span>
            </a>
          </div>
        </div>
      </div>

      {/* 2. MAIN HEADER */}
      <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Brand Logo */}
          <Link href="/" className="flex flex-col group shrink-0">
            <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 group-hover:text-blue-700 transition-colors">
              M Murad Sons
            </span>
            <span className="text-[10px] sm:text-xs font-medium uppercase tracking-wider text-slate-500">
              Sanitary &amp; Electric Store
            </span>
          </Link>

          {/* Center Search Bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="hidden md:flex flex-1 max-w-2xl mx-4 relative items-center"
          >
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search sanitary, electric, bathroom vanity, taps, switches..."
              className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg pl-4 pr-11 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
            />
            <button
              type="submit"
              aria-label="Search products"
              className="absolute right-1 top-1 bottom-1 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center justify-center transition-colors"
            >
              <Search className="w-4 h-4" />
            </button>
          </form>

          {/* Right: Wishlist & Cart Actions */}
          <div className="flex items-center gap-3 sm:gap-5 shrink-0">
            {/* Wishlist */}
            <Link
              href="/wishlist"
              className="flex items-center gap-1.5 text-gray-700 hover:text-blue-600 transition-colors relative p-1.5"
              title="Wishlist"
            >
              <div className="relative">
                <Heart className="w-6 h-6 stroke-[1.75]" />
                <span className="absolute -top-1 -right-2 bg-rose-500 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                  0
                </span>
              </div>
              <span className="hidden lg:inline text-xs font-medium">Wishlist</span>
            </Link>

            {/* Cart */}
            <Link
              href="/cart"
              className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors relative p-1.5"
              title="Shopping Cart"
            >
              <div className="relative">
                <ShoppingCart className="w-6 h-6 stroke-[1.75]" />
                <span className="absolute -top-1 -right-2 bg-blue-600 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                  0
                </span>
              </div>
              <div className="hidden lg:flex flex-col text-left">
                <span className="text-[10px] text-gray-500 uppercase leading-none">Cart</span>
                <span className="text-xs font-bold text-gray-900">PKR 0.00</span>
              </div>
            </Link>

            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-700 hover:text-blue-600 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar (visible on small screens) */}
        <form onSubmit={handleSearchSubmit} className="mt-3 md:hidden relative flex items-center">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products..."
            className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg pl-4 pr-11 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
          />
          <button
            type="submit"
            aria-label="Search"
            className="absolute right-1 top-1 bottom-1 px-3 bg-blue-600 text-white rounded-md flex items-center justify-center"
          >
            <Search className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* 3. BOTTOM NAVIGATION MENU */}
      <nav className="bg-slate-100 border-t border-gray-200 hidden md:block">
        <div className="max-w-7xl mx-auto px-4 flex items-center gap-8 text-sm font-semibold text-gray-800">
          <Link
            href="/"
            className="py-3 hover:text-blue-600 border-b-2 border-transparent hover:border-blue-600 transition-colors"
          >
            Home
          </Link>

          {/* Sanitary with Dropdown */}
          <div
            className="relative group py-3 cursor-pointer"
            onMouseEnter={() => setSanitaryDropdownOpen(true)}
            onMouseLeave={() => setSanitaryDropdownOpen(false)}
          >
            <div className="flex items-center gap-1 hover:text-blue-600 border-b-2 border-transparent group-hover:border-blue-600 transition-colors">
              <Link href="/category/sanitary">Sanitary</Link>
              <ChevronDown className="w-4 h-4 transition-transform group-hover:rotate-180" />
            </div>

            {/* Dropdown Menu */}
            <div
              className={`absolute left-0 top-full w-56 bg-white border border-gray-200 rounded-b-lg shadow-lg py-2 z-50 transition-all duration-150 ${
                sanitaryDropdownOpen ? "opacity-100 visible translate-y-0" : "opacity-0 invisible -translate-y-1"
              }`}
            >
              <div className="px-3 py-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                Top Sanitary Brands
              </div>
              {sanitaryBrands.map((brand) => (
                <Link
                  key={brand.name}
                  href={brand.href}
                  className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                >
                  {brand.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Electric */}
          <Link
            href="/category/electric"
            className="py-3 hover:text-blue-600 border-b-2 border-transparent hover:border-blue-600 transition-colors"
          >
            Electric
          </Link>

          {/* Additional Quick Categories */}
          <Link
            href="/category/pipes-fittings"
            className="py-3 hover:text-blue-600 border-b-2 border-transparent hover:border-blue-600 transition-colors"
          >
            Pipes &amp; Fittings
          </Link>

          <Link
            href="/deals"
            className="py-3 text-rose-600 hover:text-rose-700 border-b-2 border-transparent hover:border-rose-600 transition-colors font-bold ml-auto"
          >
            Special Offers
          </Link>
        </div>
      </nav>

      {/* MOBILE COLLAPSIBLE MENU */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 px-4 py-4 space-y-3">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-base font-medium text-gray-800 hover:text-blue-600 border-b border-gray-100"
          >
            Home
          </Link>

          {/* Sanitary Collapsible */}
          <div>
            <button
              type="button"
              onClick={() => setSanitaryDropdownOpen(!sanitaryDropdownOpen)}
              className="w-full flex items-center justify-between py-2 text-base font-medium text-gray-800 hover:text-blue-600 border-b border-gray-100"
            >
              <span>Sanitary</span>
              <ChevronDown
                className={`w-4 h-4 transition-transform ${sanitaryDropdownOpen ? "rotate-180" : ""}`}
              />
            </button>
            {sanitaryDropdownOpen && (
              <div className="pl-4 py-1 space-y-1 bg-gray-50 rounded-md mt-1">
                {sanitaryBrands.map((brand) => (
                  <Link
                    key={brand.name}
                    href={brand.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block py-1.5 text-sm text-gray-600 hover:text-blue-600"
                  >
                    {brand.name}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Electric */}
          <Link
            href="/category/electric"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-base font-medium text-gray-800 hover:text-blue-600 border-b border-gray-100"
          >
            Electric
          </Link>

          {/* Pipes & Fittings */}
          <Link
            href="/category/pipes-fittings"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-base font-medium text-gray-800 hover:text-blue-600 border-b border-gray-100"
          >
            Pipes &amp; Fittings
          </Link>

          {/* WhatsApp Direct CTA Mobile */}
          <div className="pt-2">
            <a
              href="https://wa.me/923086235608"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-emerald-600 text-white font-semibold text-sm"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp Rates: 0308 6235608</span>
            </a>
          </div>
        </div>
      )}
    </header>
  );
}

