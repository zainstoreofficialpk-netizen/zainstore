"use client";

import { useState, useTransition, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Search, SlidersHorizontal, X, Star, Package, ChevronDown,
  ChevronUp, Loader2, Check, LayoutGrid, List, Tag,
  Zap, TrendingUp, BadgePercent, ShoppingCart,
} from "lucide-react";
import { ProductCard, type ProductCardData } from "./product-card";
import { formatCurrency } from "@/lib/format";

// ─── Types ────────────────────────────────────────────────────

type ShopProduct = ProductCardData & {
  storeId: string | null;
  categoryName: string | null;
  brandName: string | null;
  inStock: boolean;
  featured: boolean;
};

type FilterState = {
  search: string;
  categoryId: string;
  brandId: string;
  storeId: string;
  minPrice: string;
  maxPrice: string;
  rating: string;
  onSale: boolean;
  inStock: boolean;
  featured: boolean;
  sort: string;
};

type Category = { id: string; name: string; slug: string; productCount: number };
type Brand    = { id: string; name: string };
type Store    = { id: string; name: string; slug: string; productCount: number };

type Props = {
  initialProducts: ShopProduct[];
  initialTotal: number;
  categories: Category[];
  brands: Brand[];
  stores: Store[];
  priceMin: number;
  priceMax: number;
  initialCategoryId?: string;
};

const DEFAULT_FILTERS: FilterState = {
  search: "", categoryId: "", brandId: "", storeId: "",
  minPrice: "", maxPrice: "", rating: "", onSale: false, inStock: false, featured: false,
  sort: "newest",
};

const SORT_OPTIONS = [
  { value: "newest",     label: "Newest First" },
  { value: "featured",   label: "Featured" },
  { value: "popular",    label: "Most Popular" },
  { value: "rating",     label: "Highest Rated" },
  { value: "price_asc",  label: "Price: Low → High" },
  { value: "price_desc", label: "Price: High → Low" },
];

// ─── Section accordion ────────────────────────────────────────

function Section({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-zinc-100 pb-4 mb-4 last:border-0 last:mb-0 last:pb-0">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-between w-full mb-3 group"
      >
        <span className="text-xs font-black text-zinc-500 uppercase tracking-widest">{title}</span>
        {open ? <ChevronUp className="h-3.5 w-3.5 text-zinc-400" /> : <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />}
      </button>
      {open && children}
    </div>
  );
}

// ─── Filter Sidebar ───────────────────────────────────────────

function FilterSidebar({
  filters, setFilters, onApply,
  categories, brands, stores, priceMin, priceMax,
  totalActive,
}: {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  onApply: (f: FilterState) => void;
  categories: Category[];
  brands: Brand[];
  stores: Store[];
  priceMin: number;
  priceMax: number;
  totalActive: number;
}) {
  const [showAllStores, setShowAllStores] = useState(false);
  const [brandSearch, setBrandSearch] = useState("");

  const visibleStores = showAllStores ? stores : stores.slice(0, 6);
  const filteredBrands = brands.filter((b) => b.name.toLowerCase().includes(brandSearch.toLowerCase()));

  function set<K extends keyof FilterState>(key: K, val: FilterState[K]) {
    const next = { ...filters, [key]: val };
    setFilters(next);
    onApply(next);
  }

  function reset() {
    setFilters(DEFAULT_FILTERS);
    onApply(DEFAULT_FILTERS);
  }

  return (
    <div className="space-y-0">
      {/* Filter header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-zinc-600" />
          <span className="font-black text-zinc-900 text-sm">Filters</span>
          {totalActive > 0 && (
            <span className="h-5 w-5 rounded-full bg-brand-500 text-white text-[10px] font-black flex items-center justify-center">
              {totalActive}
            </span>
          )}
        </div>
        {totalActive > 0 && (
          <button onClick={reset} className="text-xs font-semibold text-rose-500 hover:text-rose-600 transition-colors">
            Clear all
          </button>
        )}
      </div>

      {/* Categories */}
      <Section title="Categories">
        <div className="space-y-0.5">
          <button
            onClick={() => set("categoryId", "")}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-sm transition-colors ${!filters.categoryId ? "bg-brand-50 text-brand-700 font-bold" : "text-zinc-600 hover:bg-zinc-50"}`}
          >
            <span>All Categories</span>
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => set("categoryId", c.id === filters.categoryId ? "" : c.id)}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-sm transition-colors ${filters.categoryId === c.id ? "bg-brand-50 text-brand-700 font-bold" : "text-zinc-600 hover:bg-zinc-50"}`}
            >
              <span className="truncate text-left">{c.name}</span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ml-1 ${filters.categoryId === c.id ? "bg-brand-100 text-brand-700" : "bg-zinc-100 text-zinc-500"}`}>
                {c.productCount}
              </span>
            </button>
          ))}
        </div>
      </Section>

      {/* Price */}
      <Section title="Price Range (PKR)">
        <div className="space-y-2.5">
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-[10px] text-zinc-400 font-semibold mb-1 block">Min</label>
              <input
                type="number" placeholder={String(priceMin)} value={filters.minPrice}
                onChange={(e) => setFilters((f) => ({ ...f, minPrice: e.target.value }))}
                onBlur={(e) => onApply({ ...filters, minPrice: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && onApply({ ...filters, minPrice: (e.target as HTMLInputElement).value })}
                className="w-full h-8 px-2.5 rounded-lg border border-zinc-200 text-xs focus:outline-none focus:border-brand-400"
              />
            </div>
            <div className="flex-1">
              <label className="text-[10px] text-zinc-400 font-semibold mb-1 block">Max</label>
              <input
                type="number" placeholder={String(priceMax)} value={filters.maxPrice}
                onChange={(e) => setFilters((f) => ({ ...f, maxPrice: e.target.value }))}
                onBlur={(e) => onApply({ ...filters, maxPrice: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && onApply({ ...filters, maxPrice: (e.target as HTMLInputElement).value })}
                className="w-full h-8 px-2.5 rounded-lg border border-zinc-200 text-xs focus:outline-none focus:border-brand-400"
              />
            </div>
          </div>
          {/* Quick price presets */}
          <div className="flex flex-wrap gap-1.5">
            {[
              { label: "Under 1k",   min: "",     max: "1000"  },
              { label: "1k–5k",      min: "1000", max: "5000"  },
              { label: "5k–15k",     min: "5000", max: "15000" },
              { label: "15k+",       min: "15000",max: ""      },
            ].map((p) => {
              const active = filters.minPrice === p.min && filters.maxPrice === p.max;
              return (
                <button
                  key={p.label}
                  onClick={() => {
                    const next = { ...filters, minPrice: p.min, maxPrice: p.max };
                    setFilters(next);
                    onApply(next);
                  }}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-colors ${active ? "bg-brand-500 text-white border-brand-500" : "border-zinc-200 text-zinc-600 hover:border-brand-300"}`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
          {(filters.minPrice || filters.maxPrice) && (
            <button onClick={() => { const n={...filters,minPrice:"",maxPrice:""}; setFilters(n); onApply(n); }} className="text-xs text-zinc-400 hover:text-rose-500 transition-colors">
              Clear price
            </button>
          )}
        </div>
      </Section>

      {/* Rating */}
      <Section title="Customer Rating">
        <div className="space-y-0.5">
          {[{ value: "", label: "All Ratings" }, { value: "4", label: "4★ & above" }, { value: "3", label: "3★ & above" }, { value: "2", label: "2★ & above" }].map((r) => (
            <button
              key={r.value}
              onClick={() => set("rating", r.value)}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors ${filters.rating === r.value ? "bg-brand-50 text-brand-700 font-bold" : "text-zinc-600 hover:bg-zinc-50"}`}
            >
              {r.value ? (
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map((s) => (
                    <Star key={s} className={`h-3 w-3 ${s <= Number(r.value) ? "fill-yellow-400 text-yellow-400" : "fill-zinc-200 text-zinc-200"}`} />
                  ))}
                </div>
              ) : <Tag className="h-3.5 w-3.5 text-zinc-400" />}
              <span className="text-xs">{r.label}</span>
            </button>
          ))}
        </div>
      </Section>

      {/* Availability & Condition */}
      <Section title="Availability">
        <div className="space-y-2">
          {[
            { key: "onSale" as const,  icon: BadgePercent, label: "On Sale",     color: "text-rose-600" },
            { key: "inStock" as const, icon: Package,      label: "In Stock",    color: "text-emerald-600" },
            { key: "featured" as const,icon: Zap,          label: "Featured",    color: "text-brand-600" },
          ].map(({ key, icon: Icon, label, color }) => (
            <button
              key={key}
              onClick={() => set(key, !filters[key])}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-colors border ${filters[key] ? "bg-brand-50 border-brand-200 text-brand-700" : "border-transparent text-zinc-600 hover:bg-zinc-50"}`}
            >
              <div className={`h-5 w-5 rounded flex items-center justify-center shrink-0 ${filters[key] ? "bg-brand-500" : "border border-zinc-300 bg-white"}`}>
                {filters[key] && <Check className="h-3 w-3 text-white" />}
              </div>
              <Icon className={`h-3.5 w-3.5 shrink-0 ${color}`} />
              {label}
            </button>
          ))}
        </div>
      </Section>

      {/* Brands */}
      {brands.length > 0 && (
        <Section title="Brands" defaultOpen={false}>
          <div className="mb-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-zinc-400" />
              <input
                value={brandSearch} onChange={(e) => setBrandSearch(e.target.value)}
                placeholder="Search brands…"
                className="w-full h-7 pl-7 pr-2.5 rounded-lg border border-zinc-200 text-xs focus:outline-none focus:border-brand-400 bg-zinc-50"
              />
            </div>
          </div>
          <div className="space-y-0.5 max-h-40 overflow-y-auto">
            {filteredBrands.map((b) => (
              <button
                key={b.id}
                onClick={() => set("brandId", b.id === filters.brandId ? "" : b.id)}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-sm transition-colors ${filters.brandId === b.id ? "bg-brand-50 text-brand-700 font-bold" : "text-zinc-600 hover:bg-zinc-50"}`}
              >
                <div className={`h-4 w-4 rounded shrink-0 flex items-center justify-center ${filters.brandId === b.id ? "bg-brand-500" : "border border-zinc-300 bg-white"}`}>
                  {filters.brandId === b.id && <Check className="h-2.5 w-2.5 text-white" />}
                </div>
                <span className="truncate text-left">{b.name}</span>
              </button>
            ))}
          </div>
        </Section>
      )}

      {/* Stores/Vendors */}
      <Section title="Vendors" defaultOpen={false}>
        <div className="space-y-0.5">
          {visibleStores.map((s) => (
            <button
              key={s.id}
              onClick={() => set("storeId", s.id === filters.storeId ? "" : s.id)}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-sm transition-colors ${filters.storeId === s.id ? "bg-brand-50 text-brand-700 font-bold" : "text-zinc-600 hover:bg-zinc-50"}`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className={`h-4 w-4 rounded shrink-0 flex items-center justify-center ${filters.storeId === s.id ? "bg-brand-500" : "border border-zinc-300 bg-white"}`}>
                  {filters.storeId === s.id && <Check className="h-2.5 w-2.5 text-white" />}
                </div>
                <span className="truncate text-left text-xs">{s.name}</span>
              </div>
              <span className="text-[10px] font-bold bg-zinc-100 text-zinc-500 px-1.5 py-0.5 rounded-full shrink-0 ml-1">{s.productCount}</span>
            </button>
          ))}
          {stores.length > 6 && (
            <button onClick={() => setShowAllStores((v) => !v)} className="text-xs font-semibold text-brand-500 hover:text-brand-600 px-2.5 py-1 transition-colors">
              {showAllStores ? "Show less ↑" : `Show ${stores.length - 6} more ↓`}
            </button>
          )}
        </div>
      </Section>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────

export function ShopBrowse({ initialProducts, initialTotal, categories, brands, stores, priceMin, priceMax, initialCategoryId }: Props) {
  const [products, setProducts] = useState<ShopProduct[]>(initialProducts);
  const [total, setTotal]       = useState(initialTotal);
  const [page, setPage]         = useState(1);
  const [filters, setFilters]   = useState<FilterState>({ ...DEFAULT_FILTERS, categoryId: initialCategoryId ?? "" });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isPending, setIsPending]   = useState(false);
  const [, startTransition] = useTransition();
  const searchRef = useRef<HTMLInputElement>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const LIMIT = 36;

  const totalActive = [
    filters.categoryId, filters.brandId, filters.storeId, filters.minPrice,
    filters.maxPrice, filters.rating,
  ].filter(Boolean).length + (filters.onSale ? 1 : 0) + (filters.inStock ? 1 : 0) + (filters.featured ? 1 : 0);

  const fetchProducts = useCallback(async (f: FilterState, pg = 1, append = false) => {
    setIsPending(true);
    try {
      const p = new URLSearchParams({ sort: f.sort, page: String(pg), limit: String(LIMIT) });
      if (f.search)     p.set("search",     f.search);
      if (f.categoryId) p.set("category",   f.categoryId);
      if (f.brandId)    p.set("brand",      f.brandId);
      if (f.storeId)    p.set("store",      f.storeId);
      if (f.minPrice)   p.set("minPrice",   f.minPrice);
      if (f.maxPrice)   p.set("maxPrice",   f.maxPrice);
      if (f.rating)     p.set("rating",     f.rating);
      if (f.onSale)     p.set("onSale",     "1");
      if (f.inStock)    p.set("inStock",    "1");
      if (f.featured)   p.set("featured",   "1");

      const res = await fetch(`/api/storefront/products?${p}`, { cache: "no-store" });
      if (!res.ok) return;
      const data: { products: ShopProduct[]; total: number } = await res.json();
      setProducts((prev) => append ? [...prev, ...data.products.filter((n) => !prev.find((o) => o.id === n.id))] : data.products);
      setTotal(data.total);
      if (!append) setPage(1);
    } finally {
      setIsPending(false);
    }
  }, []);

  function handleSearchChange(val: string) {
    const next = { ...filters, search: val };
    setFilters(next);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => fetchProducts(next, 1), 350);
  }

  function handleSort(val: string) {
    const next = { ...filters, sort: val };
    setFilters(next);
    fetchProducts(next, 1);
  }

  function applyFilters(f: FilterState) {
    fetchProducts(f, 1);
  }

  function loadMore() {
    const next = page + 1;
    setPage(next);
    void fetchProducts(filters, next, true);
  }

  const hasMore = products.length < total;

  return (
    <div className="min-h-screen bg-zinc-50">

      {/* ── Mobile Filter Drawer ──────────────────── */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrawerOpen(false)} />
          <div className="relative z-10 w-80 max-w-[90vw] bg-white h-full overflow-y-auto p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <span className="font-black text-zinc-900">Filters</span>
              <button onClick={() => setDrawerOpen(false)}><X className="h-5 w-5 text-zinc-500" /></button>
            </div>
            <FilterSidebar
              filters={filters} setFilters={setFilters} onApply={(f) => { applyFilters(f); setDrawerOpen(false); }}
              categories={categories} brands={brands} stores={stores}
              priceMin={priceMin} priceMax={priceMax} totalActive={totalActive}
            />
          </div>
        </div>
      )}

      {/* ── Sticky top toolbar ───────────────────── */}
      <div className="sticky top-0 z-20 bg-white border-b border-zinc-100 shadow-sm">
        <div className="container mx-auto px-4 max-w-7xl py-3">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Mobile filter button */}
            <button
              onClick={() => setDrawerOpen(true)}
              className={`lg:hidden flex items-center gap-1.5 h-9 px-3.5 rounded-xl border text-sm font-semibold transition-colors shrink-0 ${totalActive ? "bg-brand-50 border-brand-300 text-brand-700" : "border-zinc-200 text-zinc-700"}`}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters {totalActive > 0 && `(${totalActive})`}
            </button>

            {/* Search */}
            <div className="relative flex-1 min-w-0 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
              <input
                ref={searchRef}
                value={filters.search}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search products…"
                className="w-full h-9 pl-9 pr-8 rounded-xl border border-zinc-200 bg-zinc-50 text-sm focus:outline-none focus:border-brand-400 focus:bg-white transition-all"
              />
              {filters.search && (
                <button onClick={() => handleSearchChange("")} className="absolute right-2.5 top-1/2 -translate-y-1/2">
                  <X className="h-3.5 w-3.5 text-zinc-400 hover:text-zinc-700" />
                </button>
              )}
            </div>

            {/* Sort */}
            <select
              value={filters.sort}
              onChange={(e) => handleSort(e.target.value)}
              className="h-9 pl-3 pr-7 rounded-xl border border-zinc-200 bg-zinc-50 text-sm font-medium text-zinc-700 focus:outline-none focus:border-brand-400 appearance-none cursor-pointer shrink-0"
            >
              {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>

            {/* Count */}
            <p className="text-sm text-zinc-500 ml-auto shrink-0 whitespace-nowrap">
              {isPending ? "Searching…" : <><span className="font-bold text-zinc-900">{total.toLocaleString()}</span> products</>}
            </p>
          </div>

          {/* Active filter pills */}
          {totalActive > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2.5 pt-2.5 border-t border-zinc-50">
              {filters.categoryId && (
                <ActivePill label={categories.find((c) => c.id === filters.categoryId)?.name ?? "Category"} onRemove={() => { const n={...filters,categoryId:""}; setFilters(n); applyFilters(n); }} />
              )}
              {filters.brandId && (
                <ActivePill label={brands.find((b) => b.id === filters.brandId)?.name ?? "Brand"} onRemove={() => { const n={...filters,brandId:""}; setFilters(n); applyFilters(n); }} />
              )}
              {filters.storeId && (
                <ActivePill label={stores.find((s) => s.id === filters.storeId)?.name ?? "Store"} onRemove={() => { const n={...filters,storeId:""}; setFilters(n); applyFilters(n); }} />
              )}
              {(filters.minPrice || filters.maxPrice) && (
                <ActivePill label={`PKR ${filters.minPrice || "0"} – ${filters.maxPrice || "∞"}`} onRemove={() => { const n={...filters,minPrice:"",maxPrice:""}; setFilters(n); applyFilters(n); }} />
              )}
              {filters.rating && (
                <ActivePill label={`${filters.rating}★ & up`} onRemove={() => { const n={...filters,rating:""}; setFilters(n); applyFilters(n); }} />
              )}
              {filters.onSale    && <ActivePill label="On Sale"  onRemove={() => { const n={...filters,onSale:false};    setFilters(n); applyFilters(n); }} />}
              {filters.inStock   && <ActivePill label="In Stock" onRemove={() => { const n={...filters,inStock:false};   setFilters(n); applyFilters(n); }} />}
              {filters.featured  && <ActivePill label="Featured" onRemove={() => { const n={...filters,featured:false};  setFilters(n); applyFilters(n); }} />}
            </div>
          )}
        </div>{/* /container */}
      </div>{/* /sticky toolbar */}

      {/* ── Sidebar + Grid ───────────────────────── */}
      <div className="container mx-auto px-4 max-w-7xl py-6 flex gap-6 items-start">

        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-60 shrink-0 self-start sticky top-[57px] max-h-[calc(100vh-57px)] overflow-y-auto bg-white rounded-2xl border border-zinc-100 px-4 py-5">
          <FilterSidebar
            filters={filters} setFilters={setFilters} onApply={applyFilters}
            categories={categories} brands={brands} stores={stores}
            priceMin={priceMin} priceMax={priceMax} totalActive={totalActive}
          />
        </aside>

        {/* Product Grid */}
        <div className="flex-1 min-w-0">
          {products.length === 0 && !isPending ? (
            <EmptyState onReset={() => { setFilters(DEFAULT_FILTERS); fetchProducts(DEFAULT_FILTERS, 1); }} />
          ) : (
            <div className={`grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 transition-opacity duration-150 ${isPending ? "opacity-50 pointer-events-none" : ""}`}>
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}

          {hasMore && !isPending && (
            <div className="mt-10 text-center">
              <button
                onClick={loadMore}
                className="inline-flex items-center gap-3 px-10 py-3.5 bg-brand-500 hover:bg-brand-600 text-white font-bold text-sm rounded-xl shadow-sm transition-all active:scale-95"
              >
                Load More Products
                <span className="bg-white/20 text-white text-xs font-black px-2 py-0.5 rounded-full">
                  {total - products.length} left
                </span>
              </button>
            </div>
          )}

          {isPending && (
            <div className="mt-10 flex justify-center">
              <div className="flex items-center gap-2 text-zinc-400 text-sm">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading products…
              </div>
            </div>
          )}
        </div>
      </div>{/* /container */}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────

function ActivePill({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 bg-brand-50 text-brand-700 border border-brand-200 text-xs font-semibold px-2.5 py-1 rounded-full">
      {label}
      <button onClick={onRemove} className="hover:text-brand-900 transition-colors ml-0.5">
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}

function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-col items-center py-24 text-center gap-4">
      <div className="h-16 w-16 rounded-2xl bg-zinc-100 flex items-center justify-center">
        <Package className="h-8 w-8 text-zinc-300" />
      </div>
      <div>
        <p className="font-bold text-zinc-700 text-lg">No products found</p>
        <p className="text-sm text-zinc-400 mt-1">Try adjusting your filters or search term.</p>
      </div>
      <button
        onClick={onReset}
        className="px-6 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-sm font-bold rounded-xl transition-colors"
      >
        Clear All Filters
      </button>
    </div>
  );
}
