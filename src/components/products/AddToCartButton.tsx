"use client";

import React, { useState } from "react";
import { ShoppingCart, Check } from "lucide-react";

interface AddToCartButtonProps {
  productId: string;
  productName: string;
  price: number;
}

export default function AddToCartButton({
  productId,
  productName,
  price,
}: AddToCartButtonProps) {
  const [added, setAdded] = useState(false);

  const handleAddToCart = () => {
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
    }, 2000);
  };

  return (
    <button
      type="button"
      onClick={handleAddToCart}
      className={`w-full py-2.5 px-4 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200 shadow-sm cursor-pointer ${
        added
          ? "bg-emerald-600 text-white scale-[0.98]"
          : "bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white"
      }`}
    >
      {added ? (
        <>
          <Check className="w-4 h-4 stroke-[2.5]" />
          <span>Added to Cart</span>
        </>
      ) : (
        <>
          <ShoppingCart className="w-4 h-4 stroke-[2]" />
          <span>Add to Cart</span>
        </>
      )}
    </button>
  );
}
