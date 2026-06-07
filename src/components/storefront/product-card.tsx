"use client";

import Link from "next/link";
import { Heart, Star } from "lucide-react";
import { formatCurrency } from "@/lib/format";

export type ProductCardData = {
  id: string;
  name: string;
  slug: string;
  price: number;
  salePrice: number | null;
  imageUrl: string | null;
  storeName: string | null;
  storeSlug: string | null;
  rating: number;
  reviewCount: number;
};

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-3 w-3 ${
            i <= Math.round(rating)
              ? "fill-yellow-400 text-yellow-400"
              : "fill-zinc-200 text-zinc-200"
          }`}
        />
      ))}
    </div>
  );
}

export function ProductCard({
  product,
  compact = false,
}: {
  product: ProductCardData;
  compact?: boolean;
}) {
  const discount =
    product.salePrice && product.price > 0
      ? Math.round((1 - product.salePrice / product.price) * 100)
      : 0;
  const displayPrice = product.salePrice ?? product.price;

  return (
    <Link
      href={`/shop/product/${product.slug}`}
      className="group block bg-white rounded-2xl border border-zinc-100 hover:border-brand-200 hover:shadow-lg transition-all duration-200 overflow-hidden"
    >
      {/* Image */}
      <div className="relative aspect-square bg-zinc-50 overflow-hidden">
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-100 to-zinc-200">
            <span className="text-3xl font-black text-zinc-300 select-none">
              {product.name[0]}
            </span>
          </div>
        )}
        {discount > 0 && (
          <span className="absolute top-2 left-2 bg-accent-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
            -{discount}%
          </span>
        )}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          className="absolute top-2 right-2 h-7 w-7 bg-white/90 rounded-full flex items-center justify-center text-zinc-400 hover:text-red-400 shadow-sm opacity-0 group-hover:opacity-100 transition-all"
          aria-label="Add to wishlist"
        >
          <Heart className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Info */}
      <div className={compact ? "p-3" : "p-4"}>
        {product.storeName && (
          <p className="text-[10px] text-zinc-400 font-medium mb-0.5 truncate">
            {product.storeName}
          </p>
        )}
        <p className="text-sm font-semibold text-zinc-800 leading-snug line-clamp-2 mb-1.5">
          {product.name}
        </p>
        <div className="flex items-center gap-1.5">
          <Stars rating={product.rating} />
          {product.reviewCount > 0 && (
            <span className="text-[10px] text-zinc-400">({product.reviewCount})</span>
          )}
        </div>
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="font-black text-zinc-900" style={{ fontSize: compact ? "0.9rem" : "1rem" }}>
            {formatCurrency(displayPrice)}
          </span>
          {product.salePrice && (
            <span className="text-xs text-zinc-400 line-through">
              {formatCurrency(product.price)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
