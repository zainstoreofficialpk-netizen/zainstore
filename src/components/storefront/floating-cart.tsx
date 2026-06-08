"use client";

import { useEffect, useRef, useState } from "react";
import { ShoppingCart } from "lucide-react";
import { useCartStore, cartItemCount } from "@/lib/store/cart-store";
import { useFlyContext } from "./cart-fly-context";

export function FloatingCart() {
  const { openCart, items } = useCartStore();
  const flyCtx = useFlyContext();
  const btnRef = useRef<HTMLButtonElement>(null);

  // Hydration-safe: don't render count until client is mounted
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const count = mounted ? cartItemCount(items) : 0;

  // Register this button as the fly animation target
  useEffect(() => {
    if (flyCtx && btnRef.current) {
      flyCtx.cartBtnRef.current = btnRef.current;
    }
  }, [flyCtx]);

  // Badge pop animation on count increase
  const prevCount = useRef(0);
  const [popKey, setPopKey] = useState(0);
  useEffect(() => {
    if (count > prevCount.current) setPopKey((k) => k + 1);
    prevCount.current = count;
  }, [count]);

  return (
    <button
      ref={btnRef}
      onClick={openCart}
      aria-label={`Open cart — ${count} item${count !== 1 ? "s" : ""}`}
      className="fixed left-4 bottom-24 md:bottom-8 z-50 h-14 w-14 bg-brand-500 hover:bg-brand-600 active:scale-95 text-white rounded-full shadow-2xl shadow-brand-500/40 flex items-center justify-center transition-all duration-200 hover:scale-110"
    >
      <ShoppingCart className="h-6 w-6" />

      {/* Item count badge */}
      {count > 0 && (
        <span
          key={popKey}
          className="absolute -top-1.5 -right-1.5 h-5 min-w-5 px-1.5 bg-accent-500 text-white text-[11px] font-black rounded-full flex items-center justify-center shadow-md leading-none animate-[cart-pop_0.4s_cubic-bezier(0.36,0.07,0.19,0.97)_both]"
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </button>
  );
}
