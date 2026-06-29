"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, X, Clock, Tag, ArrowRight } from "lucide-react";

const STORAGE_KEY = "zs_recent_searches";

type SearchResult = {
  products: { id: string; name: string; slug: string; price: number; imageUrl: string | null }[];
  categories: { id: string; name: string; slug: string }[];
};

function getRecent(): string[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]"); } catch { return []; }
}
function addRecent(term: string) {
  const list = [term, ...getRecent().filter((s) => s !== term)].slice(0, 6);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}
function removeRecent(term: string) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(getRecent().filter((s) => s !== term)));
}

export function SearchBar() {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const [popularCats, setPopularCats] = useState<{ id: string; name: string; slug: string }[]>([]);
  const router = useRouter();
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setRecent(getRecent()); }, []);

  useEffect(() => {
    fetch("/api/storefront/categories?limit=8")
      .then((r) => r.json())
      .then((d) => setPopularCats((Array.isArray(d) ? d : d.categories ?? []).slice(0, 8)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setFocused(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  useEffect(() => {
    if (query.length < 2) { setResults(null); return; }
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/storefront/search?q=${encodeURIComponent(query)}`);
        setResults(await res.json());
      } finally { setLoading(false); }
    }, 280);
    return () => clearTimeout(t);
  }, [query]);

  function go(term: string) {
    if (!term.trim()) return;
    addRecent(term.trim());
    setRecent(getRecent());
    setFocused(false);
    setQuery("");
    router.push(`/shop/search?q=${encodeURIComponent(term.trim())}`);
  }

  const open = focused;
  const hasQuery = query.length >= 2;

  return (
    <div ref={wrapperRef} className="relative w-full">
      {/* Input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onKeyDown={(e) => e.key === "Enter" && go(query)}
          placeholder="Search products, brands, categories…"
          className="w-full pl-10 pr-10 py-2.5 text-sm rounded-full border border-zinc-200 bg-zinc-50 focus:bg-white focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/20 transition-all"
        />
        {query && (
          <button onClick={() => setQuery("")} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-zinc-100 z-50 overflow-hidden max-w-full">
          {/* Default: recent + trending */}
          {!hasQuery && (
            <div className="p-4 space-y-4">
              {recent.length > 0 && (
                <div>
                  <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Recent</p>
                  {recent.map((term) => (
                    <div key={term} className="flex items-center justify-between group px-2 py-1.5 rounded-lg hover:bg-zinc-50">
                      <button onClick={() => go(term)} className="flex items-center gap-2.5 text-sm text-zinc-700 flex-1 text-left">
                        <Clock className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                        {term}
                      </button>
                      <button
                        onClick={() => { removeRecent(term); setRecent(getRecent()); }}
                        className="text-zinc-300 hover:text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {popularCats.length > 0 && (
                <div>
                  <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Popular Categories</p>
                  <div className="flex flex-wrap gap-2">
                    {popularCats.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => go(cat.name)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-50 hover:bg-brand-50 text-zinc-700 hover:text-brand-600 text-xs rounded-full border border-zinc-100 hover:border-brand-200 transition-colors"
                      >
                        <Tag className="h-3 w-3" />
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Results */}
          {hasQuery && (
            <div className="max-h-[400px] overflow-y-auto">
              {loading && (
                <div className="flex items-center justify-center py-8">
                  <div className="h-5 w-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              {!loading && results && (
                <div className="p-3">
                  {results.categories.length > 0 && (
                    <div className="mb-2">
                      <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider px-2 mb-1">Categories</p>
                      {results.categories.map((cat) => (
                        <button key={cat.id} onClick={() => go(cat.name)}
                          className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl hover:bg-zinc-50 text-sm text-zinc-700">
                          <Search className="h-3.5 w-3.5 text-zinc-400" />
                          {cat.name}
                          <span className="text-xs text-zinc-400 ml-1">in Categories</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {results.products.length > 0 && (
                    <div>
                      <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider px-2 mb-1">Products</p>
                      {results.products.map((p) => (
                        <button key={p.id} onClick={() => go(p.name)}
                          className="flex items-center justify-between w-full px-3 py-2 rounded-xl hover:bg-zinc-50 gap-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            {p.imageUrl
                              ? <img src={p.imageUrl} alt="" className="h-9 w-9 rounded-lg object-cover shrink-0 border border-zinc-100" />
                              : <div className="h-9 w-9 rounded-lg bg-zinc-100 shrink-0" />
                            }
                            <span className="text-sm text-zinc-800 truncate">{p.name}</span>
                          </div>
                          <span className="text-sm font-semibold text-brand-500 shrink-0">PKR {p.price.toLocaleString()}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {results.products.length === 0 && results.categories.length === 0 && (
                    <p className="text-center py-6 text-sm text-zinc-400">No results for &ldquo;{query}&rdquo;</p>
                  )}
                  {(results.products.length > 0 || results.categories.length > 0) && (
                    <button onClick={() => go(query)}
                      className="flex items-center gap-2 w-full justify-center py-3 text-sm font-medium text-brand-500 hover:text-brand-600 border-t border-zinc-100 mt-2">
                      See all results for &ldquo;{query}&rdquo; <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
