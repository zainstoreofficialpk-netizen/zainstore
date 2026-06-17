"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Zap } from "lucide-react";
import { ProductCard, type ProductCardData } from "./product-card";
import { CountdownTimer } from "./countdown-timer";

const INITIAL_ROWS = 2;
const COLS = 6; // cards per row at max breakpoint
const INITIAL_SHOW = INITIAL_ROWS * COLS; // 12

export function FlashDeals({ products }: { products: ProductCardData[] }) {
  const [expanded, setExpanded] = useState(false);

  if (products.length === 0) return null;

  const visible = expanded ? products : products.slice(0, INITIAL_SHOW);
  const hasMore = products.length > INITIAL_SHOW;

  return (
    <section>
      <div className="bg-gradient-to-r from-accent-600 via-accent-500 to-red-500">
        <div className="container mx-auto px-4 max-w-7xl py-5">
          {/* Header */}
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-white fill-white" />
              </div>
              <div>
                <p className="text-white/70 text-[9px] sm:text-[10px] font-black uppercase tracking-widest leading-none">
                  Today Only
                </p>
                <p className="text-white text-base sm:text-xl font-black leading-tight">Flash Deals</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="flex items-center gap-1.5 sm:gap-2.5">
                <span className="hidden xs:inline text-white/70 text-[10px] sm:text-xs font-semibold">Ends in</span>
                <CountdownTimer />
              </div>
              <Link
                href="/shop/sale"
                className="flex items-center gap-1 sm:gap-2 text-[11px] sm:text-sm font-bold text-white bg-white/15 hover:bg-white/25 px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-xl transition-colors shrink-0"
              >
                All <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4" />
              </Link>
            </div>
          </div>

          {/* Product grid — 2 cols mobile → 6 desktop */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 sm:gap-3">
            {visible.map((product) => (
              <ProductCard key={product.id} product={product} compact />
            ))}
          </div>

          {/* Expand / collapse */}
          {hasMore && (
            <div className="mt-5 text-center">
              <button
                onClick={() => setExpanded((e) => !e)}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-white/15 hover:bg-white/25 text-white text-sm font-bold rounded-xl transition-colors border border-white/20"
              >
                {expanded ? (
                  "Show Less"
                ) : (
                  <>
                    View More Deals ({products.length - INITIAL_SHOW} more){" "}
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
