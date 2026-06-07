"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, ArrowRight } from "lucide-react";

type NavCategory = { id: string; name: string; slug: string; children: { id: string; name: string; slug: string }[] };
type NavBrand = { id: string; name: string; logoUrl: string | null };

interface Props {
  categories: NavCategory[];
  brands: NavBrand[];
  onClose: () => void;
}

export function MegaMenu({ categories, brands, onClose }: Props) {
  const [hovered, setHovered] = useState<NavCategory>(categories[0] ?? null);

  if (categories.length === 0) return null;

  return (
    <div className="grid grid-cols-[200px_1fr_160px] divide-x divide-zinc-100 min-h-[320px]">
      {/* Left: All categories */}
      <div className="py-2 overflow-y-auto max-h-[420px]">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onMouseEnter={() => setHovered(cat)}
            className={`w-full flex items-center justify-between px-4 py-2.5 text-sm text-left transition-colors ${
              hovered?.id === cat.id
                ? "bg-brand-50 text-brand-600 font-semibold border-r-2 border-brand-500"
                : "text-zinc-700 hover:bg-zinc-50"
            }`}
          >
            <span>{cat.name}</span>
            {cat.children.length > 0 && <ChevronRight className="h-3.5 w-3.5 text-zinc-400" />}
          </button>
        ))}
        <div className="px-4 pt-2 pb-3 border-t border-zinc-100 mt-1">
          <Link href="/shop/categories" onClick={onClose}
            className="flex items-center gap-1 text-xs text-brand-500 hover:text-brand-600 font-semibold">
            All Categories <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      {/* Center: Subcategories */}
      <div className="p-5">
        {hovered && (
          <>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">{hovered.name}</h3>
              <Link href={`/shop/category/${hovered.slug}`} onClick={onClose}
                className="text-xs text-brand-500 hover:text-brand-600 font-medium flex items-center gap-1">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            {hovered.children.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-1.5">
                {hovered.children.map((sub) => (
                  <Link key={sub.id} href={`/shop/category/${sub.slug}`} onClick={onClose}
                    className="text-sm text-zinc-600 hover:text-brand-500 py-1 flex items-center gap-1.5 group transition-colors">
                    <span className="h-1 w-1 rounded-full bg-zinc-300 group-hover:bg-brand-400 shrink-0 transition-colors" />
                    {sub.name}
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-20">
                <p className="text-sm text-zinc-400">Browse all {hovered.name} →</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Right: Top Brands */}
      <div className="p-4 bg-zinc-50/50">
        <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-3">Top Brands</p>
        <div className="space-y-2">
          {brands.slice(0, 6).map((brand) => (
            <Link key={brand.id} href={`/shop?brand=${brand.id}`} onClick={onClose}
              className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-white hover:shadow-sm text-sm text-zinc-700 hover:text-brand-500 transition-all">
              {brand.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={brand.logoUrl} alt={brand.name} className="h-5 w-5 rounded object-contain" />
              ) : (
                <div className="h-5 w-5 rounded bg-zinc-200 flex items-center justify-center text-[10px] font-bold text-zinc-500">
                  {brand.name[0]}
                </div>
              )}
              {brand.name}
            </Link>
          ))}
        </div>
        {brands.length > 0 && (
          <Link href="/shop?allBrands=1" onClick={onClose}
            className="mt-3 flex items-center gap-1 text-xs text-brand-500 hover:text-brand-600 font-semibold px-2">
            All Brands <ArrowRight className="h-3 w-3" />
          </Link>
        )}
      </div>
    </div>
  );
}
