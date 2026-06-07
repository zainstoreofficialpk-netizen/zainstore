"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProductCard, type ProductCardData } from "./product-card";

type Tab = "new" | "best" | "featured" | "rated";

const TABS: { key: Tab; label: string; viewMoreLabel: string; href: string }[] = [
  { key: "new", label: "New Arrivals", viewMoreLabel: "View All New Arrivals", href: "/shop?sort=newest" },
  { key: "best", label: "Best Sellers", viewMoreLabel: "View All Best Sellers", href: "/shop?sort=popular" },
  { key: "featured", label: "Featured", viewMoreLabel: "View All Featured", href: "/shop?featured=true" },
  { key: "rated", label: "Top Rated", viewMoreLabel: "View All Top Rated", href: "/shop?sort=rating" },
];

export function ProductTabs({
  newArrivals,
  bestSellers,
  featured,
  topRated,
}: {
  newArrivals: ProductCardData[];
  bestSellers: ProductCardData[];
  featured: ProductCardData[];
  topRated: ProductCardData[];
}) {
  const [active, setActive] = useState<Tab>("new");

  const data: Record<Tab, ProductCardData[]> = {
    new: newArrivals,
    best: bestSellers,
    featured,
    rated: topRated,
  };

  const activeTab = TABS.find((t) => t.key === active)!;
  const current = data[active];

  return (
    <section className="bg-white border-t border-b border-zinc-100">
      <div className="container mx-auto px-4 max-w-7xl py-8">
        {/* Header + Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-xl overflow-x-auto w-fit">
            {TABS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActive(key)}
                className={`shrink-0 px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                  active === key
                    ? "bg-white text-zinc-900 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-700"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <Link
            href={activeTab.href}
            className="flex items-center gap-1.5 text-sm font-semibold text-brand-500 hover:text-brand-600 whitespace-nowrap self-end sm:self-auto transition-colors"
          >
            {activeTab.viewMoreLabel} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Product grid */}
        {current.length === 0 ? (
          <div className="text-center py-16 bg-zinc-50 rounded-2xl">
            <p className="text-sm text-zinc-400 font-medium">No products available yet</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {current.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {/* View More footer */}
            <div className="mt-8 text-center">
              <Link
                href={activeTab.href}
                className="inline-flex items-center gap-2 px-8 py-3 border-2 border-zinc-200 hover:border-brand-400 text-sm font-bold text-zinc-700 hover:text-brand-600 rounded-xl transition-all"
              >
                {activeTab.viewMoreLabel} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
