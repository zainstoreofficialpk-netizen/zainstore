"use client";

import { useEffect } from "react";
import Link from "next/link";
import { X, Trash2, ShoppingBag, Plus, Minus, ShoppingCart } from "lucide-react";
import { useCartStore, cartItemCount, cartSubtotal } from "@/lib/store/cart-store";
import { formatCurrency } from "@/lib/format";

export function CartDrawer() {
  const { items, isOpen, closeCart, updateQty, removeItem, clearCart } =
    useCartStore();
  const count = cartItemCount(items);
  const subtotal = cartSubtotal(items);

  // Lock body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") closeCart(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [closeCart]);

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden="true"
        className="fixed inset-0 bg-black/50 backdrop-blur-[2px] z-[100] transition-opacity duration-300"
        style={{ opacity: isOpen ? 1 : 0, pointerEvents: isOpen ? "auto" : "none" }}
        onClick={closeCart}
      />

      {/* Drawer panel */}
      <div
        role="dialog"
        aria-label="Shopping cart"
        aria-modal="true"
        className="fixed top-0 right-0 h-full w-full max-w-[400px] bg-white z-[101] flex flex-col shadow-2xl transition-transform duration-300 ease-out"
        style={{ transform: isOpen ? "translateX(0)" : "translateX(100%)" }}
      >
        {/* ── Header ─────────────────────────────────── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <ShoppingCart className="h-5 w-5 text-brand-500" />
            <h2 className="font-black text-zinc-900 text-[1.05rem]">Shopping Cart</h2>
            {count > 0 && (
              <span className="bg-brand-500 text-white text-[11px] font-black px-2 py-0.5 rounded-full leading-none">
                {count}
              </span>
            )}
          </div>
          <button
            onClick={closeCart}
            className="h-8 w-8 rounded-full hover:bg-zinc-100 flex items-center justify-center text-zinc-400 hover:text-zinc-900 transition-colors"
            aria-label="Close cart"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Empty state ─────────────────────────────── */}
        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
            <div className="h-24 w-24 rounded-full bg-zinc-100 flex items-center justify-center mb-5">
              <ShoppingBag className="h-11 w-11 text-zinc-300" />
            </div>
            <p className="font-black text-zinc-800 text-lg mb-1.5">Your cart is empty</p>
            <p className="text-sm text-zinc-400 mb-7 leading-relaxed">
              Browse products and click Add to Cart to get started
            </p>
            <button
              onClick={closeCart}
              className="px-8 py-3 bg-brand-500 hover:bg-brand-600 text-white font-bold text-sm rounded-full transition-colors shadow-lg shadow-brand-500/25"
            >
              Start Shopping
            </button>
          </div>
        ) : (
          <>
            {/* ── Item list ───────────────────────────── */}
            <div className="flex-1 overflow-y-auto px-5 py-2">
              {items.map((item, idx) => (
                <div
                  key={item.id}
                  className={`flex gap-3.5 py-4 ${idx < items.length - 1 ? "border-b border-zinc-100" : ""}`}
                >
                  {/* Product image */}
                  <Link
                    href={`/shop/product/${item.slug}`}
                    onClick={closeCart}
                    className="shrink-0 h-[68px] w-[68px] rounded-xl overflow-hidden bg-zinc-100 border border-zinc-100 hover:opacity-85 transition-opacity"
                  >
                    {item.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag className="h-5 w-5 text-zinc-300" />
                      </div>
                    )}
                  </Link>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0">
                        {item.storeName && (
                          <p className="text-[10px] text-zinc-400 truncate mb-0.5">
                            {item.storeName}
                          </p>
                        )}
                        <p className="text-[13px] font-semibold text-zinc-800 leading-snug line-clamp-2">
                          {item.name}
                        </p>
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="shrink-0 h-6 w-6 rounded-full hover:bg-red-50 flex items-center justify-center text-zinc-300 hover:text-red-400 transition-colors mt-0.5"
                        aria-label={`Remove ${item.name}`}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      {/* Line price */}
                      <div>
                        <p className="font-black text-zinc-900 text-[13px]">
                          {formatCurrency((item.salePrice ?? item.price) * item.quantity)}
                        </p>
                        {item.quantity > 1 && (
                          <p className="text-[10px] text-zinc-400">
                            {formatCurrency(item.salePrice ?? item.price)} each
                          </p>
                        )}
                      </div>

                      {/* Quantity stepper */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQty(item.id, -1)}
                          className="h-7 w-7 rounded-full border border-zinc-200 hover:border-brand-400 hover:bg-brand-50 flex items-center justify-center text-zinc-500 hover:text-brand-600 transition-all duration-150"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-5 text-center text-[13px] font-black text-zinc-900 tabular-nums">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQty(item.id, 1)}
                          className="h-7 w-7 rounded-full border border-zinc-200 hover:border-brand-400 hover:bg-brand-50 flex items-center justify-center text-zinc-500 hover:text-brand-600 transition-all duration-150"
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* ── Footer ──────────────────────────────── */}
            <div className="border-t border-zinc-100 px-5 py-5 space-y-4 shrink-0">
              {/* Subtotal */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-500">
                  Subtotal{" "}
                  <span className="text-zinc-400 text-xs">
                    ({count} item{count !== 1 ? "s" : ""})
                  </span>
                </span>
                <span className="font-black text-zinc-900 text-[1.1rem]">
                  {formatCurrency(subtotal)}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 -mt-2">
                Shipping and taxes calculated at checkout
              </p>

              {/* Checkout CTA */}
              <Link
                href="/checkout"
                onClick={closeCart}
                className="w-full py-3.5 bg-accent-500 hover:bg-accent-600 active:bg-accent-700 text-white font-black rounded-xl transition-colors text-[13px] shadow-lg shadow-accent-500/25 flex items-center justify-center gap-2"
              >
                Proceed to Checkout →
              </Link>

              {/* Secondary actions */}
              <div className="flex items-center justify-between pt-0.5">
                <button
                  onClick={closeCart}
                  className="text-[13px] text-zinc-500 hover:text-zinc-900 font-semibold transition-colors"
                >
                  ← Continue Shopping
                </button>
                <button
                  onClick={clearCart}
                  className="flex items-center gap-1.5 text-[11px] text-zinc-400 hover:text-red-500 font-semibold transition-colors"
                >
                  <Trash2 className="h-3 w-3" />
                  Clear all
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
