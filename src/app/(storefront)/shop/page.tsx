import type { Metadata } from "next";
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
  Flame,
  Zap,
  Tag,
  type LucideIcon,
} from "lucide-react";
import { db } from "@/lib/db";
import { HeroSection } from "@/components/storefront/hero-section";
import { FlashDeals } from "@/components/storefront/flash-deals";
import { AllProductsSection } from "@/components/storefront/all-products-section";
import { getFeaturedStores } from "@/lib/storefront/store-data";
import { HomepageVendorSection } from "@/components/storefront/homepage-vendor-section";
import type { ProductCardData } from "@/components/storefront/product-card";

export const metadata: Metadata = {
  title: "ZainStore.pk — Shop Online in Pakistan | Best Deals on Electronics, Fashion & More",
  description: "Discover thousands of products from verified sellers across Pakistan. Shop electronics, fashion, beauty, home & more with fast delivery and secure payments.",
  keywords: ["online shopping Pakistan", "buy electronics Pakistan", "fashion online Pakistan", "ZainStore deals", "best prices Pakistan"],
  alternates: { canonical: "https://zainstore.pk/shop" },
  openGraph: {
    title: "ZainStore.pk — Shop Online in Pakistan",
    description: "Thousands of products from verified sellers. Electronics, fashion, beauty & more — delivered fast across Pakistan.",
    url: "https://zainstore.pk/shop",
    siteName: "ZainStore.pk",
    type: "website",
    images: [{ url: "/og-default.jpg", width: 1200, height: 630, alt: "ZainStore.pk — Shop Online in Pakistan" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "ZainStore.pk — Shop Online in Pakistan",
    description: "Thousands of products from verified sellers. Delivered fast across Pakistan.",
    images: ["/og-default.jpg"],
  },
};

// ─── Helpers ─────────────────────────────────────────────────

type RawProduct = {
  id: string;
  name: string;
  slug: string;
  vendorId: string | null;
  price: { toString(): string };
  salePrice: { toString(): string } | null;
  images: { url: string }[];
  store: { id: string; name: string; slug: string } | null;
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
    storeId: p.store?.id ?? null,
    vendorId: p.vendorId ?? null,
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
  vendorId: true,
  images: { take: 1, select: { url: true }, orderBy: { sortOrder: "asc" as const } },
  store: { select: { id: true, name: true, slug: true } },
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

// Show 2 rows × 9 cols = 18 (at widest breakpoint)
const CAT_INITIAL = 18;

// ─── Page ─────────────────────────────────────────────────────

export default async function ShopHomePage() {
  const now = new Date();

  const [
    sliderBanners,
    allCategories,
    flashDealsRaw,
    initialProductsRaw,
    totalProducts,
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
      select: {
        id: true, name: true, slug: true, imageUrl: true,
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

  ]);

  const flashDeals = flashDealsRaw.map(toCard);
  const initialProducts = initialProductsRaw.map(toCard);

  const heroCategories = allCategories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    children: c.children,
  }));

  const featuredStores = await getFeaturedStores(8);

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

      {/* ─── Trust Badges — desktop only ─── */}
      <div className="hidden sm:block bg-white border-b border-zinc-100">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-zinc-100 divide-x divide-y sm:divide-y-0">
            {(
              [
                { Icon: Truck, title: "Fast Delivery", desc: "2–5 business days nationwide" },
                { Icon: RotateCcw, title: "Easy Returns", desc: "30-day hassle-free returns" },
                { Icon: ShieldCheck, title: "Secure Payments", desc: "SSL encrypted checkout" },
                { Icon: Clock, title: "Order Tracking", desc: "Track your order anytime" },
              ] as { Icon: LucideIcon; title: string; desc: string }[]
            ).map(({ Icon, title, desc }) => (
              <div key={title} className="flex items-center gap-2.5 px-3 py-3 sm:px-5 sm:py-3.5">
                <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-brand-50 flex items-center justify-center shrink-0">
                  <Icon className="text-brand-500 h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] sm:text-xs font-bold text-zinc-800 leading-tight truncate">{title}</p>
                  <p className="text-[9px] sm:text-[10px] text-zinc-400 mt-0.5 truncate">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Today's Deals Banner ─── */}
      <TodayDealsBanner />

      {/* ─── Browse by Category — desktop only ─── */}
      {allCategories.length > 0 && (
        <div className="hidden sm:block">
          <CategoryShowcase
            categories={allCategories.map(c => ({ id: c.id, name: c.name, slug: c.slug, imageUrl: c.imageUrl ?? null }))}
            initialShow={CAT_INITIAL}
          />
        </div>
      )}

      {/* ─── Flash Deals ─── */}
      <FlashDeals products={flashDeals} />

      {/* ─── All Products with Load More ─── */}
      <AllProductsSection initialProducts={initialProducts} total={totalProducts} />

      {/* ─── Featured Vendor Stores ─── */}
      <HomepageVendorSection stores={featuredStores} />

      {/* ─── Why ZainStore — desktop only ─── */}
      <section className="hidden sm:block bg-white border-t border-zinc-100 py-12">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="text-center mb-10">
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">
              Why Choose Us
            </p>
            <h2 className="text-2xl font-black text-zinc-900 mb-2">
              Why Millions of Shoppers Choose ZainStore.pk
            </h2>
            <p className="text-sm text-zinc-500 max-w-md mx-auto">
              The easiest way to shop online in Pakistan — great prices, fast delivery, and buyer protection on every order.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {(
              [
                { Icon: ShieldCheck, color: "bg-green-50 text-green-600", title: "100% Safe Shopping", desc: "Every order is covered by our buyer protection — if it's wrong, we make it right." },
                { Icon: RotateCcw, color: "bg-blue-50 text-blue-600", title: "Easy Returns", desc: "Changed your mind? Return within 7 days, no questions asked." },
                { Icon: Truck, color: "bg-brand-50 text-brand-600", title: "Fast Nationwide Delivery", desc: "Order today and receive your package at your doorstep across Pakistan." },
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

// ─── Today's Deals Banner ────────────────────────────────────

function TodayDealsBanner() {
  return (
    <div className="container mx-auto px-4 max-w-7xl py-4">
      <div className="bg-gradient-to-r from-red-600 via-red-500 to-orange-500 rounded-2xl px-4 sm:px-6 py-3.5 flex items-center gap-3 shadow-md">

        {/* Icon */}
        <div className="h-9 w-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
          <Flame className="h-4 w-4 text-white fill-white" />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-white font-black text-sm sm:text-base leading-tight">
            Today&apos;s Deals — Up to 70% Off!
          </p>
          <p className="text-white/75 text-[10px] sm:text-xs mt-0.5 hidden sm:block">
            Flash sales, hot deals &amp; exclusive discounts across all categories
          </p>
        </div>

        {/* Chips — desktop only */}
        <div className="hidden lg:flex items-center gap-2 shrink-0">
          {(
            [
              { icon: Zap,   label: "Flash Deals"   },
              { icon: Flame, label: "Up to 70% Off" },
              { icon: Tag,   label: "Hot Deals"     },
            ] as { icon: LucideIcon; label: string }[]
          ).map(({ icon: Icon, label }) => (
            <span key={label} className="inline-flex items-center gap-1.5 bg-white/15 text-white text-[11px] font-bold px-2.5 py-1 rounded-full border border-white/20">
              <Icon className="h-3 w-3" />
              {label}
            </span>
          ))}
        </div>

        {/* CTA */}
        <Link
          href="/shop/sale"
          className="shrink-0 inline-flex items-center gap-1.5 bg-white text-red-600 hover:bg-yellow-50 font-black text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl transition-colors shadow-sm"
        >
          Shop Deals
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}

// ─── Category Showcase ────────────────────────────────────────

function CategoryShowcase({
  categories,
  initialShow,
}: {
  categories: { id: string; name: string; slug: string; imageUrl: string | null }[];
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

      {/* Category grid: 3 cols mobile → 4 sm → 6 md → 9 xl */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-9 gap-2.5 sm:gap-3">
        {displayed.map((cat, i) => {
          const Icon = resolveIcon(cat.name);
          const p = CAT_PALETTES[i % CAT_PALETTES.length];
          return (
            <Link
              key={cat.id}
              href={`/shop/category/${cat.slug}`}
              className="group flex flex-col items-center gap-2 text-center active:scale-95 transition-transform"
            >
              {/* Image thumbnail */}
              <div className="relative w-full aspect-square rounded-2xl overflow-hidden border border-zinc-100 shadow-sm group-hover:shadow-md transition-shadow bg-zinc-100">
                {cat.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={cat.imageUrl}
                    alt={cat.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                ) : (
                  <div className={`w-full h-full flex items-center justify-center ${p.icon}`}>
                    <Icon className="h-7 w-7" />
                  </div>
                )}
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              </div>
              {/* Name below image */}
              <span className="text-[10px] sm:text-[11px] font-bold text-zinc-700 group-hover:text-brand-600 leading-tight line-clamp-2 transition-colors px-0.5">
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
