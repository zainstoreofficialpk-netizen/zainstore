import type { Metadata } from "next";
import Link from "next/link";
import { Search, ArrowRight, PackageSearch } from "lucide-react";
import { db } from "@/lib/db";
import { ProductCard, type ProductCardData } from "@/components/storefront/product-card";

interface Props {
  searchParams: { q?: string };
}

export function generateMetadata({ searchParams }: Props): Metadata {
  const q = searchParams.q?.trim() ?? "";
  return {
    title: q ? `"${q}" — Search Results | ZainStore.pk` : "Search — ZainStore.pk",
    description: `Search results for "${q}" on ZainStore.pk`,
    robots: { index: false, follow: true },
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

function toCard(p: {
  id: string; name: string; slug: string;
  price: { toString(): string }; salePrice: { toString(): string } | null;
  vendorId: string | null;
  images: { url: string }[];
  store: { id: string; name: string; slug: string } | null;
  reviews: { rating: number }[];
}): ProductCardData {
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
    vendorId: p.vendorId ?? null,
    rating: avg,
    reviewCount: ratings.length,
  };
}

export default async function SearchPage({ searchParams }: Props) {
  const q = searchParams.q?.trim() ?? "";

  if (!q) {
    return (
      <div className="container mx-auto px-4 max-w-7xl py-20 text-center">
        <Search className="h-12 w-12 text-zinc-200 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-zinc-700 mb-2">What are you looking for?</h1>
        <p className="text-zinc-400 text-sm mb-6">Type something in the search bar above to find products.</p>
        <Link href="/shop/browse" className="inline-flex items-center gap-2 text-brand-500 font-semibold text-sm hover:underline">
          Browse all products <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  const terms = q.split(/\s+/).filter(Boolean);

  // Build OR conditions: each word must appear somewhere in name or description
  const whereClause = {
    status: "ACTIVE" as const,
    AND: terms.map((term) => ({
      OR: [
        { name: { contains: term, mode: "insensitive" as const } },
        { description: { contains: term, mode: "insensitive" as const } },
        { brand: { name: { contains: term, mode: "insensitive" as const } } },
        { category: { name: { contains: term, mode: "insensitive" as const } } },
        { store: { name: { contains: term, mode: "insensitive" as const } } },
      ],
    })),
  };

  const [rawProducts, total, relatedCategories] = await Promise.all([
    db.product.findMany({
      where: whereClause,
      orderBy: [{ featured: "desc" }, { viewCount: "desc" }, { createdAt: "desc" }],
      take: 60,
      select: PRODUCT_SELECT,
    }),
    db.product.count({ where: whereClause }),
    db.category.findMany({
      where: {
        name: { contains: q, mode: "insensitive" },
        parentId: null,
      },
      take: 4,
      select: { id: true, name: true, slug: true, imageUrl: true },
    }),
  ]);

  const products = rawProducts.map(toCard);

  return (
    <div className="bg-zinc-50 min-h-screen pb-20 md:pb-6">
      <div className="container mx-auto px-4 max-w-7xl py-6">

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-xs text-zinc-400 mb-2">
            <Link href="/shop" className="hover:text-brand-500 transition-colors">Home</Link>
            <span>/</span>
            <span>Search</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-zinc-900">
            {total > 0 ? (
              <>
                <span className="text-brand-500">{total.toLocaleString()}</span> results for &ldquo;{q}&rdquo;
              </>
            ) : (
              <>No results for &ldquo;{q}&rdquo;</>
            )}
          </h1>
        </div>

        {/* Matching categories row */}
        {relatedCategories.length > 0 && (
          <div className="mb-6">
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">Related Categories</p>
            <div className="flex flex-wrap gap-2">
              {relatedCategories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/shop/category/${cat.slug}`}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-zinc-200 hover:border-brand-400 hover:text-brand-600 rounded-full text-sm font-medium text-zinc-700 transition-colors"
                >
                  {cat.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={cat.imageUrl} alt="" className="h-4 w-4 rounded-full object-cover" />
                  )}
                  {cat.name}
                  <ArrowRight className="h-3 w-3" />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Results grid */}
        {products.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 sm:gap-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {total > 60 && (
              <div className="mt-8 text-center">
                <Link
                  href={`/shop/browse?search=${encodeURIComponent(q)}`}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white font-bold text-sm rounded-xl transition-colors"
                >
                  View all {total.toLocaleString()} results
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )}
          </>
        ) : (
          /* No results */
          <div className="py-20 text-center">
            <PackageSearch className="h-16 w-16 text-zinc-200 mx-auto mb-5" />
            <h2 className="text-lg font-bold text-zinc-700 mb-2">No products found</h2>
            <p className="text-zinc-400 text-sm mb-8 max-w-sm mx-auto">
              We couldn&apos;t find anything matching &ldquo;{q}&rdquo;. Try a different keyword or browse by category.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/shop/browse"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-bold text-sm rounded-xl transition-colors"
              >
                Browse All Products
              </Link>
              <Link
                href="/shop/categories"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 border border-zinc-200 hover:border-brand-400 text-zinc-700 hover:text-brand-600 font-semibold text-sm rounded-xl transition-colors"
              >
                Browse Categories
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
