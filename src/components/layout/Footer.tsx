import React from "react";
import Link from "next/link";
import MuradLogo from "@/components/ui/MuradLogo";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  MessageCircle,
  ArrowRight,
  ShieldCheck,
  Truck,
  Sparkles,
} from "lucide-react";

export default function Footer() {
  return (
    <footer id="footer-contact" className="w-full font-sans">
      {/* ========================================================
          FULL ROYAL BLUE FOOTER BACKGROUND (#185DB5)
      ======================================================== */}
      <div className="bg-[#185DB5] text-white pt-16 pb-14 px-4 sm:px-8 border-b border-blue-600/50">
        <div className="max-w-7xl mx-auto">
          {/* Top of Footer (Centered): White MuradLogo + Large Bold White Heading */}
          <div className="flex flex-col items-center justify-center text-center pb-12 border-b border-white/20 mb-12">
            <MuradLogo variant="white" className="mb-4" />
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight max-w-3xl">
              #1 Sanitary, Electric &amp; Building Material Store In Lahore
            </h2>
            <p className="text-white/80 text-xs sm:text-sm mt-2 max-w-xl">
              Authorized wholesale supplier for Porta, Faisal Sanitary, Popular Pipes, GM Cables, Dura Tanks &amp; Construction Supplies.
            </p>
          </div>

          {/* 4 COLUMNS INSIDE #185DB5 FOOTER */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 text-xs sm:text-sm">
            {/* Column 1: Get in touch */}
            <div className="space-y-4">
              <h3 className="text-base sm:text-lg font-black uppercase tracking-wider text-white border-b border-white/20 pb-2">
                Get in touch
              </h3>
              <p className="text-white/90 leading-relaxed">
                M. Murad Sons is a trusted sanitary, electric, kitchen, and building material store providing genuine brands at wholesale rates.
              </p>

              <div className="space-y-2.5 text-white/95 pt-1">
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-white shrink-0 mt-0.5" />
                  <span>Opposite Lake City, Adda Plot, Al Kabir Town, Raiwind Road, Lahore</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-white shrink-0" />
                  <a href="mailto:info@mmuradsons.com" className="hover:underline">
                    info@mmuradsons.com
                  </a>
                </div>
                <div className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-white shrink-0" />
                  <a href="tel:03217165000" className="font-bold underline hover:text-white/80">
                    0321-7165000
                  </a>
                  <span>|</span>
                  <a href="tel:03086235608" className="font-bold underline hover:text-white/80">
                    0308-6235608
                  </a>
                </div>
                <div className="flex items-center gap-2.5 text-white/80 text-xs">
                  <Clock className="w-3.5 h-3.5 text-white shrink-0" />
                  <span>Mon – Sun, 8:00 AM – 8:00 PM</span>
                </div>
              </div>

              {/* White Circular Social Media Icons */}
              <div className="flex items-center gap-2.5 pt-2">
                <a
                  href="https://wa.me/923217165000"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-white text-[#185DB5] flex items-center justify-center font-bold text-xs hover:bg-slate-100 transition shadow-sm"
                  title="WhatsApp"
                >
                  WA
                </a>
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-white text-[#185DB5] flex items-center justify-center font-bold text-xs hover:bg-slate-100 transition shadow-sm"
                  title="Facebook"
                >
                  FB
                </a>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-white text-[#185DB5] flex items-center justify-center font-bold text-xs hover:bg-slate-100 transition shadow-sm"
                  title="Instagram"
                >
                  IG
                </a>
                <a
                  href="https://tiktok.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-white text-[#185DB5] flex items-center justify-center font-bold text-xs hover:bg-slate-100 transition shadow-sm"
                  title="TikTok"
                >
                  TT
                </a>
                <a
                  href="https://youtube.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-white text-[#185DB5] flex items-center justify-center font-bold text-xs hover:bg-slate-100 transition shadow-sm"
                  title="YouTube"
                >
                  YT
                </a>
              </div>
            </div>

            {/* Column 2: Categories */}
            <div className="space-y-3">
              <h3 className="text-base sm:text-lg font-black uppercase tracking-wider text-white border-b border-white/20 pb-2">
                Categories
              </h3>
              <ul className="space-y-2 text-white/90">
                <li>
                  <Link href="/category/sanitary" className="hover:underline">
                    Chinese Kitchen Sinks
                  </Link>
                </li>
                <li>
                  <Link href="/category/sanitary" className="hover:underline">
                    Chinese Marble Basins
                  </Link>
                </li>
                <li>
                  <Link href="/category/sanitary" className="hover:underline">
                    Bathroom Vanities
                  </Link>
                </li>
                <li>
                  <Link href="/category/sanitary" className="hover:underline">
                    Porta Sanitary &amp; Commodes
                  </Link>
                </li>
                <li>
                  <Link href="/category/sanitary" className="hover:underline">
                    Faisal Sanitary Fittings
                  </Link>
                </li>
                <li>
                  <Link href="/category/sanitary" className="hover:underline">
                    Popular PPR-C &amp; uPVC Pipes
                  </Link>
                </li>
                <li>
                  <Link href="/category/sanitary" className="hover:underline">
                    DuraFlow &amp; DuraMax Fittings
                  </Link>
                </li>
                <li>
                  <Link href="/category/electric" className="hover:underline">
                    GM Cables &amp; Electric
                  </Link>
                </li>
                <li>
                  <Link href="/category/sanitary" className="hover:underline">
                    Dura Water Tanks
                  </Link>
                </li>
                <li>
                  <Link href="/category/building-material" className="hover:underline">
                    Bestway Cement &amp; Bricks
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Support */}
            <div className="space-y-3">
              <h3 className="text-base sm:text-lg font-black uppercase tracking-wider text-white border-b border-white/20 pb-2">
                Support
              </h3>
              <ul className="space-y-2 text-white/90">
                <li>
                  <a href="#best-sellers" className="hover:underline">
                    Online Rate Sheet
                  </a>
                </li>
                <li>
                  <a
                    href="https://wa.me/923217165000"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline font-semibold"
                  >
                    WhatsApp Estimate (0321-7165000)
                  </a>
                </li>
                <li>
                  <a
                    href="https://wa.me/923086235608"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline font-semibold"
                  >
                    Bulk / Contractor Inquiry
                  </a>
                </li>
                <li>
                  <a
                    href="https://maps.google.com/?q=Al+Kabir+Town+Raiwind+Road+Lahore"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    Store Location Map
                  </a>
                </li>
                <li>
                  <Link href="/category/sanitary" className="hover:underline">
                    Porta Brand Catalog
                  </Link>
                </li>
                <li>
                  <Link href="/category/electric" className="hover:underline">
                    GM Cables Certified Rates
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 4: Useful links */}
            <div className="space-y-3">
              <h3 className="text-base sm:text-lg font-black uppercase tracking-wider text-white border-b border-white/20 pb-2">
                Useful links
              </h3>
              <ul className="space-y-2 text-white/90">
                <li>
                  <a href="#best-sellers" className="hover:underline">
                    Orders &amp; Inquiries
                  </a>
                </li>
                <li>
                  <a href="#footer-contact" className="hover:underline">
                    Return &amp; Exchange Policy
                  </a>
                </li>
                <li>
                  <a href="#footer-contact" className="hover:underline">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="#footer-contact" className="hover:underline">
                    Shipping Policy (Lahore On-Site Delivery)
                  </a>
                </li>
                <li>
                  <a href="tel:03217165000" className="hover:underline font-semibold">
                    Contact Us Direct
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          BOTTOM WHITE BAR: Copyright © 2026 M. MURAD SONS
          bg-white text-[#222222] py-4 px-6 text-center text-sm
      ======================================================== */}
      <div className="bg-white text-[#222222] py-4 px-6 text-center text-xs sm:text-sm font-semibold border-t border-gray-200">
        <p>Copyright © 2026 M. MURAD SONS all rights reserved.</p>
      </div>
    </footer>
  );
}
