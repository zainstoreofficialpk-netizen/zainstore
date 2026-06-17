import type { Metadata } from "next";
import Link from "next/link";
import { Zap, Flame, Tag, ChevronRight } from "lucide-react";
import { db } from "@/lib/db";
import { SalePage } from "@/components/storefront/sale-page";
import type { Prisma } from "@prisma/client";

export const metadata: Metadata = {
  title: "Mega Sale — Up to 70% Off | ZainStore.pk",
  description: "Shop the biggest sale on ZainStore.pk. Up to 70% off on electronics, fashion, home & more. Limited time deals across all categories.",
  alternates: { canonical: "https://zainstore.pk/shop/sale" },
  openGraph: {
    title: "Mega Sale — Up to 70% Off | ZainStore.pk",
    description: "Shop the biggest sale on ZainStore.pk. Up to 70% off on electronics, fashion, home & more.",
    url: "https://zainstore.pk/shop/sale",
    siteName: "ZainStore.pk",
    type: "website",
    images: [{ url: "/og-default.jpg", width: 1200, height: 630, alt: "ZainStore.pk Mega Sale" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Mega Sale — Up to 70% Off | ZainStore.pk",
    description: "Shop the biggest sale on ZainStore.pk. Up to 70% off on electronics, fashion, home & more.",
    images: ["/og-default.jpg"],
  },
};

const PROMO_CHIPS = [
  { icon: Zap,   label: "Flash Deals",      color: "bg-white/20 text-white" },
  { icon: Flame, label: "Up to 70% Off",    color: "bg-white/20 text-white" },
  { icon: Tag,   label: "Exclusive Deals",  color: "bg-white/20 text-white" },
];

export default async function SalePageRoute({
  searchParams,
}: {
  searchParams: { category?: string; store?: string };
}) {
  const initialCategoryId = searchParams.category ?? "";
  const initialStoreId    = searchParams.store    ?? "";

  const baseWhere = { status: "ACTIVE" as const, salePrice: { not: null } } as Prisma.ProductWhereInput;
  const filteredWhere: Prisma.ProductWhereInput = {
    ...baseWhere,
    ...(initialCategoryId ? { categoryId: initialCategoryId } : {}),
    ...(initialStoreId    ? { storeId:    initialStoreId    } : {}),
  };

  const [
    categoriesRaw,
    storesRaw,
    priceAgg,
    initialRaw,
    totalSale,
    totalProducts,
    totalStores,
  ] = await Promise.all([
    db.category.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { products: { where: { status: "ACTIVE", salePrice: { not: null } } } } } },
    }),
    db.store.findMany({
      where: { vacationMode: false, vendor: { status: "ACTIVE" } },
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true },
    }),
    db.product.aggregate({
      where: baseWhere,
      _min: { salePrice: true },
      _max: { salePrice: true },
    }),
    db.product.findMany({
      where: filteredWhere,
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      take: 24,
      select: {
        id: true, name: true, slug: true,
        price: true, salePrice: true,
        stockStatus: true, featured: true, vendorId: true,
        category: { select: { id: true, name: true } },
        store:    { select: { id: true, name: true, slug: true } },
        images:   { take: 1, select: { url: true }, orderBy: { sortOrder: "asc" as const } },
        reviews:  { where: { status: "APPROVED" as const }, select: { rating: true } },
      },
    }),
    db.product.count({ where: filteredWhere }),
    db.product.count({ where: { status: "ACTIVE" } }),
    db.store.count({ where: { vacationMode: false, vendor: { status: "ACTIVE" } } }),
  ]);

  const categories = categoriesRaw
    .filter((c) => c._count.products > 0)
    .map((c) => ({ id: c.id, name: c.name, slug: c.slug, productCount: c._count.products }));

  const stores = storesRaw;

  const priceMin = Math.floor(Number(priceAgg._min.salePrice ?? 0));
  const priceMax = Math.ceil(Number(priceAgg._max.salePrice ?? 50000));

  const initialProducts = initialRaw.map((p) => {
    const ratings   = p.reviews.map((r) => r.rating);
    const avgRating = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
    const price     = Number(p.price);
    const salePr    = Number(p.salePrice!);
    const discount  = price > 0 ? Math.round((1 - salePr / price) * 100) : 0;
    return {
      id: p.id, name: p.name, slug: p.slug,
      price, salePrice: salePr, discount,
      imageUrl:     p.images[0]?.url ?? null,
      storeName:    p.store?.name    ?? null,
      storeSlug:    p.store?.slug    ?? null,
      storeId:      p.store?.id      ?? null,
      vendorId:     p.vendorId,
      categoryName: p.category?.name ?? null,
      rating:       avgRating,
      reviewCount:  ratings.length,
      inStock:      p.stockStatus === "IN_STOCK",
      backorder:    p.stockStatus === "BACKORDER",
      featured:     p.featured,
    };
  });

  // Sort initial products by highest discount for the first paint
  initialProducts.sort((a, b) => b.discount - a.discount);

  const salePercent = totalProducts > 0 ? Math.round((totalSale / totalProducts) * 100) : 0;

  return (
    <div className="min-h-screen">

      {/* ── Hero Banner ──────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-red-700 via-red-600 to-orange-500">
        {/* Decorative background blobs */}
        <div className="absolute -top-20 -right-20 h-80 w-80 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute top-8 left-1/3 h-40 w-40 rounded-full bg-orange-400/20 pointer-events-none" />

        <div className="container mx-auto px-4 max-w-7xl py-10 sm:py-14 relative">

          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs text-white/60 mb-6">
            <Link href="/shop" className="hover:text-white transition-colors">Home</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-white font-semibold">Mega Sale</span>
          </nav>

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">

            {/* Left: Title + chips */}
            <div className="flex-1">
              {/* Label */}
              <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full mb-4">
                <Flame className="h-3 w-3 fill-white" />
                Mega Sale
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-none mb-3">
                MEGA
                <br />
                <span className="text-yellow-300">SALE</span>
              </h1>
              <p className="text-white/80 text-base sm:text-lg font-medium mb-6 max-w-md">
                Up to <span className="text-yellow-300 font-black">70% off</span> on thousands of products
                across all categories. Shop now and save big!
              </p>

              {/* Promo chips */}
              <div className="flex flex-wrap gap-2">
                {PROMO_CHIPS.map(({ icon: Icon, label, color }) => (
                  <span key={label} className={`inline-flex items-center gap-1.5 ${color} text-xs font-bold px-3 py-1.5 rounded-full backdrop-blur-sm border border-white/20`}>
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </span>
                ))}
              </div>
            </div>

            {/* Right: Stats */}
            <div className="flex flex-col items-start lg:items-end gap-5">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: totalSale.toLocaleString(),     label: "Products On Sale" },
                  { value: `${salePercent}%`,               label: "Items Discounted"  },
                  { value: totalStores.toLocaleString(),    label: "Active Stores"    },
                ].map(({ value, label }) => (
                  <div key={label} className="text-center bg-white/10 backdrop-blur-sm rounded-xl px-3 py-2.5 border border-white/20">
                    <p className="text-xl sm:text-2xl font-black text-white leading-none">{value}</p>
                    <p className="text-[9px] sm:text-[10px] text-white/60 font-semibold mt-0.5 leading-tight">{label}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── Category quick-links ─────────────────────────── */}
      {categories.length > 0 && (
        <div className="bg-white border-b border-zinc-100">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="flex items-center gap-2 overflow-x-auto py-3 scrollbar-none">
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest whitespace-nowrap mr-1">
                Shop by:
              </span>
              {categories.slice(0, 12).map((cat) => (
                <Link
                  key={cat.id}
                  href={`/shop/sale?category=${cat.id}`}
                  className="inline-flex items-center gap-1.5 whitespace-nowrap px-3 py-1.5 bg-zinc-50 hover:bg-accent-50 border border-zinc-200 hover:border-accent-300 text-xs font-semibold text-zinc-700 hover:text-accent-600 rounded-full transition-colors"
                >
                  {cat.name}
                  <span className="bg-accent-100 text-accent-700 text-[9px] font-bold px-1.5 py-0.5 rounded-full">{cat.productCount}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Products (client component) ──────────────────── */}
      <SalePage
        initialProducts={initialProducts}
        initialTotal={totalSale}
        categories={categories}
        stores={stores}
        priceMin={priceMin}
        priceMax={priceMax}
        initialCategoryId={initialCategoryId}
        initialStoreId={initialStoreId}
      />
    </div>
  );
}
