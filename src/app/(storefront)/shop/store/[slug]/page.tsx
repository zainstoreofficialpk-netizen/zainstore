import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import {
  getStoreBySlug,
  getStoreProducts,
  getStoreCategories,
  getStoreReviews,
} from "@/lib/storefront/store-data";
import { VendorStorefront } from "@/components/storefront/vendor-storefront";
import type { ProductCardData } from "@/components/storefront/product-card";

type Props = { params: { slug: string }; searchParams: { tab?: string; category?: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const store = await getStoreBySlug(params.slug);
  if (!store) return { title: "Store Not Found" };
  const title = `${store.name} — Official Store | ZainStore.pk`;
  const description = store.description
    ? store.description.slice(0, 160)
    : `Shop ${store.productCount} products from ${store.name} on ZainStore.pk. Verified seller, fast delivery across Pakistan.`;
  return {
    title,
    description,
    alternates: { canonical: `https://zainstore.pk/shop/store/${params.slug}` },
    openGraph: {
      title,
      description,
      url: `https://zainstore.pk/shop/store/${params.slug}`,
      siteName: "ZainStore.pk",
      type: "website",
      images: store.logoUrl ? [{ url: store.logoUrl, alt: `${store.name} logo` }] : undefined,
    },
    twitter: { card: "summary", title, description, images: store.logoUrl ? [store.logoUrl] : undefined },
  };
}

export default async function VendorStorePage({ params, searchParams }: Props) {
  const store = await getStoreBySlug(params.slug);
  if (!store) notFound();

  const defaultCategoryId = searchParams.category ?? "";

  const [productsData, storeCategories, reviewsData] = await Promise.all([
    getStoreProducts({
      storeId: store.id,
      categoryId: defaultCategoryId || undefined,
      sort: "newest",
      page: 1,
      limit: 24,
    }),
    getStoreCategories(store.id),
    getStoreReviews(store.id, 1, 5),
  ]);

  const initialProducts: ProductCardData[] = productsData.products.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: p.price,
    salePrice: p.salePrice,
    imageUrl: p.imageUrl,
    storeName: p.storeName,
    storeSlug: p.storeSlug,
    storeId: (p as { storeId?: string | null }).storeId ?? null,
    vendorId: (p as { vendorId?: string | null }).vendorId ?? null,
    rating: p.rating,
    reviewCount: p.reviewCount,
  }));

  return (
    <div>
      {/* Breadcrumb */}
      <div className="bg-white border-b border-zinc-100">
        <div className="container mx-auto px-4 max-w-7xl py-2.5">
          <nav className="flex items-center gap-1.5 text-xs text-zinc-400">
            <Link href="/shop" className="hover:text-zinc-700 transition-colors">Home</Link>
            <ChevronRight className="h-3 w-3" />
            <Link href="/shop/stores" className="hover:text-zinc-700 transition-colors">Stores</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-zinc-700 font-semibold truncate max-w-[200px]">{store.name}</span>
          </nav>
        </div>
      </div>

      <VendorStorefront
        store={store}
        initialProducts={initialProducts}
        initialTotal={productsData.total}
        storeCategories={storeCategories}
        initialReviews={reviewsData.reviews}
        reviewTotal={reviewsData.total}
        avgRating={reviewsData.avgRating}
        ratingBreakdown={reviewsData.ratingBreakdown}
        defaultTab={searchParams.tab ?? "products"}
        defaultCategoryId={defaultCategoryId}
      />
    </div>
  );
}
