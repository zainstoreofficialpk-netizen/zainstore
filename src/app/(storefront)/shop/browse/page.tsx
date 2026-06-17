import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, ShoppingBag } from "lucide-react";
import { db } from "@/lib/db";
import { ShopBrowse } from "@/components/storefront/shop-browse";
import type { Prisma } from "@prisma/client";

export const metadata: Metadata = {
  title: "Shop All Products — ZainStore.pk",
  description: "Browse thousands of products from verified vendors across Pakistan. Filter by category, price, brand, rating and more.",
  alternates: { canonical: "https://zainstore.pk/shop/browse" },
  openGraph: {
    title: "Shop All Products — ZainStore.pk",
    description: "Browse thousands of products from verified vendors across Pakistan.",
    url: "https://zainstore.pk/shop/browse",
    siteName: "ZainStore.pk",
    type: "website",
  },
};

export default async function BrowsePage() {
  // ── Sidebar filter metadata ───────────────────────────────
  const [
    categoriesRaw,
    brands,
    storesRaw,
    priceAgg,
    initialRaw,
    total,
  ] = await Promise.all([
    db.category.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { products: { where: { status: "ACTIVE" } } } } },
    }),
    db.brand.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    db.store.findMany({
      where: { vacationMode: false, vendor: { status: "ACTIVE" } },
      orderBy: { name: "asc" },
      include: { _count: { select: { products: { where: { status: "ACTIVE" } } } } },
    }),
    db.product.aggregate({
      where: { status: "ACTIVE" },
      _min: { price: true },
      _max: { price: true },
    }),
    db.product.findMany({
      where: { status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
      take: 36,
      select: {
        id: true, name: true, slug: true, price: true, salePrice: true,
        stockStatus: true, featured: true, vendorId: true,
        category: { select: { id: true, name: true } },
        brand:    { select: { id: true, name: true } },
        images:   { take: 1, select: { url: true }, orderBy: { sortOrder: "asc" as const } },
        store:    { select: { id: true, name: true, slug: true } },
        reviews:  { where: { status: "APPROVED" as const }, select: { rating: true } },
      },
    }),
    db.product.count({ where: { status: "ACTIVE" } }),
  ]);

  const categories = categoriesRaw
    .filter((c) => c._count.products > 0)
    .map((c) => ({ id: c.id, name: c.name, slug: c.slug, productCount: c._count.products }));

  const stores = storesRaw
    .filter((s) => s._count.products > 0)
    .map((s) => ({ id: s.id, name: s.name, slug: s.slug, productCount: s._count.products }));

  const initialProducts = initialRaw.map((p) => {
    const ratings = p.reviews.map((r) => r.rating);
    const avg = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
    return {
      id: p.id, name: p.name, slug: p.slug,
      price: Number(p.price),
      salePrice: p.salePrice ? Number(p.salePrice) : null,
      imageUrl: p.images[0]?.url ?? null,
      storeName: p.store?.name ?? null,
      storeSlug: p.store?.slug ?? null,
      storeId: p.store?.id ?? null,
      vendorId: p.vendorId,
      categoryName: p.category?.name ?? null,
      brandName: p.brand?.name ?? null,
      rating: avg,
      reviewCount: ratings.length,
      inStock: p.stockStatus === "IN_STOCK",
      featured: p.featured,
    };
  });

  const priceMin = Math.floor(Number(priceAgg._min.price ?? 0));
  const priceMax = Math.ceil(Number(priceAgg._max.price ?? 50000));

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Page header */}
      <div className="bg-white border-b border-zinc-100">
        <div className="container mx-auto px-4 max-w-7xl py-4 flex items-center justify-between gap-4">
          <div>
            <nav className="flex items-center gap-1.5 text-xs text-zinc-400 mb-1">
              <Link href="/shop" className="hover:text-zinc-700 transition-colors">Home</Link>
              <ChevronRight className="h-3 w-3" />
              <span className="text-zinc-700 font-semibold">All Products</span>
            </nav>
            <h1 className="text-xl font-black text-zinc-900">Shop All Products</h1>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-sm text-zinc-500">
            <ShoppingBag className="h-4 w-4 text-brand-500" />
            <span><span className="font-bold text-zinc-800">{total.toLocaleString()}</span> products from <span className="font-bold text-zinc-800">{stores.length}</span> stores</span>
          </div>
        </div>
      </div>

      <ShopBrowse
        initialProducts={initialProducts}
        initialTotal={total}
        categories={categories}
        brands={brands}
        stores={stores}
        priceMin={priceMin}
        priceMax={priceMax}
      />
    </div>
  );
}
