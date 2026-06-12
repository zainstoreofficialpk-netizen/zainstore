"use client";

import { useState, useTransition, useCallback, useEffect } from "react";
import Link from "next/link";
import {
  Search, Star, Package, ShoppingBag, MessageCircle, ChevronDown,
  Grid3X3, List, SlidersHorizontal, X, ChevronRight, Loader2,
  MapPin, Phone, Mail, Calendar, Shield, ArrowUpDown, Tag,
  ThumbsUp, Store, ChevronLeft,
} from "lucide-react";
import { ProductCard, type ProductCardData } from "./product-card";
import { formatCurrency } from "@/lib/format";
import type { StoreDetail, StoreProduct, StoreReview } from "@/lib/storefront/store-data";

// ─── Types ────────────────────────────────────────────────────

type StoreCategory = { id: string; name: string; slug: string; count: number };

// ─── Stars ────────────────────────────────────────────────────

function Stars({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
  const cls = size === "md" ? "h-4 w-4" : "h-3 w-3";
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`${cls} ${i <= Math.round(rating) ? "fill-yellow-400 text-yellow-400" : "fill-zinc-200 text-zinc-200"}`}
        />
      ))}
    </div>
  );
}

// ─── Review Card ──────────────────────────────────────────────

function ReviewCard({ review }: { review: StoreReview }) {
  return (
    <div className="bg-white rounded-2xl border border-zinc-100 p-5">
      <div className="flex items-start gap-3 mb-3">
        <div className="h-9 w-9 rounded-full bg-zinc-100 flex items-center justify-center shrink-0 overflow-hidden">
          {review.user.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={review.user.image} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-sm font-black text-zinc-400">
              {(review.user.name ?? "?")[0].toUpperCase()}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <p className="text-sm font-bold text-zinc-900 truncate">{review.user.name ?? "Anonymous"}</p>
            <time className="text-xs text-zinc-400 shrink-0">
              {new Date(review.createdAt).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}
            </time>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <Stars rating={review.rating} />
            {review.verifiedPurchase && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-green-600">
                <Shield className="h-3 w-3" /> Verified Buyer
              </span>
            )}
          </div>
        </div>
      </div>

      {review.title && <p className="font-bold text-zinc-800 text-sm mb-1">{review.title}</p>}
      {review.comment && <p className="text-sm text-zinc-600 leading-relaxed">{review.comment}</p>}

      {review.images.length > 0 && (
        <div className="flex gap-2 mt-3 flex-wrap">
          {review.images.map((img, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={img.url} alt="" className="h-16 w-16 object-cover rounded-lg border border-zinc-100" />
          ))}
        </div>
      )}

      {review.vendorReply && (
        <div className="mt-3 bg-brand-50 border border-brand-100 rounded-xl p-3.5">
          <p className="text-xs font-black text-brand-700 mb-1">Vendor Reply</p>
          <p className="text-xs text-brand-600 leading-relaxed">{review.vendorReply}</p>
        </div>
      )}

      {review.helpfulCount > 0 && (
        <div className="mt-3 flex items-center gap-1.5 text-xs text-zinc-400">
          <ThumbsUp className="h-3 w-3" /> {review.helpfulCount} found this helpful
        </div>
      )}
    </div>
  );
}

// ─── Reviews Tab ──────────────────────────────────────────────

function ReviewsTab({
  storeSlug,
  initialReviews,
  initialTotal,
  avgRating,
  ratingBreakdown,
}: {
  storeSlug: string;
  initialReviews: StoreReview[];
  initialTotal: number;
  avgRating: number;
  ratingBreakdown: { star: number; count: number }[];
}) {
  const [reviews, setReviews] = useState<StoreReview[]>(initialReviews);
  const [page, setPage] = useState(1);
  const [isPending, setIsPending] = useState(false);
  const [, startTransition] = useTransition();
  const hasMore = reviews.length < initialTotal;

  async function loadMore() {
    const next = page + 1;
    setPage(next);
    setIsPending(true);
    try {
      const res = await fetch(`/api/storefront/store/${storeSlug}/reviews?page=${next}`, { cache: "no-store" });
      if (!res.ok) return;
      const data: { reviews: StoreReview[] } = await res.json();
      setReviews((prev) => [...prev, ...data.reviews.filter((r) => !prev.find((p) => p.id === r.id))]);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Rating Summary */}
      <div className="bg-white rounded-2xl border border-zinc-100 p-6">
        <div className="flex flex-col sm:flex-row gap-6 sm:items-center">
          <div className="text-center shrink-0">
            <p className="text-5xl font-black text-zinc-900">{avgRating > 0 ? avgRating.toFixed(1) : "—"}</p>
            <Stars rating={avgRating} size="md" />
            <p className="text-xs text-zinc-400 mt-1">{initialTotal} reviews</p>
          </div>
          <div className="flex-1 space-y-1.5">
            {ratingBreakdown.map(({ star, count }) => {
              const pct = initialTotal > 0 ? (count / initialTotal) * 100 : 0;
              return (
                <div key={star} className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-zinc-500 w-5 text-right shrink-0">{star}</span>
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 shrink-0" />
                  <div className="flex-1 h-2 rounded-full bg-zinc-100 overflow-hidden">
                    <div className="h-full rounded-full bg-yellow-400" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs text-zinc-400 w-6 shrink-0">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Review list */}
      {reviews.length === 0 ? (
        <div className="py-16 text-center">
          <Star className="h-10 w-10 text-zinc-200 mx-auto mb-3" />
          <p className="font-bold text-zinc-500">No reviews yet</p>
          <p className="text-sm text-zinc-400 mt-1">Be the first to review this store.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => <ReviewCard key={r.id} review={r} />)}
        </div>
      )}

      {hasMore && (
        <div className="text-center">
          <button
            onClick={loadMore}
            disabled={isPending}
            className="inline-flex items-center gap-2 px-8 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-sm rounded-xl transition-colors disabled:opacity-60"
          >
            {isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Loading…</> : "Load More Reviews"}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Products Tab ─────────────────────────────────────────────

function ProductsTab({
  storeSlug,
  initialProducts,
  initialTotal,
  storeCategories,
}: {
  storeSlug: string;
  initialProducts: ProductCardData[];
  initialTotal: number;
  storeCategories: StoreCategory[];
}) {
  const [products, setProducts] = useState<ProductCardData[]>(initialProducts);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const [categoryId, setCategoryId] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minRating, setMinRating] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [, startTransition] = useTransition();

  const fetchProducts = useCallback(
    async (opts: {
      search?: string; sort?: string; categoryId?: string;
      minPrice?: string; maxPrice?: string; minRating?: string;
      page?: number; append?: boolean;
    }) => {
      setIsPending(true);
      try {
        const params = new URLSearchParams({
          sort: opts.sort ?? sort,
          page: String(opts.page ?? 1),
          limit: "24",
        });
        if (opts.search ?? search) params.set("search", opts.search ?? search);
        if (opts.categoryId ?? categoryId) params.set("categoryId", opts.categoryId ?? categoryId);
        if (opts.minPrice ?? minPrice) params.set("minPrice", opts.minPrice ?? minPrice);
        if (opts.maxPrice ?? maxPrice) params.set("maxPrice", opts.maxPrice ?? maxPrice);
        if (opts.minRating ?? minRating) params.set("minRating", opts.minRating ?? minRating);

        const res = await fetch(`/api/storefront/store/${storeSlug}/products?${params}`, { cache: "no-store" });
        if (!res.ok) return;
        const data: { products: StoreProduct[]; total: number } = await res.json();

        const cards: ProductCardData[] = data.products.map((p) => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          price: p.price,
          salePrice: p.salePrice,
          imageUrl: p.imageUrl,
          storeName: p.storeName,
          storeSlug: p.storeSlug,
          storeId: (p as { storeId?: string | null }).storeId ?? null,
          vendorId: (p as { vendorId?: string | null }).vendorId ?? null,
          rating: p.rating,
          reviewCount: p.reviewCount,
        }));

        setProducts((prev) => opts.append ? [...prev, ...cards.filter((c) => !prev.find((p) => p.id === c.id))] : cards);
        setTotal(data.total);
        if (!opts.append) setPage(1);
      } finally {
        setIsPending(false);
      }
    },
    [storeSlug, sort, search, categoryId, minPrice, maxPrice, minRating]
  );

  const hasMore = products.length < total;

  return (
    <div className="flex gap-6">
      {/* Sidebar */}
      <aside className="hidden lg:block w-56 shrink-0 space-y-5">
        {/* Categories */}
        {storeCategories.length > 0 && (
          <div className="bg-white rounded-2xl border border-zinc-100 p-4">
            <p className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-3">Categories</p>
            <div className="space-y-0.5">
              <button
                onClick={() => { setCategoryId(""); fetchProducts({ categoryId: "" }); }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-colors ${
                  !categoryId ? "bg-brand-50 text-brand-700 font-bold" : "text-zinc-600 hover:bg-zinc-50"
                }`}
              >
                <span>All Products</span>
                <span className={`text-xs font-bold rounded-full px-2 py-0.5 ${!categoryId ? "bg-brand-100 text-brand-700" : "bg-zinc-100 text-zinc-500"}`}>
                  {total}
                </span>
              </button>
              {storeCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => { setCategoryId(cat.id); fetchProducts({ categoryId: cat.id }); }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-colors ${
                    categoryId === cat.id ? "bg-brand-50 text-brand-700 font-bold" : "text-zinc-600 hover:bg-zinc-50"
                  }`}
                >
                  <span className="truncate text-left">{cat.name}</span>
                  <span className={`text-xs font-bold rounded-full px-2 py-0.5 shrink-0 ml-1 ${categoryId === cat.id ? "bg-brand-100 text-brand-700" : "bg-zinc-100 text-zinc-500"}`}>
                    {cat.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Price Filter */}
        <div className="bg-white rounded-2xl border border-zinc-100 p-4">
          <p className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-3">Price Range</p>
          <div className="space-y-2">
            <input
              type="number" placeholder="Min price (PKR)"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="w-full h-8 px-3 rounded-lg border border-zinc-200 text-xs focus:outline-none focus:border-brand-400"
            />
            <input
              type="number" placeholder="Max price (PKR)"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="w-full h-8 px-3 rounded-lg border border-zinc-200 text-xs focus:outline-none focus:border-brand-400"
            />
            <button
              onClick={() => fetchProducts({ minPrice, maxPrice })}
              className="w-full h-8 bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold rounded-lg transition-colors"
            >
              Apply
            </button>
            {(minPrice || maxPrice) && (
              <button
                onClick={() => { setMinPrice(""); setMaxPrice(""); fetchProducts({ minPrice: "", maxPrice: "" }); }}
                className="w-full text-xs text-zinc-400 hover:text-rose-500 transition-colors"
              >
                Clear price filter
              </button>
            )}
          </div>
        </div>

        {/* Rating Filter */}
        <div className="bg-white rounded-2xl border border-zinc-100 p-4">
          <p className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-3">Min Rating</p>
          <div className="space-y-1">
            {["", "4", "3", "2"].map((r) => (
              <button
                key={r}
                onClick={() => { setMinRating(r); fetchProducts({ minRating: r }); }}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-colors ${
                  minRating === r ? "bg-brand-50 text-brand-700 font-bold" : "text-zinc-600 hover:bg-zinc-50"
                }`}
              >
                {r ? (
                  <>
                    <Stars rating={Number(r)} />
                    <span className="text-xs text-zinc-500">& up</span>
                  </>
                ) : (
                  <span className="text-sm">All Ratings</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        {/* Toolbar */}
        <div className="flex items-center gap-3 mb-5 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-0 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); fetchProducts({ search: e.target.value }); }}
              placeholder="Search in store…"
              className="w-full h-9 pl-8 pr-3 rounded-xl border border-zinc-200 bg-zinc-50 text-sm focus:outline-none focus:border-brand-400 focus:bg-white transition-all"
            />
          </div>

          {/* Sort */}
          <select
            value={sort}
            onChange={(e) => { setSort(e.target.value); fetchProducts({ sort: e.target.value }); }}
            className="h-9 px-3 pr-7 rounded-xl border border-zinc-200 bg-zinc-50 text-sm font-medium text-zinc-700 focus:outline-none focus:border-brand-400 appearance-none cursor-pointer shrink-0"
          >
            <option value="newest">Newest First</option>
            <option value="popular">Most Popular</option>
            <option value="top_rated">Top Rated</option>
            <option value="price_asc">Price: Low → High</option>
            <option value="price_desc">Price: High → Low</option>
          </select>

          <p className="text-sm text-zinc-500 ml-auto shrink-0">
            {isPending ? "…" : <><span className="font-bold text-zinc-900">{total}</span> products</>}
          </p>
        </div>

        {/* Grid */}
        {products.length === 0 && !isPending ? (
          <div className="py-20 text-center">
            <Package className="h-12 w-12 text-zinc-200 mx-auto mb-3" />
            <p className="font-bold text-zinc-500">No products found</p>
            <p className="text-sm text-zinc-400 mt-1">Try clearing your filters.</p>
          </div>
        ) : (
          <div className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 transition-opacity ${isPending ? "opacity-60" : ""}`}>
            {products.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}

        {hasMore && (
          <div className="mt-8 text-center">
            <button
              onClick={() => {
                const next = page + 1;
                setPage(next);
                fetchProducts({ page: next, append: true });
              }}
              disabled={isPending}
              className="inline-flex items-center gap-2 px-8 py-3 bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white font-bold text-sm rounded-xl transition-all"
            >
              {isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Loading…</> : `Load More (${total - products.length} remaining)`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Categories Tab ───────────────────────────────────────────

function CategoriesTab({ categories, storeSlug }: { categories: StoreCategory[]; storeSlug: string }) {
  if (categories.length === 0) {
    return (
      <div className="py-16 text-center">
        <Tag className="h-10 w-10 text-zinc-200 mx-auto mb-3" />
        <p className="font-bold text-zinc-500">No categories yet</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {categories.map((cat) => (
        <Link
          key={cat.id}
          href={`/shop/store/${storeSlug}?tab=products&category=${cat.id}`}
          className="group bg-white rounded-2xl border border-zinc-100 hover:border-brand-200 hover:shadow-md p-5 transition-all text-center"
        >
          <div className="h-12 w-12 rounded-xl bg-brand-50 flex items-center justify-center mx-auto mb-3">
            <ShoppingBag className="h-6 w-6 text-brand-500" />
          </div>
          <p className="font-bold text-zinc-800 text-sm group-hover:text-brand-600 transition-colors">{cat.name}</p>
          <p className="text-xs text-zinc-400 mt-1">{cat.count} products</p>
        </Link>
      ))}
    </div>
  );
}

// ─── About Tab ────────────────────────────────────────────────

function AboutTab({ store }: { store: StoreDetail }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {store.description && (
        <div className="md:col-span-2 bg-white rounded-2xl border border-zinc-100 p-6">
          <h3 className="font-black text-zinc-900 mb-3">About This Store</h3>
          <p className="text-sm text-zinc-600 leading-relaxed whitespace-pre-line">{store.description}</p>
        </div>
      )}

      {/* Store Info */}
      <div className="bg-white rounded-2xl border border-zinc-100 p-6 space-y-4">
        <h3 className="font-black text-zinc-900">Store Information</h3>
        {[
          store.address && { Icon: MapPin, label: "Address", value: store.address },
          store.phone && { Icon: Phone, label: "Phone", value: store.phone },
          store.email && { Icon: Mail, label: "Email", value: store.email },
          { Icon: Calendar, label: "Member Since", value: new Date(store.joinDate).toLocaleDateString("en-PK", { month: "long", year: "numeric" }) },
        ].filter(Boolean).map((item) => {
          const { Icon, label, value } = item as { Icon: typeof MapPin; label: string; value: string };
          return (
            <div key={label} className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-lg bg-zinc-50 flex items-center justify-center shrink-0 mt-0.5">
                <Icon className="h-4 w-4 text-zinc-400" />
              </div>
              <div>
                <p className="text-xs font-semibold text-zinc-400">{label}</p>
                <p className="text-sm text-zinc-700 mt-0.5">{value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Policies */}
      {(store.returnPolicy || store.shippingPolicy) && (
        <div className="bg-white rounded-2xl border border-zinc-100 p-6 space-y-5">
          <h3 className="font-black text-zinc-900">Store Policies</h3>
          {store.shippingPolicy && (
            <div>
              <p className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-2">Shipping</p>
              <p className="text-sm text-zinc-600 leading-relaxed">{store.shippingPolicy}</p>
            </div>
          )}
          {store.returnPolicy && (
            <div>
              <p className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-2">Returns</p>
              <p className="text-sm text-zinc-600 leading-relaxed">{store.returnPolicy}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Storefront ──────────────────────────────────────────

type Props = {
  store: StoreDetail;
  initialProducts: ProductCardData[];
  initialTotal: number;
  storeCategories: StoreCategory[];
  initialReviews: StoreReview[];
  reviewTotal: number;
  avgRating: number;
  ratingBreakdown: { star: number; count: number }[];
  defaultTab?: string;
  defaultCategoryId?: string;
};

type Tab = "products" | "categories" | "reviews" | "about";

const TABS: { id: Tab; label: string }[] = [
  { id: "products", label: "All Products" },
  { id: "categories", label: "Categories" },
  { id: "reviews", label: "Reviews" },
  { id: "about", label: "About Store" },
];

export function VendorStorefront({
  store,
  initialProducts,
  initialTotal,
  storeCategories,
  initialReviews,
  reviewTotal,
  avgRating,
  ratingBreakdown,
  defaultTab = "products",
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>((defaultTab as Tab) ?? "products");

  const BANNER_GRADIENTS = [
    "from-violet-500 via-purple-500 to-indigo-600",
    "from-rose-400 via-pink-500 to-fuchsia-600",
    "from-amber-400 via-orange-500 to-red-500",
    "from-emerald-400 via-teal-500 to-cyan-600",
    "from-blue-400 via-indigo-500 to-violet-600",
    "from-pink-400 via-rose-500 to-orange-400",
    "from-teal-400 via-cyan-500 to-blue-500",
    "from-orange-400 via-amber-500 to-yellow-400",
    "from-indigo-500 via-blue-500 to-cyan-400",
    "from-fuchsia-500 via-violet-500 to-purple-600",
    "from-green-400 via-emerald-500 to-teal-500",
    "from-cyan-400 via-sky-500 to-blue-600",
  ];
  let hash = 0;
  for (let i = 0; i < store.name.length; i++) hash = (hash * 31 + store.name.charCodeAt(i)) & 0xffff;
  const bannerGradient = BANNER_GRADIENTS[hash % BANNER_GRADIENTS.length];

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* ── Store Header ────────────────────────────── */}
      <div className="relative">
        {/* Banner — always a color gradient */}
        <div className={`h-48 sm:h-56 md:h-64 relative bg-gradient-to-br ${bannerGradient}`}>
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/5 to-transparent" />
        </div>

        {/* Store info overlay */}
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="relative -mt-16 sm:-mt-20 pb-0">
            <div className="bg-white rounded-2xl border border-zinc-100 shadow-xl p-5 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-5">
                {/* Logo */}
                <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl border-4 border-white shadow-lg overflow-hidden bg-zinc-100 shrink-0 -mt-14 sm:-mt-16 self-start">
                  {store.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={store.logoUrl} alt={store.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center">
                      <span className="text-3xl font-black text-white">{store.name[0].toUpperCase()}</span>
                    </div>
                  )}
                </div>

                {/* Meta */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h1 className="text-xl sm:text-2xl font-black text-zinc-900 leading-tight">{store.name}</h1>
                        {store.verificationBadge && (
                          <span className="flex items-center gap-1 bg-green-50 text-green-700 text-xs font-bold px-2.5 py-1 rounded-full border border-green-100">
                            <Shield className="h-3 w-3" /> Verified
                          </span>
                        )}
                        {store.featured && (
                          <span className="flex items-center gap-1 bg-brand-50 text-brand-700 text-xs font-bold px-2.5 py-1 rounded-full border border-brand-100">
                            ★ Featured
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 mt-1.5">
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <Star key={i} className={`h-3.5 w-3.5 ${i <= Math.round(avgRating) ? "fill-yellow-400 text-yellow-400" : "fill-zinc-200 text-zinc-200"}`} />
                          ))}
                        </div>
                        <span className="text-sm font-bold text-zinc-700">{avgRating > 0 ? avgRating.toFixed(1) : "—"}</span>
                        <span className="text-xs text-zinc-400">({reviewTotal} reviews)</span>
                      </div>
                    </div>

                    {/* Contact button */}
                    {store.inquiryEnabled && (
                      <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-zinc-200 hover:border-brand-300 hover:bg-brand-50 text-sm font-semibold text-zinc-700 hover:text-brand-700 transition-all shrink-0">
                        <MessageCircle className="h-4 w-4" /> Contact Store
                      </button>
                    )}
                  </div>

                  {store.description && (
                    <p className="text-sm text-zinc-500 mt-2 leading-relaxed line-clamp-2">{store.description}</p>
                  )}

                  {/* Quick stats */}
                  <div className="flex flex-wrap gap-4 mt-3 pt-3 border-t border-zinc-50">
                    {[
                      { icon: Package, value: store.productCount, label: "Products" },
                      { icon: Star, value: reviewTotal, label: "Reviews" },
                      { icon: Calendar, value: new Date(store.joinDate).getFullYear(), label: "Member Since" },
                    ].map(({ icon: Icon, value, label }) => (
                      <div key={label} className="flex items-center gap-1.5 text-sm">
                        <Icon className="h-3.5 w-3.5 text-zinc-400" />
                        <span className="font-bold text-zinc-800">{value}</span>
                        <span className="text-zinc-400">{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tab Navigation ──────────────────────────── */}
      <div className="sticky top-0 z-20 bg-white border-b border-zinc-100 shadow-sm">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-2 px-5 py-4 text-sm font-semibold whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? "text-brand-600"
                    : "text-zinc-500 hover:text-zinc-800"
                }`}
              >
                {tab.label}
                {tab.id === "reviews" && reviewTotal > 0 && (
                  <span className="text-[10px] font-black bg-zinc-100 text-zinc-500 px-1.5 py-0.5 rounded-full">
                    {reviewTotal}
                  </span>
                )}
                {activeTab === tab.id && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-500 rounded-t-full" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tab Content ─────────────────────────────── */}
      <div className="container mx-auto px-4 max-w-7xl py-6">
        {activeTab === "products" && (
          <ProductsTab
            storeSlug={store.slug}
            initialProducts={initialProducts}
            initialTotal={initialTotal}
            storeCategories={storeCategories}
          />
        )}
        {activeTab === "categories" && (
          <CategoriesTab categories={storeCategories} storeSlug={store.slug} />
        )}
        {activeTab === "reviews" && (
          <ReviewsTab
            storeSlug={store.slug}
            initialReviews={initialReviews}
            initialTotal={reviewTotal}
            avgRating={avgRating}
            ratingBreakdown={ratingBreakdown}
          />
        )}
        {activeTab === "about" && <AboutTab store={store} />}
      </div>
    </div>
  );
}
