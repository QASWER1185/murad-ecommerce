import React from "react";
import Link from "next/link";

interface MuradLogoProps {
  variant?: "default" | "white";
  className?: string;
}

export default function MuradLogo({ variant = "default", className = "" }: MuradLogoProps) {
  const isWhite = variant === "white";

  return (
    <Link href="/" className={`inline-flex items-center gap-3 group select-none ${className}`}>
      {/* Geometric Gold & Royal Blue Emblem (Hexagon + MMS Architecture Icon) */}
      <div className="relative w-10 h-10 sm:w-11 sm:h-11 shrink-0 flex items-center justify-center">
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full drop-shadow-sm transition-transform duration-300 group-hover:scale-105"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Hexagonal Outer Frame in Luxury Gold */}
          <polygon
            points="50,4 92,26 92,74 50,96 8,74 8,26"
            stroke={isWhite ? "#FFFFFF" : "#C59B27"}
            strokeWidth="5"
            fill={isWhite ? "rgba(255,255,255,0.12)" : "rgba(197,155,39,0.08)"}
            strokeLinejoin="round"
          />

          {/* Left Wing / Pillar: Royal Blue */}
          <path
            d="M 26 70 L 26 36 L 40 52 L 40 70 Z"
            fill={isWhite ? "#FFFFFF" : "#185DB5"}
          />

          {/* Right Wing / Pillar: Royal Blue */}
          <path
            d="M 74 70 L 74 36 L 60 52 L 60 70 Z"
            fill={isWhite ? "#FFFFFF" : "#185DB5"}
          />

          {/* Center Dynamic Chevron / Building Apex: Luxury Gold */}
          <path
            d="M 50 20 L 64 36 L 50 48 L 36 36 Z"
            fill={isWhite ? "#E6D3A3" : "#C59B27"}
          />

          {/* Center Keystone Drop */}
          <circle
            cx="50"
            cy="62"
            r="5"
            fill={isWhite ? "#FFFFFF" : "#C59B27"}
          />
        </svg>
      </div>

      {/* Typography: M. MURAD SONS & BUILDING MATERIAL STORE */}
      <div className="flex flex-col text-left">
        <div className="flex items-baseline tracking-tight">
          <span
            className={`text-xl sm:text-2xl font-black leading-none font-sans tracking-tight ${
              isWhite ? "text-white" : "text-[#185DB5]"
            }`}
          >
            M. MURAD SONS
          </span>
        </div>
        <span
          className={`text-[9px] sm:text-[10px] font-black tracking-[0.25em] uppercase mt-1 leading-none ${
            isWhite ? "text-[#E6D3A3]" : "text-[#C59B27]"
          }`}
        >
          BUILDING MATERIAL STORE
        </span>
      </div>
    </Link>
  );
}
