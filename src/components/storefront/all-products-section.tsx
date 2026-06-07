"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { ProductCard, type ProductCardData } from "./product-card";

export function AllProductsSection({
  initialProducts,
  total,
}: {
  initialProducts: ProductCardData[];
  total: number;
}) {
  const [products, setProducts] = useState<ProductCardData[]>(initialProducts);
  const [page, setPage] = useState(1);
  const [isPending, startTransition] = useTransition();

  const hasMore = products.length < total;

  function loadMore() {
    startTransition(async () => {
      const next = page + 1;
      const res = await fetch(`/api/storefront/products?page=${next}&limit=40`);
      if (!res.ok) return;
      const data: { products: ProductCardData[]; total: number } = await res.json();
      setProducts((prev) => {
        // Deduplicate by id
        const ids = new Set(prev.map((p) => p.id));
        return [...prev, ...data.products.filter((p) => !ids.has(p.id))];
      });
      setPage(next);
    });
  }

  return (
    <section className="bg-white border-t border-zinc-100">
      <div className="container mx-auto px-4 max-w-7xl py-8">
        {/* Section header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-0.5">
              Explore
            </p>
            <h2 className="text-2xl font-black text-zinc-900">All Products</h2>
          </div>
          <span className="text-sm text-zinc-400 font-medium">{total} products</span>
        </div>

        {/* Grid — 2 cols mobile → 5 desktop → 6 xl */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {/* Load More */}
        {hasMore && (
          <div className="mt-10 text-center">
            <button
              onClick={loadMore}
              disabled={isPending}
              className="inline-flex items-center gap-3 px-10 py-3.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white font-bold text-sm rounded-xl shadow-sm transition-all"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading…
                </>
              ) : (
                `Load More Products (${total - products.length} remaining)`
              )}
            </button>
          </div>
        )}

        {!hasMore && products.length > 0 && (
          <p className="mt-8 text-center text-sm text-zinc-400">
            All {total} products loaded
          </p>
        )}
      </div>
    </section>
  );
}
