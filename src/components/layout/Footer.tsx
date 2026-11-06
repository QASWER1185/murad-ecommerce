import React from "react";
import Link from "next/link";
import {
  MapPin,
  Phone,
  MessageCircle,
  Truck,
  ShieldCheck,
  Clock,
  ArrowUpRight,
  ExternalLink,
} from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-300 border-t border-slate-800">
      {/* 1. Value Proposition Banner */}
      <div className="border-b border-slate-800/80 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm">Fast Lahore Delivery</h4>
              <p className="text-xs text-slate-400">
                Direct on-site material dispatch to Al Kabir Town, Raiwind Rd &amp; across Lahore.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-emerald-600/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm">100% Genuine Brands</h4>
              <p className="text-xs text-slate-400">
                Authorized stockists for Porta, Faisal Sanitary, GM Cables, and Bestway Cement.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-amber-600/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm">Wholesale &amp; Retail Rates</h4>
              <p className="text-xs text-slate-400">
                Transparent builder pricing and instant quotes via WhatsApp for bulk orders.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand & About */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="inline-block">
              <span className="text-2xl font-black tracking-tight text-white flex items-center gap-1.5">
                M Murad Sons
              </span>
              <span className="block text-[11px] font-semibold uppercase tracking-widest text-blue-400">
                Traders &amp; Building Material Supply
              </span>
            </Link>

            <p className="text-sm text-slate-300 leading-relaxed max-w-md">
              <strong className="text-white font-semibold">
                M Murad Sons - Premium Sanitary, Electric &amp; Building Materials.
              </strong>{" "}
              Your reliable supplier in Lahore for top-grade sanitary fixtures, authentic pure copper cables, and construction materials with rapid on-site delivery.
            </p>

            <div className="pt-2">
              <a
                href="https://wa.me/923086235608"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs tracking-wide shadow-lg shadow-emerald-950/40 transition-colors"
              >
                <MessageCircle className="w-4 h-4 fill-current" />
                <span>Chat for Direct Wholesale Rates</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-80" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4 border-l-2 border-blue-500 pl-2">
              Quick Links
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link
                  href="/category/sanitary"
                  className="hover:text-blue-400 transition-colors flex items-center justify-between group"
                >
                  <span>Sanitary</span>
                  <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </li>
              <li>
                <Link
                  href="/category/electric"
                  className="hover:text-blue-400 transition-colors flex items-center justify-between group"
                >
                  <span>Electric</span>
                  <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </li>
              <li>
                <Link
                  href="/category/building-material"
                  className="hover:text-blue-400 transition-colors flex items-center justify-between group"
                >
                  <span>Building Materials</span>
                  <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </li>
              <li>
                <Link
                  href="/"
                  className="hover:text-blue-400 transition-colors flex items-center justify-between group"
                >
                  <span>Home</span>
                  <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Featured Brands */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4 border-l-2 border-emerald-500 pl-2">
              Featured Brands
            </h3>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li>
                <Link href="/category/sanitary" className="hover:text-slate-200 transition-colors">
                  Porta Sanitary
                </Link>
              </li>
              <li>
                <Link href="/category/sanitary" className="hover:text-slate-200 transition-colors">
                  Faisal Sanitary
                </Link>
              </li>
              <li>
                <Link href="/category/electric" className="hover:text-slate-200 transition-colors">
                  GM Cables
                </Link>
              </li>
              <li>
                <Link href="/category/electric" className="hover:text-slate-200 transition-colors">
                  New Age Cables
                </Link>
              </li>
              <li>
                <Link href="/category/building-material" className="hover:text-slate-200 transition-colors">
                  Bestway Cement
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4 border-l-2 border-amber-500 pl-2">
              Contact Info
            </h3>
            <div className="space-y-3.5 text-sm text-slate-300">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span className="leading-snug">
                  Address: Al Kabir Town, Raiwind Road, Lahore
                </span>
              </div>

              <div className="flex items-start gap-2.5">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="flex flex-col gap-1">
                  <a
                    href="tel:+923086235608"
                    className="hover:text-emerald-400 transition-colors font-medium"
                  >
                    Phone: 0308-6235608
                  </a>
                  <a
                    href="tel:+923217165000"
                    className="hover:text-emerald-400 transition-colors font-medium"
                  >
                    0321-7165000
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-2.5 text-xs text-slate-400 pt-1">
                <Clock className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span>Mon – Sat: 8:00 AM – 9:00 PM</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Bottom Legal & Credits Strip */}
      <div className="border-t border-slate-900 bg-slate-950 py-5">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <p>© 2026 M Murad Sons. All rights reserved.</p>
          <p className="flex items-center gap-1.5">
            <span>Official Sanitary, Electric &amp; Cement Store in Lahore</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
