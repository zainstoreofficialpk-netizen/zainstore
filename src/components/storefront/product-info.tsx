"use client";

import { useRef, useState } from "react";
import {
  ShoppingCart,
  Zap,
  Minus,
  Plus,
  Heart,
  Share2,
  Check,
  Shield,
  Truck,
  RotateCcw,
  Star,
} from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { useCartStore } from "@/lib/store/cart-store";
import { useFlyContext } from "./cart-fly-context";

export type ProductInfoData = {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  shortDescription: string | null;
  price: number;
  salePrice: number | null;
  stock: number;
  lowStockThreshold: number;
  stockStatus: string;
  shippingType: string;
  tags: string[];
  category: { name: string; slug: string } | null;
  brand: { name: string; slug: string } | null;
  rating: number;
  reviewCount: number;
  storeName: string | null;
  storeId: string | null;
  vendorId: string | null;
  imageUrl: string | null;
  weight: number | null;
};

export function ProductInfo({
  product,
  mainImageRef,
}: {
  product: ProductInfoData;
  mainImageRef?: React.RefObject<HTMLDivElement | null>;
}) {
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const [copied, setCopied] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);
  const flyCtx = useFlyContext();

  const discount =
    product.salePrice && product.price > 0
      ? Math.round((1 - product.salePrice / product.price) * 100)
      : 0;
  const displayPrice = product.salePrice ?? product.price;
  const savings = product.salePrice ? product.price - product.salePrice : 0;

  const inStock =
    product.stockStatus === "IN_STOCK" || (product.stock > 0 && product.stockStatus !== "OUT_OF_STOCK");
  const lowStock = inStock && product.stock > 0 && product.stock <= product.lowStockThreshold;

  function handleAddToCart() {
    if (!inStock || added) return;

    for (let i = 0; i < qty; i++) {
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
        weightGrams: product.weight ? Math.round(Number(product.weight)) : 500,
      });
    }

    // Fly from main image if ref provided, else from the button itself
    const src = mainImageRef?.current?.getBoundingClientRect() ?? btnRef.current?.getBoundingClientRect();
    if (src) flyCtx?.triggerFly(src, product.imageUrl ?? "");

    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  function handleBuyNow() {
    if (!inStock) return;
    handleAddToCart();
    setTimeout(() => openCart(), 100);
  }

  function handleShare() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Breadcrumb hints */}
      {(product.category || product.brand) && (
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          {product.category && (
            <span className="bg-zinc-100 rounded-full px-2.5 py-0.5">{product.category.name}</span>
          )}
          {product.brand && (
            <span className="bg-brand-50 text-brand-700 rounded-full px-2.5 py-0.5">{product.brand.name}</span>
          )}
        </div>
      )}

      {/* Title */}
      <h1 className="text-xl md:text-2xl font-black text-zinc-900 leading-tight">
        {product.name}
      </h1>

      {/* Rating row */}
      {product.reviewCount > 0 && (
        <div className="flex items-center gap-2">
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star
                key={i}
                className={`h-4 w-4 ${
                  i <= Math.round(product.rating)
                    ? "fill-yellow-400 text-yellow-400"
                    : "fill-zinc-200 text-zinc-200"
                }`}
              />
            ))}
          </div>
          <span className="text-sm font-semibold text-zinc-700">{product.rating.toFixed(1)}</span>
          <a href="#reviews" className="text-sm text-zinc-400 hover:text-brand-600 transition-colors">
            ({product.reviewCount} {product.reviewCount === 1 ? "review" : "reviews"})
          </a>
        </div>
      )}

      {/* Divider */}
      <div className="h-px bg-zinc-100" />

      {/* Price block */}
      <div>
        <div className="flex items-end gap-3 flex-wrap">
          <span className="text-3xl font-black text-zinc-900">{formatCurrency(displayPrice)}</span>
          {product.salePrice && (
            <span className="text-lg text-zinc-400 line-through">{formatCurrency(product.price)}</span>
          )}
          {discount > 0 && (
            <span className="bg-accent-500 text-white text-xs font-black px-2.5 py-1 rounded-full">
              -{discount}% OFF
            </span>
          )}
        </div>
        {savings > 0 && (
          <p className="text-sm text-green-600 font-medium mt-1">
            You save {formatCurrency(savings)}!
          </p>
        )}
      </div>

      {/* Short description */}
      {product.shortDescription && (
        <p className="text-sm text-zinc-600 leading-relaxed">{product.shortDescription}</p>
      )}

      {/* Stock status */}
      <div className="flex items-center gap-2">
        {inStock ? (
          <>
            <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-sm font-medium text-green-700">
              {lowStock ? `Only ${product.stock} left in stock!` : "In Stock"}
            </span>
          </>
        ) : (
          <>
            <span className="h-2 w-2 rounded-full bg-red-400" />
            <span className="text-sm font-medium text-red-600">Out of Stock</span>
          </>
        )}
      </div>

      {/* Quantity + CTA */}
      <div className="flex flex-col gap-3">
        {/* Qty selector */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-zinc-500 font-medium w-16">Qty:</span>
          <div className="flex items-center border border-zinc-200 rounded-xl overflow-hidden">
            <button
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              disabled={qty <= 1}
              className="w-9 h-9 flex items-center justify-center text-zinc-500 hover:bg-zinc-100 disabled:opacity-30 transition-colors"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="w-10 text-center text-sm font-bold text-zinc-800">{qty}</span>
            <button
              onClick={() => setQty((q) => Math.min(product.stock || 99, q + 1))}
              disabled={qty >= (product.stock || 99)}
              className="w-9 h-9 flex items-center justify-center text-zinc-500 hover:bg-zinc-100 disabled:opacity-30 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-2.5">
          {/* Add to Cart */}
          <button
            ref={btnRef}
            onClick={handleAddToCart}
            disabled={!inStock}
            className={`flex-1 h-12 rounded-xl flex items-center justify-center gap-2 text-sm font-black transition-all duration-200 ${
              added
                ? "bg-green-500 text-white"
                : inStock
                ? "bg-zinc-900 hover:bg-zinc-800 text-white"
                : "bg-zinc-200 text-zinc-400 cursor-not-allowed"
            }`}
          >
            {added ? (
              <><Check className="h-4 w-4" /> Added!</>
            ) : (
              <><ShoppingCart className="h-4 w-4" /> Add to Cart</>
            )}
          </button>

          {/* Buy Now */}
          <button
            onClick={handleBuyNow}
            disabled={!inStock}
            className={`flex-1 h-12 rounded-xl flex items-center justify-center gap-2 text-sm font-black transition-all duration-200 ${
              inStock
                ? "bg-accent-500 hover:bg-accent-600 text-white animate-[buy-now-pulse_3s_ease-in-out_infinite] shadow-lg shadow-accent-200"
                : "bg-zinc-200 text-zinc-400 cursor-not-allowed"
            }`}
          >
            <Zap className="h-4 w-4" />
            Buy Now
          </button>
        </div>

        {/* Wishlist + Share */}
        <div className="flex gap-2">
          <button
            onClick={() => setWishlisted((w) => !w)}
            className={`flex-1 h-10 rounded-xl border flex items-center justify-center gap-2 text-xs font-semibold transition-all duration-200 ${
              wishlisted
                ? "border-red-200 bg-red-50 text-red-500"
                : "border-zinc-200 hover:border-zinc-300 text-zinc-500 hover:text-zinc-700"
            }`}
          >
            <Heart className={`h-3.5 w-3.5 ${wishlisted ? "fill-red-400" : ""}`} />
            {wishlisted ? "Wishlisted" : "Add to Wishlist"}
          </button>
          <button
            onClick={handleShare}
            className="h-10 px-4 rounded-xl border border-zinc-200 flex items-center justify-center gap-2 text-xs font-semibold text-zinc-500 hover:text-zinc-700 hover:border-zinc-300 transition-colors"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Share2 className="h-3.5 w-3.5" />}
            {copied ? "Copied!" : "Share"}
          </button>
        </div>
      </div>

      {/* Trust badges */}
      <div className="grid grid-cols-3 gap-2 mt-1">
        {[
          { icon: Shield, label: "Secure Payment", sub: "100% protected" },
          { icon: Truck, label: "Fast Delivery", sub: "3-5 business days" },
          { icon: RotateCcw, label: "Easy Returns", sub: "7-day policy" },
        ].map(({ icon: Icon, label, sub }) => (
          <div key={label} className="flex flex-col items-center text-center bg-zinc-50 rounded-xl p-2.5 gap-1">
            <Icon className="h-4 w-4 text-brand-500" />
            <p className="text-[10px] font-bold text-zinc-700 leading-tight">{label}</p>
            <p className="text-[9px] text-zinc-400 leading-tight">{sub}</p>
          </div>
        ))}
      </div>

      {/* SKU / Tags */}
      {(product.sku || product.tags.length > 0) && (
        <div className="flex flex-col gap-1.5 text-xs text-zinc-400 pt-1 border-t border-zinc-100">
          {product.sku && (
            <p>SKU: <span className="text-zinc-600 font-mono">{product.sku}</span></p>
          )}
          {product.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              <span>Tags:</span>
              {product.tags.map((t) => (
                <span key={t} className="bg-zinc-100 text-zinc-500 rounded px-1.5 py-0.5 font-medium">
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
