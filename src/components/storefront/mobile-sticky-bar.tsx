"use client";

import { useEffect, useRef, useState } from "react";
import { ShoppingCart, Zap } from "lucide-react";
import { useCartStore } from "@/lib/store/cart-store";
import { useFlyContext } from "./cart-fly-context";
import { formatCurrency } from "@/lib/format";
import { useProductVariant } from "./product-variant-context";

export function MobileStickyBar({
  product,
}: {
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    salePrice: number | null;
    imageUrl: string | null;
    storeName: string | null;
    storeId: string | null;
    vendorId: string | null;
    inStock: boolean;
  };
}) {
  const [visible, setVisible] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);
  const flyCtx = useFlyContext();
  const buyBtnRef = useRef<HTMLButtonElement>(null);
  const { selectedVariant, hasVariants } = useProductVariant();

  const effectivePrice = selectedVariant?.price ?? product.price;
  const effectiveSalePrice = selectedVariant ? selectedVariant.salePrice : product.salePrice;
  const effectiveImage = selectedVariant?.imageUrl ?? product.imageUrl;
  const effectiveInStock =
    product.inStock &&
    (!hasVariants ||
      (!!selectedVariant &&
        (selectedVariant.stockStatus === "IN_STOCK" ||
          (selectedVariant.stock > 0 && selectedVariant.stockStatus !== "OUT_OF_STOCK"))));

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const obs = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { threshold: 0, rootMargin: "0px 0px -80px 0px" }
    );
    obs.observe(sentinel);
    return () => obs.disconnect();
  }, []);

  function handleAddToCart() {
    if (!effectiveInStock) return;
    addItem({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: effectivePrice,
      salePrice: effectiveSalePrice,
      imageUrl: effectiveImage,
      storeName: product.storeName,
      storeId: product.storeId,
      vendorId: product.vendorId,
      weightGrams: 500,
      variantId: selectedVariant?.id ?? null,
      variantName: selectedVariant?.name ?? null,
      sku: selectedVariant?.sku ?? null,
    });
    if (buyBtnRef.current) {
      flyCtx?.triggerFly(buyBtnRef.current.getBoundingClientRect(), effectiveImage ?? "");
    }
  }

  function handleBuyNow() {
    handleAddToCart();
    setTimeout(() => openCart(), 100);
  }

  const displayPrice = effectiveSalePrice ?? effectivePrice;

  return (
    <>
      {/* Sentinel — placed right after the product info section */}
      <div ref={sentinelRef} className="h-px w-full" />

      {/* Sticky bar — mobile only */}
      <div
        className={`fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-zinc-200 px-4 py-3 flex items-center gap-3 z-[200] md:hidden transition-all duration-300 ${
          visible ? "translate-y-0 shadow-2xl" : "translate-y-full"
        }`}
      >
        {/* Price */}
        <div className="flex-1 min-w-0">
          <p className="text-[11px] text-zinc-400 truncate">{product.name}</p>
          <p className="text-base font-black text-zinc-900">{formatCurrency(displayPrice)}</p>
        </div>

        {/* Add to Cart */}
        <button
          onClick={handleAddToCart}
          disabled={!effectiveInStock}
          className="h-11 px-4 rounded-xl bg-zinc-900 text-white text-sm font-black flex items-center gap-1.5 shrink-0 disabled:opacity-40"
        >
          <ShoppingCart className="h-4 w-4" />
          Cart
        </button>

        {/* Buy Now */}
        <button
          ref={buyBtnRef}
          onClick={handleBuyNow}
          disabled={!effectiveInStock}
          className="h-11 px-4 rounded-xl bg-accent-500 hover:bg-accent-600 text-white text-sm font-black flex items-center gap-1.5 shrink-0 disabled:opacity-40 shadow-lg shadow-accent-200"
        >
          <Zap className="h-4 w-4" />
          Buy Now
        </button>
      </div>
    </>
  );
}
