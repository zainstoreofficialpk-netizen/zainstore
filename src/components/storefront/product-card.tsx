"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Heart, Star, ShoppingCart, Check } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { useCartStore } from "@/lib/store/cart-store";
import { useFlyContext } from "./cart-fly-context";

// ─── Types ────────────────────────────────────────────────────

export type ProductCardData = {
  id: string;
  name: string;
  slug: string;
  price: number;
  salePrice: number | null;
  imageUrl: string | null;
  storeName: string | null;
  storeSlug: string | null;
  storeId: string | null;
  vendorId: string | null;
  rating: number;
  reviewCount: number;
};

// ─── Stars ────────────────────────────────────────────────────

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

// ─── Card ─────────────────────────────────────────────────────

export function ProductCard({
  product,
  compact = false,
}: {
  product: ProductCardData;
  compact?: boolean;
}) {
  const addItem = useCartStore((s) => s.addItem);
  const flyCtx = useFlyContext();
  const imgRef = useRef<HTMLDivElement>(null);
  const [added, setAdded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const discount =
    product.salePrice && product.price > 0
      ? Math.round((1 - product.salePrice / product.price) * 100)
      : 0;
  const displayPrice = product.salePrice ?? product.price;

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (added) return; // debounce rapid clicks

    // Add to Zustand store
    addItem({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      salePrice: product.salePrice,
      imageUrl: product.imageUrl,
      storeName: product.storeName,
      storeId: product.storeId,
      vendorId: product.vendorId,
      weightGrams: 500,
    });

    // Trigger fly animation from the image container
    if (imgRef.current) {
      const rect = imgRef.current.getBoundingClientRect();
      flyCtx?.triggerFly(rect, product.imageUrl ?? "");
    }

    // Brief "Added!" feedback
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <Link
      href={`/shop/product/${product.slug}`}
      className="group block bg-white rounded-2xl border border-zinc-100 hover:border-brand-200 hover:shadow-xl transition-all duration-200 overflow-hidden"
    >
      {/* ── Image ─────────────────────────────────────── */}
      <div ref={imgRef} className="relative aspect-square bg-zinc-50 overflow-hidden">
        {product.imageUrl && !imgError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-100 to-zinc-200">
            <span className="text-3xl font-black text-zinc-300 select-none">
              {product.name[0]}
            </span>
          </div>
        )}

        {/* Sale badge */}
        {discount > 0 && (
          <span className="absolute top-2 left-2 bg-accent-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded z-10 shadow-sm">
            -{discount}%
          </span>
        )}

        {/* Wishlist */}
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
          className="absolute top-2 right-2 h-7 w-7 bg-white/90 rounded-full flex items-center justify-center text-zinc-400 hover:text-red-400 shadow-sm opacity-0 group-hover:opacity-100 transition-all duration-150 z-10"
          aria-label="Add to wishlist"
        >
          <Heart className="h-3.5 w-3.5" />
        </button>

        {/* Add to Cart — always visible on mobile, slides up on desktop hover */}
        <div className="absolute bottom-0 left-0 right-0 translate-y-0 sm:translate-y-full sm:group-hover:translate-y-0 transition-transform duration-200 ease-out z-10">
          <button
            onClick={handleAddToCart}
            className={`w-full py-2 sm:py-2.5 flex items-center justify-center gap-1.5 sm:gap-2 text-[10px] sm:text-[11px] font-black uppercase tracking-wide transition-colors duration-150 ${
              added
                ? "bg-green-500 text-white"
                : "bg-zinc-900/80 hover:bg-brand-500 text-white backdrop-blur-sm"
            }`}
          >
            {added ? (
              <>
                <Check className="h-3.5 w-3.5 shrink-0" />
                Added to Cart!
              </>
            ) : (
              <>
                <ShoppingCart className="h-3.5 w-3.5 shrink-0" />
                Add to Cart
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Info ──────────────────────────────────────── */}
      <div className={compact ? "p-2 sm:p-3" : "p-3 sm:p-3.5"}>
        {product.storeName && !compact && (
          <p className="text-[10px] text-zinc-400 font-medium mb-0.5 truncate">
            {product.storeName}
          </p>
        )}
        <p className={`font-semibold text-zinc-800 leading-snug line-clamp-2 mb-1 ${compact ? "text-[11px] sm:text-[12px]" : "text-[12px] sm:text-[13px]"}`}>
          {product.name}
        </p>

        {!compact && (
          <div className="flex items-center gap-1 mb-1.5">
            <Stars rating={product.rating} />
            {product.reviewCount > 0 && (
              <span className="text-[10px] text-zinc-400">({product.reviewCount})</span>
            )}
          </div>
        )}

        {/* Price row + quick-add button */}
        <div className="flex items-center justify-between gap-1">
          <div className="flex flex-col min-w-0">
            <span className={`font-black text-zinc-900 leading-tight ${compact ? "text-[12px] sm:text-[13px]" : "text-[13px] sm:text-[15px]"}`}>
              {formatCurrency(displayPrice)}
            </span>
            {product.salePrice && (
              <span className="text-[9px] sm:text-[10px] text-zinc-400 line-through truncate">
                {formatCurrency(product.price)}
              </span>
            )}
          </div>

          {/* Always-visible quick-add circle button */}
          <button
            onClick={handleAddToCart}
            aria-label="Add to cart"
            className={`shrink-0 rounded-full flex items-center justify-center transition-all duration-200 shadow-sm active:scale-95 ${
              compact ? "h-7 w-7" : "h-8 w-8"
            } ${
              added
                ? "bg-green-500 text-white scale-110"
                : "bg-brand-50 hover:bg-brand-500 text-brand-500 hover:text-white hover:scale-110"
            }`}
          >
            {added ? (
              <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            ) : (
              <ShoppingCart className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            )}
          </button>
        </div>
      </div>
    </Link>
  );
}
