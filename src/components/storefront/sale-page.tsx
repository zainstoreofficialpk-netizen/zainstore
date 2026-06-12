"use client";

import { useState, useEffect, useRef, useCallback, useTransition } from "react";
import Link from "next/link";
import {
  SlidersHorizontal, X, Search, ChevronDown, ChevronRight,
  Star, Heart, ShoppingCart, Zap, Flame, Check,
  Tag, Filter, ArrowRight, TrendingDown, Package,
} from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { useCartStore } from "@/lib/store/cart-store";
import { useFlyContext } from "./cart-fly-context";

// ─── Types ────────────────────────────────────────────────────

export type SaleProduct = {
  id: string; name: string; slug: string;
  price: number; salePrice: number; discount: number;
  imageUrl: string | null;
  storeName: string | null; storeSlug: string | null; storeId: string | null;
  vendorId: string | null;
  categoryName: string | null;
  rating: number; reviewCount: number;
  inStock: boolean; backorder: boolean; featured: boolean;
};

type SaleFilters = {
  search: string;
  categoryId: string;
  storeId: string;
  minPrice: string;
  maxPrice: string;
  minRating: number;
  minDiscount: number;
  inStock: boolean;
  sort: string;
};

type CategoryItem = { id: string; name: string; slug: string; productCount: number };
type StoreItem = { id: string; name: string; slug: string };

export interface SalePageProps {
  initialProducts: SaleProduct[];
  initialTotal: number;
  categories: CategoryItem[];
  stores: StoreItem[];
  priceMin: number;
  priceMax: number;
  initialCategoryId?: string;
  initialStoreId?: string;
}

// ─── Constants ────────────────────────────────────────────────

const DEFAULT_FILTERS: SaleFilters = {
  search: "", categoryId: "", storeId: "",
  minPrice: "", maxPrice: "",
  minRating: 0, minDiscount: 0, inStock: false,
  sort: "highest_discount",
};

const DISCOUNT_OPTIONS = [
  { label: "10%+ Off",  value: 10  },
  { label: "20%+ Off",  value: 20  },
  { label: "30%+ Off",  value: 30  },
  { label: "50%+ Off",  value: 50  },
  { label: "70%+ Off",  value: 70  },
];

const SORT_OPTIONS = [
  { value: "highest_discount", label: "Highest Discount"   },
  { value: "price_asc",        label: "Price: Low to High" },
  { value: "price_desc",       label: "Price: High to Low" },
  { value: "rating",           label: "Highest Rated"      },
  { value: "popular",          label: "Best Selling"       },
  { value: "newest",           label: "Newest Arrivals"    },
];

const PRICE_PRESETS = [
  { label: "Under 1K",   min: "",     max: "1000"  },
  { label: "1K–5K",      min: "1000", max: "5000"  },
  { label: "5K–15K",     min: "5000", max: "15000" },
  { label: "15K+",       min: "15000",max: ""      },
];

// ─── Badge config ─────────────────────────────────────────────

function getBadge(discount: number, featured: boolean) {
  if (featured && discount >= 15) return { label: "FLASH", bg: "bg-gradient-to-r from-orange-500 to-red-500", icon: <Zap className="h-2.5 w-2.5 fill-white" /> };
  if (discount >= 50)             return { label: "HOT DEAL", bg: "bg-gradient-to-r from-red-500 to-pink-600", icon: <Flame className="h-2.5 w-2.5" /> };
  if (discount >= 30)             return { label: "GREAT DEAL", bg: "bg-gradient-to-r from-amber-500 to-orange-500", icon: <Tag className="h-2.5 w-2.5" /> };
  if (discount >= 20)             return { label: "DEAL", bg: "bg-gradient-to-r from-green-500 to-emerald-600", icon: <Tag className="h-2.5 w-2.5" /> };
  return                               { label: "SALE", bg: "bg-gradient-to-r from-brand-500 to-brand-600", icon: <Tag className="h-2.5 w-2.5" /> };
}

// ─── Stars ────────────────────────────────────────────────────

function Stars({ rating, size = "sm" }: { rating: number; size?: "sm" | "xs" }) {
  const cls = size === "xs" ? "h-2.5 w-2.5" : "h-3 w-3";
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={`${cls} ${i <= Math.round(rating) ? "fill-yellow-400 text-yellow-400" : "fill-zinc-200 text-zinc-200"}`} />
      ))}
    </div>
  );
}

// ─── Sale Card ────────────────────────────────────────────────

function SaleCard({ product }: { product: SaleProduct }) {
  const addItem = useCartStore((s) => s.addItem);
  const flyCtx  = useFlyContext();
  const imgRef  = useRef<HTMLDivElement>(null);
  const [added,      setAdded]      = useState(false);
  const [wishlisted, setWishlisted] = useState(false);

  const badge   = getBadge(product.discount, product.featured);
  const savings = product.price - product.salePrice;

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault(); e.stopPropagation();
    if (added) return;
    addItem({
      id: product.id, name: product.name, slug: product.slug,
      price: product.price, salePrice: product.salePrice,
      imageUrl: product.imageUrl, storeName: product.storeName,
      storeId: product.storeId, vendorId: product.vendorId,
      weightGrams: 500,
    });
    if (imgRef.current) {
      const rect = imgRef.current.getBoundingClientRect();
      flyCtx?.triggerFly(rect, product.imageUrl ?? "");
    }
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  function handleWishlist(e: React.MouseEvent) {
    e.preventDefault(); e.stopPropagation();
    setWishlisted((w) => !w);
  }

  return (
    <div className="group relative bg-white rounded-2xl border border-zinc-100 hover:border-brand-200 hover:shadow-xl transition-all duration-200 overflow-hidden flex flex-col">
      {/* Image */}
      <Link href={`/shop/product/${product.slug}`} className="block">
        <div ref={imgRef} className="relative aspect-square bg-zinc-50 overflow-hidden">
          {product.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-100 to-zinc-200">
              <span className="text-3xl font-black text-zinc-300 select-none">{product.name[0]}</span>
            </div>
          )}

          {/* Out of stock overlay */}
          {!product.inStock && !product.backorder && (
            <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
              <span className="text-xs font-bold text-zinc-500 bg-white px-3 py-1.5 rounded-full border border-zinc-200">Out of Stock</span>
            </div>
          )}

          {/* Deal type badge — top left */}
          <div className={`absolute top-2 left-2 flex items-center gap-1 ${badge.bg} text-white text-[9px] font-black px-1.5 py-0.5 rounded-full z-10 shadow`}>
            {badge.icon}
            {badge.label}
          </div>

          {/* Wishlist — top right */}
          <button
            onClick={handleWishlist}
            className={`absolute top-2 right-2 h-7 w-7 rounded-full flex items-center justify-center shadow transition-all duration-200 z-10 ${
              wishlisted
                ? "bg-red-50 text-red-500 opacity-100"
                : "bg-white/90 text-zinc-400 hover:text-red-400 opacity-0 group-hover:opacity-100"
            }`}
            aria-label="Wishlist"
          >
            <Heart className={`h-3.5 w-3.5 ${wishlisted ? "fill-red-400" : ""}`} />
          </button>

          {/* Discount badge — bottom left (large) */}
          <div className="absolute bottom-2 left-2 bg-accent-500 text-white text-xs font-black px-2 py-1 rounded-lg z-10 shadow leading-none">
            -{product.discount}%
          </div>

          {/* Add to cart overlay */}
          <div className="absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-transform duration-200 ease-out z-10">
            <button
              onClick={handleAddToCart}
              className={`w-full py-2.5 flex items-center justify-center gap-2 text-[11px] font-black uppercase tracking-wide transition-colors ${
                added
                  ? "bg-green-500 text-white"
                  : "bg-zinc-900/85 hover:bg-brand-500 text-white backdrop-blur-sm"
              }`}
            >
              {added ? <><Check className="h-3.5 w-3.5" /> Added!</> : <><ShoppingCart className="h-3.5 w-3.5" /> Add to Cart</>}
            </button>
          </div>
        </div>
      </Link>

      {/* Info */}
      <div className="flex flex-col flex-1 p-3 sm:p-3.5 gap-1.5">
        {product.storeName && (
          <Link
            href={product.storeSlug ? `/shop/store/${product.storeSlug}` : "#"}
            onClick={(e) => e.stopPropagation()}
            className="text-[10px] text-brand-500 font-semibold hover:text-brand-600 truncate leading-none"
          >
            {product.storeName}
          </Link>
        )}

        <Link href={`/shop/product/${product.slug}`}>
          <p className="text-[12px] sm:text-[13px] font-semibold text-zinc-800 leading-snug line-clamp-2 hover:text-brand-600 transition-colors">
            {product.name}
          </p>
        </Link>

        {/* Stars */}
        <div className="flex items-center gap-1">
          <Stars rating={product.rating} />
          {product.reviewCount > 0 ? (
            <span className="text-[10px] text-zinc-400">({product.reviewCount})</span>
          ) : (
            <span className="text-[10px] text-zinc-300">No reviews</span>
          )}
        </div>

        {/* Price row */}
        <div className="flex items-baseline gap-1.5 mt-0.5">
          <span className="text-base sm:text-lg font-black text-zinc-900 leading-none">
            {formatCurrency(product.salePrice)}
          </span>
          <span className="text-[11px] text-zinc-400 line-through leading-none">
            {formatCurrency(product.price)}
          </span>
        </div>

        {/* Savings chip */}
        <div className="flex items-center gap-1 bg-green-50 border border-green-100 rounded-lg px-2 py-1">
          <TrendingDown className="h-3 w-3 text-green-600 shrink-0" />
          <span className="text-[10px] font-bold text-green-700">
            Save {formatCurrency(savings)} ({product.discount}% off)
          </span>
        </div>

        {/* Stock / backorder */}
        {product.backorder && (
          <div className="flex items-center gap-1">
            <Package className="h-3 w-3 text-amber-500 shrink-0" />
            <span className="text-[10px] font-semibold text-amber-600">Available on backorder</span>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2 mt-auto pt-1">
          <button
            onClick={handleAddToCart}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[11px] font-bold transition-all ${
              added
                ? "bg-green-500 text-white"
                : "bg-brand-50 hover:bg-brand-500 text-brand-600 hover:text-white"
            }`}
          >
            {added ? <Check className="h-3.5 w-3.5" /> : <ShoppingCart className="h-3.5 w-3.5" />}
            {added ? "Added" : "Cart"}
          </button>
          <Link
            href={`/shop/product/${product.slug}?ref=sale`}
            className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-[11px] font-bold bg-accent-500 hover:bg-accent-600 text-white transition-colors"
          >
            Buy Now
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Sidebar Section (accordion) ─────────────────────────────

function Section({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-zinc-100 pb-4 last:border-0 last:pb-0">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-between w-full py-3 text-sm font-bold text-zinc-800 hover:text-brand-600 transition-colors"
      >
        {title}
        <ChevronDown className={`h-4 w-4 text-zinc-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="space-y-1">{children}</div>}
    </div>
  );
}

// ─── Active Pill ──────────────────────────────────────────────

function ActivePill({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 bg-brand-50 border border-brand-200 text-brand-700 text-[11px] font-semibold px-2.5 py-1 rounded-full">
      {label}
      <button onClick={onRemove} className="hover:text-accent-500 transition-colors ml-0.5">
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}

// ─── Filter Sidebar ───────────────────────────────────────────

function FilterSidebar({
  filters,
  onFiltersChange,
  categories,
  stores,
  priceMin,
  priceMax,
}: {
  filters: SaleFilters;
  onFiltersChange: (f: Partial<SaleFilters>) => void;
  categories: CategoryItem[];
  stores: StoreItem[];
  priceMin: number;
  priceMax: number;
}) {
  const [showMoreStores, setShowMoreStores] = useState(false);
  const visibleStores = showMoreStores ? stores : stores.slice(0, 6);

  return (
    <div className="space-y-0">

      {/* Categories */}
      <Section title="Category">
        <button
          onClick={() => onFiltersChange({ categoryId: "" })}
          className={`w-full flex items-center justify-between text-left px-2 py-1.5 rounded-lg text-sm transition-colors ${
            !filters.categoryId ? "bg-brand-50 text-brand-700 font-semibold" : "text-zinc-600 hover:bg-zinc-50"
          }`}
        >
          <span>All Categories</span>
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => onFiltersChange({ categoryId: c.id === filters.categoryId ? "" : c.id })}
            className={`w-full flex items-center justify-between text-left px-2 py-1.5 rounded-lg text-sm transition-colors ${
              filters.categoryId === c.id ? "bg-brand-50 text-brand-700 font-semibold" : "text-zinc-600 hover:bg-zinc-50"
            }`}
          >
            <span className="truncate">{c.name}</span>
            <span className="text-[10px] text-zinc-400 ml-2 shrink-0">{c.productCount}</span>
          </button>
        ))}
      </Section>

      {/* Discount filter */}
      <Section title="Discount">
        <button
          onClick={() => onFiltersChange({ minDiscount: 0 })}
          className={`w-full flex items-center text-left px-2 py-1.5 rounded-lg text-sm transition-colors ${
            filters.minDiscount === 0 ? "bg-brand-50 text-brand-700 font-semibold" : "text-zinc-600 hover:bg-zinc-50"
          }`}
        >
          Any Discount
        </button>
        {DISCOUNT_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onFiltersChange({ minDiscount: filters.minDiscount === opt.value ? 0 : opt.value })}
            className={`w-full flex items-center justify-between text-left px-2 py-1.5 rounded-lg text-sm transition-colors ${
              filters.minDiscount === opt.value ? "bg-accent-50 text-accent-700 font-semibold border border-accent-200" : "text-zinc-600 hover:bg-zinc-50"
            }`}
          >
            <span>{opt.label}</span>
            {filters.minDiscount === opt.value && <Check className="h-3.5 w-3.5 text-accent-500" />}
          </button>
        ))}
      </Section>

      {/* Price */}
      <Section title="Price Range">
        <div className="flex gap-2 mb-3">
          <div className="flex-1">
            <label className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wide">Min</label>
            <input
              type="number"
              placeholder={String(priceMin)}
              value={filters.minPrice}
              onChange={(e) => onFiltersChange({ minPrice: e.target.value })}
              className="w-full mt-1 px-2.5 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:border-brand-400"
            />
          </div>
          <div className="flex-1">
            <label className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wide">Max</label>
            <input
              type="number"
              placeholder={String(priceMax)}
              value={filters.maxPrice}
              onChange={(e) => onFiltersChange({ maxPrice: e.target.value })}
              className="w-full mt-1 px-2.5 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:border-brand-400"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {PRICE_PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => onFiltersChange({ minPrice: p.min, maxPrice: p.max })}
              className={`text-[11px] font-semibold px-2 py-1.5 rounded-lg border transition-colors ${
                filters.minPrice === p.min && filters.maxPrice === p.max
                  ? "bg-brand-500 text-white border-brand-500"
                  : "border-zinc-200 text-zinc-600 hover:border-brand-300 hover:text-brand-600"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </Section>

      {/* Rating */}
      <Section title="Customer Rating">
        {[5, 4, 3].map((r) => (
          <button
            key={r}
            onClick={() => onFiltersChange({ minRating: filters.minRating === r ? 0 : r })}
            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors ${
              filters.minRating === r ? "bg-brand-50 text-brand-700 font-semibold" : "text-zinc-600 hover:bg-zinc-50"
            }`}
          >
            <Stars rating={r} size="xs" />
            <span className="text-[11px]">{r === 5 ? "5 Stars Only" : `${r} Stars & Up`}</span>
          </button>
        ))}
      </Section>

      {/* Availability */}
      <Section title="Availability" defaultOpen={false}>
        <label className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-zinc-50 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.inStock}
            onChange={(e) => onFiltersChange({ inStock: e.target.checked })}
            className="h-4 w-4 rounded accent-brand-500"
          />
          <span className="text-sm text-zinc-700 font-medium">In Stock Only</span>
        </label>
      </Section>

      {/* Vendor */}
      {stores.length > 0 && (
        <Section title="Store" defaultOpen={false}>
          <button
            onClick={() => onFiltersChange({ storeId: "" })}
            className={`w-full text-left px-2 py-1.5 rounded-lg text-sm transition-colors ${
              !filters.storeId ? "bg-brand-50 text-brand-700 font-semibold" : "text-zinc-600 hover:bg-zinc-50"
            }`}
          >
            All Stores
          </button>
          {visibleStores.map((s) => (
            <button
              key={s.id}
              onClick={() => onFiltersChange({ storeId: s.id === filters.storeId ? "" : s.id })}
              className={`w-full text-left px-2 py-1.5 rounded-lg text-sm truncate transition-colors ${
                filters.storeId === s.id ? "bg-brand-50 text-brand-700 font-semibold" : "text-zinc-600 hover:bg-zinc-50"
              }`}
            >
              {s.name}
            </button>
          ))}
          {stores.length > 6 && (
            <button
              onClick={() => setShowMoreStores((p) => !p)}
              className="flex items-center gap-1 text-[11px] text-brand-500 font-semibold hover:text-brand-600 px-2 py-1"
            >
              {showMoreStores ? "Show less" : `+${stores.length - 6} more stores`}
              <ChevronDown className={`h-3 w-3 transition-transform ${showMoreStores ? "rotate-180" : ""}`} />
            </button>
          )}
        </Section>
      )}
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────

function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="text-center py-20 px-4">
      <div className="h-16 w-16 bg-zinc-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <Tag className="h-8 w-8 text-zinc-300" />
      </div>
      <h3 className="text-lg font-bold text-zinc-800 mb-2">No deals found</h3>
      <p className="text-sm text-zinc-500 mb-5">Try adjusting your filters to find more deals.</p>
      <button
        onClick={onReset}
        className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-bold text-sm rounded-xl transition-colors"
      >
        Clear All Filters
      </button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────

export function SalePage({
  initialProducts,
  initialTotal,
  categories,
  stores,
  priceMin,
  priceMax,
  initialCategoryId = "",
  initialStoreId = "",
}: SalePageProps) {
  const [filters, setFilters] = useState<SaleFilters>({
    ...DEFAULT_FILTERS,
    categoryId: initialCategoryId,
    storeId: initialStoreId,
  });
  const [products,    setProducts]    = useState<SaleProduct[]>(initialProducts);
  const [total,       setTotal]       = useState(initialTotal);
  const [page,        setPage]        = useState(1);
  const [drawerOpen,  setDrawerOpen]  = useState(false);
  const [sortOpen,    setSortOpen]    = useState(false);
  const [isPending,   setIsPending]   = useState(false);
  const [, startTransition] = useTransition();
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sortRef = useRef<HTMLDivElement>(null);

  // Close sort dropdown on outside click
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setSortOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  // Lock body scroll when drawer open
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen]);

  const buildParams = useCallback((f: SaleFilters, pg: number) => {
    const p = new URLSearchParams();
    p.set("page",  String(pg));
    p.set("limit", "24");
    p.set("sort",  f.sort);
    if (f.search)       p.set("search",      f.search);
    if (f.categoryId)   p.set("category",    f.categoryId);
    if (f.storeId)      p.set("store",       f.storeId);
    if (f.minPrice)     p.set("minPrice",    f.minPrice);
    if (f.maxPrice)     p.set("maxPrice",    f.maxPrice);
    if (f.minRating)    p.set("rating",      String(f.minRating));
    if (f.minDiscount)  p.set("minDiscount", String(f.minDiscount));
    if (f.inStock)      p.set("inStock",     "1");
    return p;
  }, []);

  const applyFilters = useCallback(async (f: SaleFilters) => {
    setIsPending(true);
    try {
      const res = await fetch(`/api/storefront/sale?${buildParams(f, 1)}`, { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json() as { products: SaleProduct[]; total: number };
      setProducts(data.products);
      setTotal(data.total);
      setPage(1);
    } finally {
      setIsPending(false);
    }
  }, [buildParams]);

  function handleFiltersChange(patch: Partial<SaleFilters>) {
    const next = { ...filters, ...patch };

    // Debounce only search field
    if ("search" in patch) {
      setFilters(next);
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
      searchTimeout.current = setTimeout(() => applyFilters(next), 350);
      return;
    }

    // Price inputs: wait for user to stop typing
    if ("minPrice" in patch || "maxPrice" in patch) {
      setFilters(next);
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
      searchTimeout.current = setTimeout(() => applyFilters(next), 600);
      return;
    }

    setFilters(next);
    applyFilters(next);
  }

  async function loadMore() {
    setIsLoadingMore(true);
    const nextPage = page + 1;
    const res = await fetch(`/api/storefront/sale?${buildParams(filters, nextPage)}`);
    if (res.ok) {
      const data = await res.json() as { products: SaleProduct[] };
      setProducts((p) => [...p, ...data.products]);
      setPage(nextPage);
    }
    setIsLoadingMore(false);
  }

  function resetFilters() {
    setFilters(DEFAULT_FILTERS);
    applyFilters(DEFAULT_FILTERS);
  }

  // Active pills
  const pills: { label: string; onRemove: () => void }[] = [];
  if (filters.categoryId) {
    const cat = categories.find((c) => c.id === filters.categoryId);
    if (cat) pills.push({ label: cat.name, onRemove: () => handleFiltersChange({ categoryId: "" }) });
  }
  if (filters.storeId) {
    const store = stores.find((s) => s.id === filters.storeId);
    if (store) pills.push({ label: store.name, onRemove: () => handleFiltersChange({ storeId: "" }) });
  }
  if (filters.minDiscount > 0) pills.push({ label: `${filters.minDiscount}%+ Off`, onRemove: () => handleFiltersChange({ minDiscount: 0 }) });
  if (filters.minRating > 0)   pills.push({ label: `${filters.minRating}★ & Up`, onRemove: () => handleFiltersChange({ minRating: 0 }) });
  if (filters.minPrice)        pills.push({ label: `From ${formatCurrency(Number(filters.minPrice))}`, onRemove: () => handleFiltersChange({ minPrice: "" }) });
  if (filters.maxPrice)        pills.push({ label: `Up to ${formatCurrency(Number(filters.maxPrice))}`, onRemove: () => handleFiltersChange({ maxPrice: "" }) });
  if (filters.inStock)         pills.push({ label: "In Stock", onRemove: () => handleFiltersChange({ inStock: false }) });

  const currentSortLabel = SORT_OPTIONS.find((o) => o.value === filters.sort)?.label ?? "Sort";
  const hasMore = products.length < total;

  return (
    <div className="min-h-screen bg-zinc-50">

      {/* ── Mobile filter drawer ─────────────────────────── */}
      <div
        onClick={() => setDrawerOpen(false)}
        className={`fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300 ${drawerOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      />
      <aside className={`fixed top-0 left-0 h-full w-80 max-w-[85vw] bg-white z-50 flex flex-col shadow-2xl transition-transform duration-300 lg:hidden ${drawerOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
          <h2 className="font-black text-zinc-900">Filter Deals</h2>
          <button onClick={() => setDrawerOpen(false)} className="p-1.5 rounded-lg hover:bg-zinc-100 transition-colors">
            <X className="h-5 w-5 text-zinc-500" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          <FilterSidebar filters={filters} onFiltersChange={handleFiltersChange} categories={categories} stores={stores} priceMin={priceMin} priceMax={priceMax} />
        </div>
        <div className="p-4 border-t border-zinc-100 flex gap-3">
          <button onClick={resetFilters} className="flex-1 py-2.5 border border-zinc-200 rounded-xl text-sm font-semibold text-zinc-600 hover:bg-zinc-50">Clear All</button>
          <button onClick={() => setDrawerOpen(false)} className="flex-1 py-2.5 bg-brand-500 hover:bg-brand-600 rounded-xl text-sm font-bold text-white transition-colors">Apply</button>
        </div>
      </aside>

      {/* ── Container ──────────────────────────────────────── */}
      <div className="container mx-auto px-4 max-w-7xl py-6">
        <div className="flex gap-6">

          {/* ── Desktop sidebar ────────────────────────────── */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="bg-white rounded-2xl border border-zinc-100 p-5 sticky top-4 max-h-[calc(100vh-2rem)] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-black text-zinc-900 text-sm">Filter Deals</h2>
                {pills.length > 0 && (
                  <button onClick={resetFilters} className="text-[11px] text-accent-500 hover:text-accent-600 font-semibold">
                    Clear all
                  </button>
                )}
              </div>
              <FilterSidebar filters={filters} onFiltersChange={handleFiltersChange} categories={categories} stores={stores} priceMin={priceMin} priceMax={priceMax} />
            </div>
          </aside>

          {/* ── Main area ──────────────────────────────────── */}
          <div className="flex-1 min-w-0">

            {/* Toolbar */}
            <div className="bg-white rounded-2xl border border-zinc-100 px-4 py-3 mb-4">
              <div className="flex items-center gap-3 flex-wrap">

                {/* Mobile filter button */}
                <button
                  onClick={() => setDrawerOpen(true)}
                  className="lg:hidden flex items-center gap-2 px-3 py-2 bg-zinc-50 hover:bg-brand-50 border border-zinc-200 hover:border-brand-300 rounded-xl text-sm font-semibold text-zinc-700 hover:text-brand-600 transition-colors shrink-0"
                >
                  <Filter className="h-4 w-4" />
                  Filters
                  {pills.length > 0 && (
                    <span className="h-5 w-5 bg-accent-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{pills.length}</span>
                  )}
                </button>

                {/* Search */}
                <div className="flex-1 min-w-[180px] relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  <input
                    type="text"
                    placeholder="Search sale products…"
                    value={filters.search}
                    onChange={(e) => handleFiltersChange({ search: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:border-brand-400 bg-zinc-50"
                  />
                  {filters.search && (
                    <button onClick={() => handleFiltersChange({ search: "" })} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* Sort */}
                <div ref={sortRef} className="relative shrink-0">
                  <button
                    onClick={() => setSortOpen((o) => !o)}
                    className="flex items-center gap-2 px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-semibold text-zinc-700 hover:border-brand-300 hover:text-brand-600 transition-colors"
                  >
                    <SlidersHorizontal className="h-4 w-4" />
                    <span className="hidden sm:inline">{currentSortLabel}</span>
                    <ChevronDown className={`h-3.5 w-3.5 transition-transform ${sortOpen ? "rotate-180" : ""}`} />
                  </button>
                  {sortOpen && (
                    <div className="absolute right-0 top-full mt-1 w-52 bg-white border border-zinc-100 rounded-xl shadow-xl z-20 overflow-hidden py-1">
                      {SORT_OPTIONS.map((o) => (
                        <button
                          key={o.value}
                          onClick={() => { setSortOpen(false); handleFiltersChange({ sort: o.value }); }}
                          className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between ${
                            filters.sort === o.value ? "bg-brand-50 text-brand-700 font-semibold" : "text-zinc-700 hover:bg-zinc-50"
                          }`}
                        >
                          {o.label}
                          {filters.sort === o.value && <Check className="h-3.5 w-3.5 text-brand-500" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Count */}
                <div className="shrink-0 text-sm text-zinc-500 hidden sm:block">
                  <span className="font-bold text-zinc-800">{total.toLocaleString()}</span> deals
                </div>
              </div>

              {/* Active pills */}
              {pills.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-zinc-50">
                  {pills.map((pill) => <ActivePill key={pill.label} label={pill.label} onRemove={pill.onRemove} />)}
                  <button onClick={resetFilters} className="text-[11px] text-zinc-400 hover:text-accent-500 font-semibold px-1.5 transition-colors">
                    Clear all ×
                  </button>
                </div>
              )}
            </div>

            {/* Loading overlay */}
            {isPending && (
              <div className="flex items-center justify-center py-16">
                <div className="h-8 w-8 border-2 border-accent-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {/* Grid */}
            {!isPending && products.length === 0 ? (
              <div className="bg-white rounded-2xl border border-zinc-100">
                <EmptyState onReset={resetFilters} />
              </div>
            ) : !isPending && (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                  {products.map((p) => <SaleCard key={p.id} product={p} />)}
                </div>

                {/* Load more */}
                {hasMore && (
                  <div className="mt-8 text-center">
                    <button
                      onClick={loadMore}
                      disabled={isLoadingMore}
                      className="inline-flex items-center gap-2 px-8 py-3 bg-white hover:bg-zinc-50 border border-zinc-200 hover:border-brand-300 text-sm font-bold text-zinc-700 hover:text-brand-600 rounded-2xl transition-all disabled:opacity-60"
                    >
                      {isLoadingMore ? (
                        <><div className="h-4 w-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /> Loading...</>
                      ) : (
                        <>Load More Deals <ArrowRight className="h-4 w-4" /></>
                      )}
                    </button>
                    <p className="text-[11px] text-zinc-400 mt-2">Showing {products.length} of {total} deals</p>
                  </div>
                )}

                {/* End of results */}
                {!hasMore && products.length > 0 && (
                  <p className="text-center text-[11px] text-zinc-400 mt-8">
                    All {total} deals shown — <Link href="/shop/browse" className="text-brand-500 hover:text-brand-600 font-semibold">Browse all products</Link>
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
