"use client";

import { useState, useTransition, useCallback } from "react";
import Link from "next/link";
import {
  Search, SlidersHorizontal, Star, Package, ShieldCheck,
  Medal, ArrowRight, Store, X, Loader2, Badge,
} from "lucide-react";
import type { StoreListItem } from "@/lib/storefront/store-data";

// ─── Store Card ───────────────────────────────────────────────

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

const LOGO_GRADIENTS = [
  "from-violet-500 to-indigo-600",
  "from-rose-500 to-fuchsia-600",
  "from-amber-500 to-orange-600",
  "from-emerald-500 to-teal-600",
  "from-blue-500 to-violet-600",
  "from-pink-500 to-rose-600",
  "from-teal-500 to-cyan-600",
  "from-orange-500 to-amber-600",
  "from-indigo-500 to-blue-600",
  "from-fuchsia-500 to-purple-600",
  "from-green-500 to-emerald-600",
  "from-cyan-500 to-sky-600",
];

function bannerGradientFor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) & 0xffff;
  return BANNER_GRADIENTS[hash % BANNER_GRADIENTS.length];
}

function logoGradientFor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 17 + name.charCodeAt(i)) & 0xffff;
  return LOGO_GRADIENTS[hash % LOGO_GRADIENTS.length];
}

function StarRating({ rating, count }: { rating: number; count: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            className={`h-3 w-3 ${i <= Math.round(rating) ? "fill-yellow-400 text-yellow-400" : "fill-zinc-200 text-zinc-200"}`}
          />
        ))}
      </div>
      <span className="text-xs font-semibold text-zinc-600">{rating > 0 ? rating.toFixed(1) : "—"}</span>
      {count > 0 && <span className="text-xs text-zinc-400">({count})</span>}
    </div>
  );
}

function StoreCard({ store }: { store: StoreListItem }) {
  const banner = bannerGradientFor(store.name);
  const logo = logoGradientFor(store.name);
  return (
    <Link
      href={`/shop/store/${store.slug}`}
      className="group block bg-white rounded-2xl border border-zinc-100 hover:border-brand-200 hover:shadow-xl transition-all duration-200 overflow-hidden"
    >
      {/* Banner — always a color gradient, no image */}
      <div className={`relative h-28 bg-gradient-to-br ${banner}`}>
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />

        {/* Featured badge */}
        {store.featured && (
          <span className="absolute top-2 left-2 flex items-center gap-1 bg-white/90 text-brand-600 text-[10px] font-black px-2.5 py-1 rounded-full shadow">
            <Medal className="h-3 w-3" />
            Featured
          </span>
        )}

        {/* Logo floats over banner */}
        <div className="absolute -bottom-5 left-4">
          <div className="h-12 w-12 rounded-xl border-2 border-white shadow-md overflow-hidden">
            {store.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={store.logoUrl} alt={store.name} className="w-full h-full object-cover" />
            ) : (
              <div className={`w-full h-full bg-gradient-to-br ${logo} flex items-center justify-center`}>
                <span className="text-white font-black text-lg">{store.name[0].toUpperCase()}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="pt-8 px-4 pb-4">
        <div className="mb-2">
          <p className="font-black text-zinc-900 text-sm leading-tight group-hover:text-brand-600 transition-colors truncate">
            {store.name}
          </p>
          <div className="mt-1">
            <StarRating rating={store.avgRating} count={store.totalReviews} />
          </div>
        </div>

        {store.description && (
          <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed mb-3">{store.description}</p>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-zinc-50">
          <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-medium">
            <Package className="h-3.5 w-3.5" />
            <span>{store.productCount} products</span>
          </div>
          <span className="flex items-center gap-1 text-xs font-bold text-brand-500 group-hover:gap-1.5 transition-all">
            Visit Store
            <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
          </span>
        </div>
      </div>
    </Link>
  );
}

// ─── Main Directory Component ─────────────────────────────────

type Category = { id: string; name: string; slug: string };

type Props = {
  initialStores: StoreListItem[];
  initialTotal: number;
  categories: Category[];
};

export function StoresDirectory({ initialStores, initialTotal, categories }: Props) {
  const [stores, setStores] = useState<StoreListItem[]>(initialStores);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"featured" | "top_rated" | "most_products" | "newest">("featured");
  const [categorySlug, setCategorySlug] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [, startTransition] = useTransition();

  const LIMIT = 24;

  const fetchStores = useCallback(
    async (newSearch: string, newSort: string, newCategory: string, newPage: number, append = false) => {
      setIsPending(true);
      try {
        const params = new URLSearchParams({
          search: newSearch,
          sort: newSort,
          page: String(newPage),
          limit: String(LIMIT),
        });
        if (newCategory) params.set("category", newCategory);

        const res = await fetch(`/api/storefront/stores?${params}`, { cache: "no-store" });
        if (!res.ok) return;
        const data: { stores: StoreListItem[]; total: number } = await res.json();
        setStores((prev) =>
          append ? [...prev, ...data.stores.filter((s) => !prev.find((p) => p.id === s.id))] : data.stores
        );
        setTotal(data.total);
        if (!append) setPage(1);
      } finally {
        setIsPending(false);
      }
    },
    []
  );

  function handleSearch(val: string) {
    setSearch(val);
    fetchStores(val, sort, categorySlug, 1);
  }

  function handleSort(val: typeof sort) {
    setSort(val);
    fetchStores(search, val, categorySlug, 1);
  }

  function handleCategory(slug: string) {
    setCategorySlug(slug);
    fetchStores(search, sort, slug, 1);
  }

  function loadMore() {
    const next = page + 1;
    setPage(next);
    fetchStores(search, sort, categorySlug, next, true);
  }

  const hasMore = stores.length < total;

  return (
    <div>
      {/* ── Search + Controls Bar ── */}
      <div className="sticky top-0 z-30 bg-white border-b border-zinc-100 shadow-sm">
        <div className="container mx-auto px-4 max-w-7xl py-3">
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <input
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search stores…"
                className="w-full h-9 pl-9 pr-3 rounded-xl border border-zinc-200 bg-zinc-50 text-sm focus:outline-none focus:border-brand-400 focus:bg-white transition-all"
              />
              {search && (
                <button onClick={() => handleSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2">
                  <X className="h-3.5 w-3.5 text-zinc-400 hover:text-zinc-700" />
                </button>
              )}
            </div>

            {/* Sort */}
            <select
              value={sort}
              onChange={(e) => handleSort(e.target.value as typeof sort)}
              className="h-9 px-3 pr-8 rounded-xl border border-zinc-200 bg-zinc-50 text-sm font-medium text-zinc-700 focus:outline-none focus:border-brand-400 appearance-none cursor-pointer"
            >
              <option value="featured">Featured First</option>
              <option value="top_rated">Top Rated</option>
              <option value="most_products">Most Products</option>
              <option value="newest">Newest</option>
            </select>

            {/* Filter toggle */}
            <button
              onClick={() => setShowFilters((s) => !s)}
              className={`flex items-center gap-2 h-9 px-3.5 rounded-xl border text-sm font-semibold transition-colors ${
                showFilters || categorySlug
                  ? "bg-brand-50 border-brand-300 text-brand-700"
                  : "border-zinc-200 text-zinc-700 hover:border-zinc-300"
              }`}
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span className="hidden sm:inline">Filters</span>
              {categorySlug && <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />}
            </button>
          </div>

          {/* Expandable filters */}
          {showFilters && (
            <div className="mt-3 pt-3 border-t border-zinc-100 flex flex-wrap gap-2">
              <button
                onClick={() => handleCategory("")}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                  !categorySlug ? "bg-brand-500 text-white border-brand-500" : "border-zinc-200 text-zinc-600 hover:border-brand-300"
                }`}
              >
                All Categories
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleCategory(c.slug)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                    categorySlug === c.slug ? "bg-brand-500 text-white border-brand-500" : "border-zinc-200 text-zinc-600 hover:border-brand-300"
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-7xl py-6">
        {/* Result count */}
        <div className="flex items-center justify-between mb-5">
          <p className="text-sm text-zinc-500">
            {isPending ? "Searching…" : <><span className="font-bold text-zinc-900">{total}</span> stores found</>}
          </p>
          {categorySlug && (
            <button
              onClick={() => handleCategory("")}
              className="flex items-center gap-1.5 text-xs text-brand-600 font-semibold hover:text-brand-700"
            >
              <X className="h-3 w-3" /> Clear filter
            </button>
          )}
        </div>

        {/* Grid */}
        {stores.length === 0 && !isPending ? (
          <div className="flex flex-col items-center py-24 text-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-zinc-100 flex items-center justify-center">
              <Store className="h-8 w-8 text-zinc-300" />
            </div>
            <div>
              <p className="font-bold text-zinc-700 text-lg">No stores found</p>
              <p className="text-sm text-zinc-400 mt-1">Try a different search or category filter.</p>
            </div>
            <button
              onClick={() => { setSearch(""); setCategorySlug(""); fetchStores("", "featured", "", 1); }}
              className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-sm font-bold rounded-xl transition-colors"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 transition-opacity ${isPending ? "opacity-60" : ""}`}>
            {stores.map((store) => (
              <StoreCard key={store.id} store={store} />
            ))}
          </div>
        )}

        {/* Load More */}
        {hasMore && (
          <div className="mt-10 text-center">
            <button
              onClick={loadMore}
              disabled={isPending}
              className="inline-flex items-center gap-3 px-10 py-3.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white font-bold text-sm rounded-xl shadow-sm transition-all"
            >
              {isPending ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Loading…</>
              ) : (
                `Load More Stores (${total - stores.length} remaining)`
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
