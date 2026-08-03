import Link from "next/link";
import { SearchX, Home, ShoppingBag, Store } from "lucide-react";
import { db } from "@/lib/db";
import { ProductStripSection } from "@/components/storefront/product-strip-section";
import type { ProductCardData } from "@/components/storefront/product-card";

export const metadata = {
  title: "Page Not Found",
  robots: { index: false, follow: true },
};

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
  _count: { orderItems: number };
};

function toCard(p: RawProduct): ProductCardData {
  const ratings = p.reviews.map((r) => r.rating);
  const avg = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
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
    soldCount: p._count.orderItems,
  };
}

export default async function StorefrontNotFound() {
  const popular = await db.product.findMany({
    where: { status: "ACTIVE" },
    orderBy: { viewCount: "desc" },
    take: 12,
    select: {
      id: true,
      name: true,
      slug: true,
      price: true,
      salePrice: true,
      vendorId: true,
      images: { take: 1, select: { url: true }, orderBy: { sortOrder: "asc" } },
      store: { select: { id: true, name: true, slug: true } },
      reviews: { where: { status: "APPROVED" }, select: { rating: true } },
      _count: { select: { orderItems: true } },
    },
  });

  return (
    <div>
      <section className="container mx-auto px-4 max-w-7xl py-16 sm:py-24 text-center">
        <div className="mx-auto h-16 w-16 rounded-2xl bg-brand-50 flex items-center justify-center mb-6">
          <SearchX className="h-8 w-8 text-brand-500" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-zinc-900">Page not found</h1>
        <p className="mt-2 text-sm sm:text-base text-zinc-500 max-w-md mx-auto">
          That page doesn&apos;t exist, or the product may have been removed. Here&apos;s where you can pick up instead.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-sm px-5 py-3 transition-colors"
          >
            <Home className="h-4 w-4" /> Go to Homepage
          </Link>
          <Link
            href="/shop/browse"
            className="flex items-center gap-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-bold text-sm px-5 py-3 transition-colors"
          >
            <ShoppingBag className="h-4 w-4" /> Browse All Products
          </Link>
          <Link
            href="/shop/stores"
            className="flex items-center gap-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-bold text-sm px-5 py-3 transition-colors"
          >
            <Store className="h-4 w-4" /> View All Stores
          </Link>
        </div>
      </section>

      {popular.length > 0 && (
        <ProductStripSection
          title="Popular Right Now"
          subtitle="You might like"
          variant="popular"
          products={popular.map(toCard)}
          seeAllHref="/shop/browse?sort=popular"
        />
      )}
    </div>
  );
}
