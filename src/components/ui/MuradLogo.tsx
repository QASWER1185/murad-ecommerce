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
      {/* NASGAS-style Dual Ribbon / Flame & Drop Emblem */}
      <div className="relative w-10 h-10 sm:w-11 sm:h-11 shrink-0 flex items-center justify-center">
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full drop-shadow-sm transition-transform duration-300 group-hover:scale-105"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Outer Royal Blue Swoosh */}
          <path
            d="M 22 78 C 10 60 14 30 38 16 C 54 6 74 12 82 24 C 70 20 54 22 44 32 C 32 44 34 62 48 70 C 58 76 72 74 80 66 C 82 76 70 88 54 90 C 38 92 28 86 22 78 Z"
            fill={isWhite ? "#FFFFFF" : "#185DB5"}
          />
          {/* Inner Flame Red Dynamic Swoosh */}
          <path
            d="M 46 72 C 38 64 38 48 50 38 C 60 30 74 34 82 46 C 76 42 66 42 60 48 C 54 54 56 64 66 68 C 58 72 50 74 46 72 Z"
            fill={isWhite ? "#FFCDD2" : "#E53935"}
          />
          {/* Center Dynamic Core Drop */}
          <circle
            cx="64"
            cy="56"
            r="7"
            fill={isWhite ? "#FFFFFF" : "#185DB5"}
          />
        </svg>
      </div>

      {/* Typography: Exact NASGAS (nG APPLIANCES) Proportions */}
      <div className="flex flex-col text-left">
        <div className="flex items-baseline tracking-tight">
          <span
            className={`text-2xl sm:text-[28px] font-black leading-none font-sans ${
              isWhite ? "text-white" : "text-[#111111]"
            }`}
          >
            mM
          </span>
          <span
            className={`text-sm sm:text-base font-extrabold ml-1.5 tracking-tight ${
              isWhite ? "text-white/90" : "text-[#185DB5]"
            }`}
          >
            MURAD
          </span>
        </div>
        <span
          className={`text-[9px] sm:text-[10px] font-bold tracking-[0.22em] uppercase mt-0.5 leading-none ${
            isWhite ? "text-white/80" : "text-[#444444]"
          }`}
        >
          BUILDING MATERIAL
        </span>
      </div>
    </Link>
  );
}
