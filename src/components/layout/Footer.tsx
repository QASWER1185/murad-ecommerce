"use client";

import React, { useState } from "react";
import Link from "next/link";
import MuradLogo from "@/components/ui/MuradLogo";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  ShieldCheck,
  Truck,
  Award,
  CreditCard,
  CheckCircle,
} from "lucide-react";

export default function Footer() {
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail.trim()) {
      setSubscribed(true);
      setNewsletterEmail("");
      setTimeout(() => setSubscribed(false), 4000);
    }
  };
  return (
    <footer id="footer-contact" className="w-full font-sans border-t-4 border-[#C59B27]">
      {/* ========================================================
          ROYAL BLUE FOOTER: bg-[#185DB5] text-white pt-12 pb-8
      ======================================================== */}
      <div className="bg-[#185DB5] text-white pt-12 pb-10 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Top Branding Section */}
          <div className="flex flex-col sm:flex-row items-center justify-between pb-10 border-b border-blue-400/30 gap-6">
            <div className="flex items-center gap-4">
              <MuradLogo variant="white" />
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-semibold text-blue-100">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-[#C59B27]" />
                <span>Fast On-Site Lahore Delivery</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#C59B27]" />
                <span>100% Genuine Authorized Brands</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-[#C59B27]" />
                <span>Transparent Wholesale Builder Rates</span>
              </div>
            </div>
          </div>

          {/* 5 Columns Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 pt-10 text-xs sm:text-sm">
            {/* Column 1: Our Store */}
            <div className="space-y-3">
              <h4 className="text-sm font-black uppercase tracking-wider text-[#E6D3A3] border-b border-blue-400/30 pb-2">
                Our Store
              </h4>
              <p className="text-blue-100 text-xs leading-relaxed">
                M. Murad Sons is Lahore&apos;s leading supplier of luxury Chinese waterfall sinks, Porta commodes, Faisal fittings, Popular pipes, Dura tanks, and GM copper cables.
              </p>
              <div className="pt-2 text-xs text-blue-200 space-y-1">
                <p>Wholesale &amp; Retail supply</p>
                <p>Contractor &amp; Project estimations</p>
              </div>
            </div>

            {/* Column 2: Categories */}
            <div className="space-y-3">
              <h4 className="text-sm font-black uppercase tracking-wider text-[#E6D3A3] border-b border-blue-400/30 pb-2">
                Categories
              </h4>
              <ul className="space-y-2 text-xs text-blue-100">
                <li>
                  <Link href="/category/sanitary" className="hover:text-white transition">
                    Porta Sanitary &amp; Commodes
                  </Link>
                </li>
                <li>
                  <Link href="/category/sanitary" className="hover:text-white transition">
                    Faisal Sanitary Fittings
                  </Link>
                </li>
                <li>
                  <Link href="/category/sanitary" className="hover:text-white transition">
                    Chinese Waterfall Sinks
                  </Link>
                </li>
                <li>
                  <Link href="/category/sanitary" className="hover:text-white transition">
                    Marble Art Basins &amp; Vanities
                  </Link>
                </li>
                <li>
                  <Link href="/category/sanitary" className="hover:text-white transition">
                    Popular &amp; DuraFlow Pipes
                  </Link>
                </li>
                <li>
                  <Link href="/category/electric" className="hover:text-white transition">
                    GM &amp; New Age Pure Copper Cables
                  </Link>
                </li>
                <li>
                  <Link href="/category/building-material" className="hover:text-white transition">
                    Bestway Cement &amp; Construction Material
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Customer Service */}
            <div className="space-y-3">
              <h4 className="text-sm font-black uppercase tracking-wider text-[#E6D3A3] border-b border-blue-400/30 pb-2">
                Customer Service
              </h4>
              <ul className="space-y-2 text-xs text-blue-100">
                <li>
                  <a href="#best-sellers" className="hover:text-white transition">
                    Online Rate List
                  </a>
                </li>
                <li>
                  <a
                    href="https://wa.me/923217165000"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white transition font-bold text-amber-300"
                  >
                    WhatsApp Rate Quotation
                  </a>
                </li>
                <li>
                  <a href="#brands" className="hover:text-white transition">
                    Brand Warranty &amp; Authenticity
                  </a>
                </li>
                <li>
                  <a href="#footer-contact" className="hover:text-white transition">
                    Delivery &amp; Site Dispatch Policy
                  </a>
                </li>
                <li>
                  <a href="#footer-contact" className="hover:text-white transition">
                    Contractor Discounts
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 4: Contact Us */}
            <div className="space-y-3">
              <h4 className="text-sm font-black uppercase tracking-wider text-[#E6D3A3] border-b border-blue-400/30 pb-2">
                Contact Us
              </h4>
              <div className="space-y-2.5 text-xs text-blue-100">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-[#C59B27] shrink-0 mt-0.5" />
                  <span>
                    Opposite Lake City, Adda Plot, Al Kabir Town, Raiwind Road, Lahore
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-[#C59B27] shrink-0" />
                  <div className="flex flex-col">
                    <a href="tel:03217165000" className="font-bold hover:underline">
                      0321-7165000
                    </a>
                    <a href="tel:03086235608" className="hover:underline text-blue-200">
                      0308-6235608
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-[#C59B27] shrink-0" />
                  <a href="mailto:info@mmuradsons.com" className="hover:underline">
                    info@mmuradsons.com
                  </a>
                </div>
                <div className="flex items-center gap-2 text-blue-200">
                  <Clock className="w-3.5 h-3.5 text-[#C59B27] shrink-0" />
                  <span>Mon – Sun: 8:00 AM – 8:00 PM</span>
                </div>
              </div>
            </div>

            {/* Column 5: Email Newsletter */}
            <div className="space-y-3">
              <h4 className="text-sm font-black uppercase tracking-wider text-[#E6D3A3] border-b border-blue-400/30 pb-2">
                Email Newsletter
              </h4>
              <p className="text-xs text-blue-100">
                Subscribe for weekly discount rates on pipes, sanitary, and daily construction material updates.
              </p>
              <form
                onSubmit={handleNewsletterSubmit}
                className="space-y-2 pt-1"
              >
                <input
                  type="email"
                  required
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full bg-white text-slate-900 rounded-md px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#C59B27]"
                />
                <button
                  type="submit"
                  className="w-full bg-[#C59B27] hover:bg-[#b08920] text-slate-950 font-black py-2 rounded-md text-xs tracking-wider uppercase transition shadow-sm cursor-pointer"
                >
                  Sign Up
                </button>
              </form>
              {subscribed && (
                <p className="text-[11px] font-bold text-emerald-300 pt-1">
                  ✓ Thank you for subscribing!
                </p>
              )}
            </div>
          </div>

          {/* Bottom Trust & Payment Badges */}
          <div className="mt-12 pt-6 border-t border-blue-400/30 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-blue-200">
            <p>© 2026 M. MURAD SONS. All rights reserved. Lahore, Pakistan.</p>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <span className="flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-300" />
                <span>Cash on Delivery</span>
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-300" />
                <span>Direct Bank Transfer</span>
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-300" />
                <span>On-Site Site Verification</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
