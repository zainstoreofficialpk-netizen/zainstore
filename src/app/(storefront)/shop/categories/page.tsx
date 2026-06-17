import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Tag, Package, ShoppingBag, Cpu, Shirt, Home, Sparkles, Trophy, BookOpen, Gamepad2, Utensils, Wrench, Baby, type LucideIcon } from "lucide-react";
import { db } from "@/lib/db";

export const metadata: Metadata = {
  title: "All Categories — ZainStore.pk",
  description: "Browse all product categories on ZainStore.pk — electronics, fashion, beauty, grocery and more.",
};

// ─── Icon + Colour mapping ────────────────────────────────────

const ICON_MAP: Record<string, LucideIcon> = {
  electronics: Cpu,
  fashion: Shirt,
  clothing: Shirt,
  clothes: Shirt,
  home: Home,
  kitchen: Utensils,
  beauty: Sparkles,
  facial: Sparkles,
  skin: Sparkles,
  "make up": Sparkles,
  makeup: Sparkles,
  hair: Sparkles,
  perfume: Sparkles,
  sports: Trophy,
  books: BookOpen,
  gaming: Gamepad2,
  food: Utensils,
  grocery: Utensils,
  tools: Wrench,
  baby: Baby,
  kids: Baby,
  toys: Gamepad2,
  bags: ShoppingBag,
  jewel: ShoppingBag,
  supplement: Trophy,
  health: Trophy,
  essential: Sparkles,
  dry: Utensils,
  nut: Utensils,
};

const PALETTES = [
  { bg: "bg-violet-50",  border: "border-violet-100", icon: "bg-violet-100 text-violet-600", text: "text-violet-700",  badge: "bg-violet-100 text-violet-600" },
  { bg: "bg-rose-50",    border: "border-rose-100",   icon: "bg-rose-100 text-rose-600",     text: "text-rose-700",    badge: "bg-rose-100 text-rose-600" },
  { bg: "bg-amber-50",   border: "border-amber-100",  icon: "bg-amber-100 text-amber-600",   text: "text-amber-700",   badge: "bg-amber-100 text-amber-600" },
  { bg: "bg-emerald-50", border: "border-emerald-100",icon: "bg-emerald-100 text-emerald-600",text:"text-emerald-700", badge: "bg-emerald-100 text-emerald-600" },
  { bg: "bg-blue-50",    border: "border-blue-100",   icon: "bg-blue-100 text-blue-600",     text: "text-blue-700",    badge: "bg-blue-100 text-blue-600" },
  { bg: "bg-pink-50",    border: "border-pink-100",   icon: "bg-pink-100 text-pink-600",     text: "text-pink-700",    badge: "bg-pink-100 text-pink-600" },
  { bg: "bg-teal-50",    border: "border-teal-100",   icon: "bg-teal-100 text-teal-600",     text: "text-teal-700",    badge: "bg-teal-100 text-teal-600" },
  { bg: "bg-orange-50",  border: "border-orange-100", icon: "bg-orange-100 text-orange-600", text: "text-orange-700",  badge: "bg-orange-100 text-orange-600" },
  { bg: "bg-indigo-50",  border: "border-indigo-100", icon: "bg-indigo-100 text-indigo-600", text: "text-indigo-700",  badge: "bg-indigo-100 text-indigo-600" },
  { bg: "bg-cyan-50",    border: "border-cyan-100",   icon: "bg-cyan-100 text-cyan-600",     text: "text-cyan-700",    badge: "bg-cyan-100 text-cyan-600" },
];

function resolveIcon(name: string): LucideIcon {
  const lower = name.toLowerCase();
  for (const [key, Icon] of Object.entries(ICON_MAP)) {
    if (lower.includes(key)) return Icon;
  }
  return Tag;
}

// ─── Page ─────────────────────────────────────────────────────

export default async function CategoriesPage() {
  const categories = await db.category.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { products: { where: { status: "ACTIVE" } } } },
    },
  });

  const topLevel = categories.filter((c) => !c.parentId);
  const totalProducts = categories.reduce((sum, c) => sum + c._count.products, 0);

  return (
    <div className="min-h-screen bg-zinc-50">

      {/* ── Hero ── */}
      <div className="bg-white border-b border-zinc-100">
        <div className="container mx-auto px-4 max-w-7xl py-10 md:py-14">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs text-zinc-400 mb-5">
            <Link href="/shop" className="hover:text-zinc-700 transition-colors">Home</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-zinc-700 font-semibold">All Categories</span>
          </nav>

          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <p className="text-[10px] font-black text-brand-500 uppercase tracking-widest mb-1">Browse</p>
              <h1 className="text-3xl font-black text-zinc-900 leading-tight">All Categories</h1>
              <p className="text-sm text-zinc-400 mt-2">
                Shop from <span className="font-bold text-zinc-700">{totalProducts.toLocaleString()}</span> products across{" "}
                <span className="font-bold text-zinc-700">{topLevel.length}</span> categories.
              </p>
            </div>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-sm font-bold rounded-xl transition-colors shrink-0"
            >
              <ShoppingBag className="h-4 w-4" />
              Browse All Products
            </Link>
          </div>
        </div>
      </div>

      {/* ── Category Grid ── */}
      <div className="container mx-auto px-4 max-w-7xl py-8 md:py-10">

        {/* Big visual cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5">
          {topLevel.map((cat, i) => {
            const p = PALETTES[i % PALETTES.length];
            const Icon = resolveIcon(cat.name);

            return (
              <Link
                key={cat.id}
                href={`/shop/category/${cat.slug}`}
                className={`group relative flex flex-col items-center rounded-2xl border ${p.border} ${p.bg} overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200`}
              >
                {/* Image or icon square */}
                <div className="relative w-full aspect-square overflow-hidden">
                  {cat.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={cat.imageUrl}
                      alt={cat.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className={`w-full h-full flex items-center justify-center ${p.icon}`}>
                      <Icon className="h-12 w-12" />
                    </div>
                  )}
                  {/* Dark overlay on hover */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200" />
                </div>

                {/* Name + count */}
                <div className="w-full px-3 py-3 text-center">
                  <p className={`text-[12px] sm:text-[13px] font-black leading-snug line-clamp-2 group-hover:${p.text} transition-colors text-zinc-800`}>
                    {cat.name}
                  </p>
                  <span className={`inline-block mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full ${p.badge}`}>
                    {cat._count.products} items
                  </span>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Quick-links row */}
        <div className="mt-10 bg-white rounded-2xl border border-zinc-100 p-6">
          <p className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-4">Quick Browse</p>
          <div className="flex flex-wrap gap-2">
            {topLevel.map((cat, i) => {
              const p = PALETTES[i % PALETTES.length];
              return (
                <Link
                  key={cat.id}
                  href={`/shop/category/${cat.slug}`}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full border ${p.border} ${p.bg} text-xs font-semibold text-zinc-700 hover:shadow-sm transition-all`}
                >
                  {cat.name}
                  <span className={`text-[10px] font-black ${p.text}`}>{cat._count.products}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-8 bg-gradient-to-br from-brand-500 to-brand-400 rounded-2xl p-7 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-black text-white text-lg leading-tight">Can&apos;t find what you&apos;re looking for?</p>
            <p className="text-white/75 text-sm mt-1">Search across all {totalProducts.toLocaleString()} products on ZainStore.pk</p>
          </div>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 bg-white text-brand-600 font-black text-sm px-6 py-3 rounded-xl hover:bg-zinc-50 transition-colors shrink-0 shadow-sm"
          >
            Search All Products <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
