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
          <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2.5">
                <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <Zap className="h-5 w-5 text-white fill-white" />
                </div>
                <div>
                  <p className="text-white/70 text-[10px] font-black uppercase tracking-widest leading-none">
                    Today Only
                  </p>
                  <p className="text-white text-xl font-black leading-tight">Flash Deals</p>
                </div>
              </div>
              <div className="hidden sm:block h-10 w-px bg-white/20" />
              <div className="flex items-center gap-2.5">
                <span className="text-white/70 text-xs font-semibold">Ends in</span>
                <CountdownTimer />
              </div>
            </div>
            <Link
              href="/shop/sale"
              className="flex items-center gap-2 text-sm font-bold text-white bg-white/15 hover:bg-white/25 px-4 py-2 rounded-xl transition-colors shrink-0"
            >
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Product grid — 3 cols mobile → 6 desktop */}
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
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
