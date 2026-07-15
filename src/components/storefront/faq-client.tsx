"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, HelpCircle, Search } from "lucide-react";

export type FaqCategory = {
  category: string;
  color: string;
  items: { q: string; a: string }[];
};

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`border border-zinc-100 rounded-xl overflow-hidden transition-all ${open ? "shadow-sm" : ""}`}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-zinc-50 transition-colors"
      >
        <span className={`text-sm font-semibold leading-snug ${open ? "text-brand-600" : "text-zinc-800"}`}>{q}</span>
        <ChevronDown className={`h-4 w-4 text-zinc-400 shrink-0 transition-transform duration-200 ${open ? "rotate-180 text-brand-500" : ""}`} />
      </button>
      {open && (
        <div className="px-5 pb-4">
          <div className="border-t border-zinc-50 pt-3">
            <p className="text-sm text-zinc-600 leading-relaxed">{a}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export function FaqPageClient({ faqs }: { faqs: FaqCategory[] }) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const filtered = faqs.map((cat) => ({
    ...cat,
    items: cat.items.filter(
      (item) =>
        (activeCategory === "All" || cat.category === activeCategory) &&
        (search === "" ||
          item.q.toLowerCase().includes(search.toLowerCase()) ||
          item.a.toLowerCase().includes(search.toLowerCase()))
    ),
  })).filter((cat) => cat.items.length > 0);

  const categories = ["All", ...faqs.map((c) => c.category)];

  return (
    <div className="min-h-screen bg-zinc-50">

      {/* ── Hero ── */}
      <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 text-white">
        <div className="container mx-auto px-4 max-w-7xl py-12">
          <nav className="flex items-center gap-1.5 text-xs text-white/50 mb-4">
            <Link href="/shop" className="hover:text-white transition-colors">Home</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-white/80 font-semibold">FAQs</span>
          </nav>
          <div className="flex items-center gap-4 mb-4">
            <div className="h-12 w-12 bg-brand-500 rounded-2xl flex items-center justify-center shrink-0">
              <HelpCircle className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-black">Frequently Asked Questions</h1>
              <p className="text-white/60 text-sm mt-1">Find quick answers to common questions</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative max-w-lg mt-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search questions…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white text-zinc-800 placeholder-zinc-400 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-7xl py-10">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* Sidebar */}
          <aside className="lg:w-56 shrink-0">
            <div className="bg-white rounded-2xl border border-zinc-100 p-4 sticky top-4">
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3">Categories</p>
              <div className="space-y-1">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
                      activeCategory === cat
                        ? "bg-brand-50 text-brand-700"
                        : "text-zinc-600 hover:bg-zinc-50"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t border-zinc-100">
                <p className="text-xs font-bold text-zinc-700 mb-2">Still need help?</p>
                <Link
                  href="/shop/contact"
                  className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold px-3 py-2.5 rounded-xl transition-colors"
                >
                  Contact Support →
                </Link>
              </div>
            </div>
          </aside>

          {/* FAQs */}
          <div className="flex-1 min-w-0 space-y-8">
            {filtered.length === 0 ? (
              <div className="bg-white rounded-2xl border border-zinc-100 p-12 text-center">
                <HelpCircle className="h-10 w-10 text-zinc-200 mx-auto mb-3" />
                <p className="font-bold text-zinc-600">No results found</p>
                <p className="text-sm text-zinc-400 mt-1">Try different keywords or <Link href="/shop/contact" className="text-brand-500">contact us</Link></p>
              </div>
            ) : filtered.map((cat) => (
              <div key={cat.category}>
                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-xs font-black px-3 py-1 rounded-full border ${cat.color}`}>{cat.category}</span>
                  <span className="text-xs text-zinc-400">{cat.items.length} questions</span>
                </div>
                <div className="space-y-2">
                  {cat.items.map((item) => (
                    <FaqItem key={item.q} q={item.q} a={item.a} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
