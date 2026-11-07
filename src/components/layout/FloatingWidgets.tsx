"use client";

import React, { useState, useEffect } from "react";
import { Headphones, MessageCircle, ArrowUp, X, CheckCircle2 } from "lucide-react";

const liveSalesNotifications = [
  {
    customer: "Hamdan (Lake City, Lahore)",
    action: "purchased Chinese Black Nano Waterfall Kitchen Sink",
    time: "15 minutes ago",
  },
  {
    customer: "Tahir Iqbal (Al Kabir Town)",
    action: "ordered Popular PPR-C Pipes & GM Cable 7/29",
    time: "32 minutes ago",
  },
  {
    customer: "Haji Younas (Raiwind Road)",
    action: "ordered Faisal Sanitary Fittings & Porta Commode",
    time: "45 minutes ago",
  },
  {
    customer: "Chaudhry Bilal (Bahria Orchard)",
    action: "requested daily site quote for Bestway Cement 50kg",
    time: "58 minutes ago",
  },
];

export default function FloatingWidgets() {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [popupVisible, setPopupVisible] = useState(true);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Cycle notifications every 12 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % liveSalesNotifications.length);
    }, 12000);
    return () => clearInterval(timer);
  }, []);

  // Monitor scroll for scroll-to-top button
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const currentNotification = liveSalesNotifications[currentIdx];

  return (
    <>
      {/* 1. Bottom-Left Live Sales / Inquiry Activity Popup */}
      {popupVisible && (
        <div className="fixed bottom-4 left-4 z-40 bg-white border border-[#E5E5E5] rounded-xl shadow-xl p-3 flex items-start gap-3 max-w-xs sm:max-w-sm animate-fade-in transition-all">
          <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
            <CheckCircle2 className="w-5 h-5 fill-emerald-100" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-xs font-bold text-[#111111]">
              {currentNotification.customer}
            </p>
            <p className="text-[11px] text-[#444444] leading-snug mt-0.5">
              {currentNotification.action}
            </p>
            <div className="flex items-center gap-1.5 mt-1 text-[10px] text-[#777777]">
              <span>{currentNotification.time}</span>
              <span>•</span>
              <span className="text-emerald-700 font-semibold">Verified Order</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setPopupVisible(false)}
            className="text-gray-400 hover:text-gray-600 p-0.5"
            title="Dismiss notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 2. Bottom-Right Floating Action Stack */}
      <div className="fixed bottom-5 right-5 z-40 flex flex-col items-center gap-3">
        {/* Blue Support Headset Button (#185DB5) */}
        <a
          href="tel:03217165000"
          className="w-12 h-12 rounded-full bg-[#185DB5] hover:bg-[#13498F] text-white shadow-lg flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
          title="Direct Phone Support (0321-7165000)"
        >
          <Headphones className="w-5 h-5" />
        </a>

        {/* Green WhatsApp Button (#25D366) */}
        <a
          href="https://wa.me/923217165000?text=Assalam-o-Alaikum%20M.%20Murad%20Sons!%20I%20want%20to%20check%20today's%20rates."
          target="_blank"
          rel="noopener noreferrer"
          className="w-14 h-14 rounded-full bg-[#25D366] hover:bg-[#20ba5a] text-white shadow-xl flex items-center justify-center transition-transform hover:scale-110 active:scale-95 animate-pulse"
          title="Chat on WhatsApp (0321-7165000)"
        >
          <MessageCircle className="w-7 h-7 fill-white text-[#25D366]" />
        </a>

        {/* White Scroll-to-Top Square Button */}
        {showScrollTop && (
          <button
            type="button"
            onClick={scrollToTop}
            className="w-10 h-10 rounded bg-white border border-slate-200 text-[#222222] hover:text-[#185DB5] shadow flex items-center justify-center transition-all hover:border-[#185DB5]"
            title="Scroll to Top"
          >
            <ArrowUp className="w-4 h-4 stroke-[2.5]" />
          </button>
        )}
      </div>
    </>
  );
}

