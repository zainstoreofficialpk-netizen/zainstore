"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Heart, Trash2, ExternalLink, ShoppingBag,
  AlertTriangle, CheckCircle2, Tag,
} from "lucide-react";

import {
  removeFromWishlistAction,
  clearWishlistAction,
} from "@/lib/customer/wishlist-actions";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// ── Types ─────────────────────────────────────────────────────────────────────

type WishlistItem = {
  id: string;
  createdAt: Date;
  product: {
    id: string;
    name: string;
    slug: string;
    price: string | number;
    salePrice: string | number | null;
    status: string;
    stockStatus: string;
    stock: number;
    images: { url: string; alt: string | null }[];
    vendor: { id: string; store: { name: string } | null } | null;
    category: { name: string } | null;
  };
};

// ── Stock badge ───────────────────────────────────────────────────────────────

function StockBadge({ stockStatus, stock }: { stockStatus: string; stock: number }) {
  if (stockStatus === "OUT_OF_STOCK" || stock === 0) {
    return <Badge tone="danger" className="text-[10px]">Out of Stock</Badge>;
  }
  if (stockStatus === "BACKORDER") {
    return <Badge tone="warning" className="text-[10px]">Pre-order</Badge>;
  }
  if (stock <= 5) {
    return <Badge tone="warning" className="text-[10px]">Only {stock} left</Badge>;
  }
  return <Badge tone="success" className="text-[10px]">In Stock</Badge>;
}

// ── Single wishlist card ──────────────────────────────────────────────────────

function WishlistCard({
  item,
  onRemoved,
}: {
  item: WishlistItem;
  onRemoved: (productId: string) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const { product } = item;

  const price = Number(product.price);
  const salePrice = product.salePrice ? Number(product.salePrice) : null;
  const displayPrice = salePrice ?? price;
  const isDiscounted = salePrice !== null && salePrice < price;
  const isUnavailable = product.status !== "ACTIVE" || product.stockStatus === "OUT_OF_STOCK" || product.stock === 0;

  function handleRemove() {
    startTransition(async () => {
      const r = await removeFromWishlistAction(product.id);
      if (r.success) {
        toast.success(r.message);
        onRemoved(product.id);
      } else {
        toast.error(r.error);
      }
    });
  }

  return (
    <Card className={`overflow-hidden transition-shadow hover:shadow-md ${isUnavailable ? "opacity-70" : ""}`}>
      <CardContent className="p-0">
        <div className="flex gap-0 sm:gap-4">
          {/* Product image */}
          <div className="relative shrink-0">
            {product.images[0]?.url ? (
              <img
                src={product.images[0].url}
                alt={product.images[0].alt ?? product.name}
                className="h-32 w-28 object-cover sm:h-36 sm:w-32 rounded-l-md"
              />
            ) : (
              <div className="flex h-32 w-28 items-center justify-center rounded-l-md bg-zinc-100 sm:h-36 sm:w-32">
                <ShoppingBag size={28} className="text-zinc-300" />
              </div>
            )}
            {isUnavailable && (
              <div className="absolute inset-0 flex items-center justify-center rounded-l-md bg-black/30">
                <span className="rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-zinc-700">
                  Unavailable
                </span>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex flex-1 flex-col gap-1.5 p-4 min-w-0">
            {/* Category + vendor */}
            <div className="flex flex-wrap items-center gap-1.5">
              {product.category && (
                <span className="flex items-center gap-1 text-[10px] text-zinc-400">
                  <Tag size={9} /> {product.category.name}
                </span>
              )}
              {product.vendor?.store && (
                <span className="text-[10px] text-zinc-400">· {product.vendor.store.name}</span>
              )}
            </div>

            {/* Name */}
            <p className="text-sm font-semibold text-zinc-900 leading-tight line-clamp-2">
              {product.name}
            </p>

            {/* Price */}
            <div className="flex items-baseline gap-2">
              <span className="text-base font-bold text-zinc-950">{formatCurrency(displayPrice)}</span>
              {isDiscounted && (
                <span className="text-xs text-zinc-400 line-through">{formatCurrency(price)}</span>
              )}
              {isDiscounted && (
                <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                  {Math.round(((price - displayPrice) / price) * 100)}% off
                </span>
              )}
            </div>

            {/* Stock + date */}
            <div className="flex flex-wrap items-center gap-2">
              <StockBadge stockStatus={product.stockStatus} stock={product.stock} />
              <span className="text-[10px] text-zinc-300">
                Saved {new Date(item.createdAt).toLocaleDateString("en-PK", {
                  day: "numeric", month: "short", year: "numeric",
                })}
              </span>
            </div>

            {/* Actions */}
            <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
              <button
                onClick={handleRemove}
                disabled={isPending}
                className="flex items-center gap-1.5 rounded-md border border-zinc-200 px-3 py-1.5 text-xs text-zinc-500 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40 transition-colors"
              >
                <Heart size={12} className="fill-rose-400 stroke-rose-400" />
                {isPending ? "Removing…" : "Remove"}
              </button>

              {!isUnavailable && (
                <span className="flex items-center gap-1 text-[10px] text-emerald-600">
                  <CheckCircle2 size={11} /> Ready to order
                </span>
              )}
              {isUnavailable && (
                <span className="flex items-center gap-1 text-[10px] text-amber-600">
                  <AlertTriangle size={11} /> Currently unavailable
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function WishlistEmpty() {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-zinc-200 py-24 text-center">
      <div className="grid size-16 place-items-center rounded-full bg-rose-50">
        <Heart size={28} className="fill-rose-300 stroke-rose-300" />
      </div>
      <div>
        <p className="text-base font-semibold text-zinc-700">Your wishlist is empty</p>
        <p className="mt-1 text-sm text-zinc-400">
          Save products you love — we'll keep track of them here.
        </p>
      </div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export function WishlistView({ items: initial }: { items: WishlistItem[] }) {
  const [items, setItems] = useState(initial);
  const [isPending, startTransition] = useTransition();

  function onRemoved(productId: string) {
    setItems((prev) => prev.filter((i) => i.product.id !== productId));
  }

  function handleClear() {
    if (!confirm("Remove all products from your wishlist?")) return;
    startTransition(async () => {
      const r = await clearWishlistAction();
      if (r.success) {
        setItems([]);
        toast.success(r.message);
      } else {
        toast.error(r.error);
      }
    });
  }

  const inStockCount = items.filter(
    (i) => i.product.status === "ACTIVE" && i.product.stockStatus !== "OUT_OF_STOCK" && i.product.stock > 0,
  ).length;

  return (
    <div className="space-y-5">
      {/* Header controls */}
      {items.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-sm text-zinc-500">
            <span className="flex items-center gap-1.5">
              <Heart size={14} className="fill-rose-400 stroke-rose-400" />
              <span className="font-semibold text-zinc-900">{items.length}</span>{" "}
              saved product{items.length !== 1 ? "s" : ""}
            </span>
            {inStockCount > 0 && (
              <span className="flex items-center gap-1 text-[11px] text-emerald-600">
                <CheckCircle2 size={11} /> {inStockCount} in stock
              </span>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            disabled={isPending}
            className="gap-1.5 text-rose-500 hover:bg-rose-50 hover:text-rose-600"
          >
            <Trash2 size={13} />
            Clear all
          </Button>
        </div>
      )}

      {/* List */}
      {items.length === 0 ? (
        <WishlistEmpty />
      ) : (
        <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
          {items.map((item) => (
            <WishlistCard key={item.id} item={item} onRemoved={onRemoved} />
          ))}
        </div>
      )}
    </div>
  );
}
