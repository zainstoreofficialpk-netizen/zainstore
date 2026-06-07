import Link from "next/link";
import {
  ArrowRight,
  Truck,
  RotateCcw,
  ShieldCheck,
  Clock,
  Cpu,
  Shirt,
  Home,
  Sparkles,
  Trophy,
  BookOpen,
  Gamepad2,
  ShoppingBag,
  Utensils,
  Wrench,
  Baby,
  type LucideIcon,
} from "lucide-react";
import { db } from "@/lib/db";
import { HeroSection } from "@/components/storefront/hero-section";
import { FlashDeals } from "@/components/storefront/flash-deals";
import { AllProductsSection } from "@/components/storefront/all-products-section";
import { VendorCard, type VendorCardData } from "@/components/storefront/vendor-card";
import type { ProductCardData } from "@/components/storefront/product-card";

export const metadata = { title: "ZainStore.pk — Pakistan's Premier Marketplace" };

// ─── Helpers ─────────────────────────────────────────────────

type RawProduct = {
  id: string;
  name: string;
  slug: string;
  price: { toString(): string };
  salePrice: { toString(): string } | null;
  images: { url: string }[];
  store: { name: string; slug: string } | null;
  reviews: { rating: number }[];
};

function toCard(p: RawProduct): ProductCardData {
  const ratings = p.reviews.map((r) => r.rating);
  const avg =
    ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: Number(p.price),
    salePrice: p.salePrice ? Number(p.salePrice) : null,
    imageUrl: p.images[0]?.url ?? null,
    storeName: p.store?.name ?? null,
    storeSlug: p.store?.slug ?? null,
    rating: avg,
    reviewCount: ratings.length,
  };
}

const PRODUCT_SELECT = {
  id: true,
  name: true,
  slug: true,
  price: true,
  salePrice: true,
  images: { take: 1, select: { url: true }, orderBy: { sortOrder: "asc" as const } },
  store: { select: { name: true, slug: true } },
  reviews: { where: { status: "APPROVED" as const }, select: { rating: true } },
} as const;

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  electronics: Cpu,
  fashion: Shirt,
  clothing: Shirt,
  home: Home,
  beauty: Sparkles,
  sports: Trophy,
  books: BookOpen,
  gaming: Gamepad2,
  food: Utensils,
  tools: Wrench,
  baby: Baby,
  toys: Gamepad2,
  bags: ShoppingBag,
};

function resolveIcon(name: string): LucideIcon {
  const lower = name.toLowerCase();
  for (const [key, Icon] of Object.entries(CATEGORY_ICONS)) {
    if (lower.includes(key)) return Icon;
  }
  return ShoppingBag;
}

const CAT_PALETTES = [
  { card: "bg-blue-50 hover:bg-blue-100 border-blue-100", icon: "bg-blue-100 text-blue-600" },
  { card: "bg-violet-50 hover:bg-violet-100 border-violet-100", icon: "bg-violet-100 text-violet-600" },
  { card: "bg-rose-50 hover:bg-rose-100 border-rose-100", icon: "bg-rose-100 text-rose-600" },
  { card: "bg-green-50 hover:bg-green-100 border-green-100", icon: "bg-green-100 text-green-600" },
  { card: "bg-amber-50 hover:bg-amber-100 border-amber-100", icon: "bg-amber-100 text-amber-600" },
  { card: "bg-cyan-50 hover:bg-cyan-100 border-cyan-100", icon: "bg-cyan-100 text-cyan-600" },
  { card: "bg-indigo-50 hover:bg-indigo-100 border-indigo-100", icon: "bg-indigo-100 text-indigo-600" },
  { card: "bg-orange-50 hover:bg-orange-100 border-orange-100", icon: "bg-orange-100 text-orange-600" },
  { card: "bg-teal-50 hover:bg-teal-100 border-teal-100", icon: "bg-teal-100 text-teal-600" },
];

// Show 3 rows × 9 cols = 27, but we'll adapt to actual count
const CAT_INITIAL = 27;

// ─── Page ─────────────────────────────────────────────────────

export default async function ShopHomePage() {
  const now = new Date();

  const [
    sliderBanners,
    allCategories,
    flashDealsRaw,
    initialProductsRaw,
    totalProducts,
    storesRaw,
  ] = await Promise.all([
    // Hero slider banners
    db.banner.findMany({
      where: {
        placement: "slider",
        active: true,
        OR: [{ startsAt: null }, { startsAt: { lte: now } }],
        AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }],
      },
      orderBy: { createdAt: "asc" },
    }),

    // All top-level categories (with children for sidebar flyout)
    db.category.findMany({
      where: { parentId: null },
      orderBy: { name: "asc" },
      include: {
        children: {
          select: { id: true, name: true, slug: true },
          orderBy: { name: "asc" },
          take: 12,
        },
      },
    }),

    // Flash deals
    db.product.findMany({
      where: { status: "ACTIVE", salePrice: { not: null } },
      orderBy: { viewCount: "desc" },
      take: 24,
      select: PRODUCT_SELECT,
    }),

    // Initial products batch (page 1)
    db.product.findMany({
      where: { status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
      take: 40,
      select: PRODUCT_SELECT,
    }),

    // Total product count for Load More
    db.product.count({ where: { status: "ACTIVE" } }),

    // Vendor stores
    db.store.findMany({
      where: { vacationMode: false },
      take: 8,
      include: {
        _count: { select: { products: { where: { status: "ACTIVE" } } } },
        vendor: { include: { trustScore: { select: { overallScore: true } } } },
      },
    }),
  ]);

  const flashDeals = flashDealsRaw.map(toCard);
  const initialProducts = initialProductsRaw.map(toCard);

  const heroCategories = allCategories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    children: c.children,
  }));

  const stores: VendorCardData[] = storesRaw.map((s) => ({
    id: s.id,
    name: s.name,
    slug: s.slug,
    logoUrl: s.logoUrl,
    description: s.description,
    productCount: s._count.products,
    rating: s.vendor.trustScore?.overallScore
      ? Number(s.vendor.trustScore.overallScore)
      : 0,
  }));

  return (
    <div className="pb-6">

      {/* ─── Hero: category sidebar + full-width slider ─── */}
      <HeroSection
        slides={sliderBanners.map((b) => ({
          id: b.id,
          title: b.title,
          imageUrl: b.imageUrl,
          linkUrl: b.linkUrl,
        }))}
        categories={heroCategories}
      />

      {/* ─── Trust Badges ─── */}
      <div className="bg-white border-b border-zinc-100">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-zinc-100">
            {(
              [
                { Icon: Truck, title: "Free Shipping", desc: "On orders over PKR 2,000" },
                { Icon: RotateCcw, title: "Easy Returns", desc: "30-day hassle-free returns" },
                { Icon: ShieldCheck, title: "Secure Payments", desc: "SSL encrypted checkout" },
                { Icon: Clock, title: "Fast Delivery", desc: "2–5 business days" },
              ] as { Icon: LucideIcon; title: string; desc: string }[]
            ).map(({ Icon, title, desc }) => (
              <div key={title} className="flex items-center gap-3 px-5 py-3.5">
                <div className="h-9 w-9 rounded-xl bg-brand-50 flex items-center justify-center shrink-0">
                  <Icon className="text-brand-500" style={{ height: "1.1rem", width: "1.1rem" }} />
                </div>
                <div>
                  <p className="text-xs font-bold text-zinc-800 leading-tight">{title}</p>
                  <p className="text-[10px] text-zinc-400 mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Browse by Category ─── */}
      {allCategories.length > 0 && (
        <CategoryShowcase categories={allCategories} initialShow={CAT_INITIAL} />
      )}

      {/* ─── Flash Deals ─── */}
      <FlashDeals products={flashDeals} />

      {/* ─── All Products with Load More ─── */}
      <AllProductsSection initialProducts={initialProducts} total={totalProducts} />

      {/* ─── Top Vendor Stores ─── */}
      <section className="bg-zinc-50 border-t border-zinc-100">
        <div className="container mx-auto px-4 max-w-7xl py-10">
          <div className="flex items-center justify-between mb-7">
            <div>
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-0.5">
                Our Sellers
              </p>
              <h2 className="text-2xl font-black text-zinc-900">Top Vendor Stores</h2>
            </div>
            <Link
              href="/shop/stores"
              className="flex items-center gap-1.5 text-sm font-semibold text-brand-500 hover:text-brand-600 transition-colors"
            >
              All Stores <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {stores.map((s) => (
              <VendorCard key={s.id} vendor={s} />
            ))}
            {/* Become a Vendor CTA */}
            <Link
              href="/register/vendor"
              className="group block bg-gradient-to-br from-brand-500 to-brand-400 rounded-2xl p-5 hover:shadow-xl transition-all"
            >
              <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center mb-3">
                <ShoppingBag className="h-6 w-6 text-white" />
              </div>
              <p className="font-black text-white text-base leading-tight mb-1">Open Your Store</p>
              <p className="text-white/75 text-xs leading-relaxed mb-4">
                Join thousands of vendors selling on ZainStore.pk — Pakistan&apos;s fastest growing marketplace.
              </p>
              <span className="inline-flex items-center gap-1.5 bg-white text-brand-600 text-xs font-black px-4 py-2 rounded-xl group-hover:bg-zinc-50 transition-colors">
                Start Selling <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Why ZainStore ─── */}
      <section className="bg-white border-t border-zinc-100 py-12">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="text-center mb-10">
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">
              Why Choose Us
            </p>
            <h2 className="text-2xl font-black text-zinc-900 mb-2">
              Pakistan&apos;s Most Trusted Marketplace
            </h2>
            <p className="text-sm text-zinc-500 max-w-md mx-auto">
              ZainStore.pk connects buyers with verified vendors across Pakistan.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {(
              [
                { Icon: ShieldCheck, color: "bg-green-50 text-green-600", title: "Verified Vendors Only", desc: "Every seller is reviewed and approved before listing products." },
                { Icon: RotateCcw, color: "bg-blue-50 text-blue-600", title: "Buyer Protection", desc: "Our protection program covers every purchase on the platform." },
                { Icon: Truck, color: "bg-brand-50 text-brand-600", title: "Nationwide Delivery", desc: "Delivering to all major cities and towns across Pakistan." },
              ] as { Icon: LucideIcon; color: string; title: string; desc: string }[]
            ).map(({ Icon, color, title, desc }) => (
              <div key={title} className="flex flex-col items-center text-center p-7 rounded-2xl bg-zinc-50">
                <div className={`rounded-2xl flex items-center justify-center mb-4 ${color}`} style={{ height: "3.25rem", width: "3.25rem" }}>
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-zinc-900 mb-2">{title}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

// ─── Category Showcase (Server Component, client toggle via "use client" wrapper) ─

function CategoryShowcase({
  categories,
  initialShow,
}: {
  categories: { id: string; name: string; slug: string }[];
  initialShow: number;
}) {
  const hasMore = categories.length > initialShow;
  const displayed = categories.slice(0, initialShow);

  return (
    <section className="container mx-auto px-4 max-w-7xl py-8">
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-0.5">Browse</p>
          <h2 className="text-xl font-black text-zinc-900">Shop by Category</h2>
        </div>
        <Link href="/shop/categories" className="flex items-center gap-1.5 text-sm font-semibold text-brand-500 hover:text-brand-600 transition-colors">
          All Categories <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* 3-row grid: 4 cols mobile → 6 tablet → 9 desktop */}
      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-9 gap-3">
        {displayed.map((cat, i) => {
          const Icon = resolveIcon(cat.name);
          const p = CAT_PALETTES[i % CAT_PALETTES.length];
          return (
            <Link
              key={cat.id}
              href={`/shop/category/${cat.slug}`}
              className={`group flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all hover:shadow-md text-center ${p.card}`}
            >
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${p.icon}`}>
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-bold text-zinc-700 group-hover:text-zinc-900 leading-tight">
                {cat.name}
              </span>
            </Link>
          );
        })}
      </div>

      {hasMore && (
        <div className="mt-5 text-center">
          <Link
            href="/shop/categories"
            className="inline-flex items-center gap-2 px-6 py-2.5 border border-zinc-200 hover:border-brand-400 text-sm font-semibold text-zinc-600 hover:text-brand-600 rounded-xl transition-all"
          >
            View More Categories ({categories.length - initialShow} more){" "}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </section>
  );
}
