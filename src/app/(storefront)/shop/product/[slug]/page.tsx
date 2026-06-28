import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { ProductGallery } from "@/components/storefront/product-gallery";
import { ProductInfo } from "@/components/storefront/product-info";
import { ProductDetailTabs } from "@/components/storefront/product-detail-tabs";
import { ProductReviews } from "@/components/storefront/product-reviews";
import { VendorStoreCard } from "@/components/storefront/vendor-store-card";
import { MobileStickyBar } from "@/components/storefront/mobile-sticky-bar";
import { RecentlyViewedTracker, RecentlyViewedList } from "@/components/storefront/recently-viewed";
import { ProductCard, type ProductCardData } from "@/components/storefront/product-card";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { Metadata } from "next";

// ─── Metadata ─────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await db.product.findUnique({
    where: { slug, status: "ACTIVE" },
    select: {
      name: true, description: true, shortDescription: true,
      seoTitle: true, seoDescription: true, seoKeywords: true,
      price: true, salePrice: true, stockStatus: true, sku: true,
      images: { take: 1, orderBy: { sortOrder: "asc" }, select: { url: true, alt: true } },
      category: { select: { name: true } },
      store: { select: { name: true } },
      brand: { select: { name: true } },
    },
  });
  if (!product) return {};

  const title = product.seoTitle ?? `${product.name} | Buy Online in Pakistan`;
  const description =
    product.seoDescription ??
    product.shortDescription ??
    product.description?.slice(0, 160) ??
    `Buy ${product.name} online in Pakistan. Best price, fast delivery.`;
  const image = product.images[0]?.url;
  const price = Number(product.salePrice ?? product.price);
  const keywords = product.seoKeywords
    ? [product.seoKeywords]
    : [`${product.name}`, `buy ${product.name} Pakistan`, `${product.category?.name ?? ""} Pakistan`].filter(Boolean);

  return {
    title,
    description,
    keywords,
    alternates: { canonical: `https://zainstore.pk/shop/product/${slug}` },
    openGraph: {
      type: "website",
      title,
      description,
      url: `https://zainstore.pk/shop/product/${slug}`,
      siteName: "ZainStore.pk",
      images: image ? [{ url: image, width: 800, height: 800, alt: product.images[0]?.alt ?? product.name }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : undefined,
    },
    other: {
      "product:price:amount": String(price),
      "product:price:currency": "PKR",
      "product:availability": product.stockStatus === "IN_STOCK" ? "in stock" : "out of stock",
      ...(product.sku ? { "product:retailer_item_id": product.sku } : {}),
    },
  };
}

// ─── Page ─────────────────────────────────────────────────────

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const session = await getServerSession(authOptions);
  const isLoggedIn = !!session?.user;

  const product = await db.product.findUnique({
    where: { slug, status: "ACTIVE" },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      category: { select: { id: true, name: true, slug: true } },
      brand: { select: { id: true, name: true, slug: true } },
      store: {
        include: {
          vendor: {
            include: {
              trustScore: true,
            },
          },
          _count: { select: { products: true } },
        },
      },
      reviews: {
        where: { status: "APPROVED" },
        include: { user: { select: { name: true, image: true } } },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });

  if (!product) notFound();

  // Increment view count (fire and forget)
  db.product.update({ where: { id: product.id }, data: { viewCount: { increment: 1 } } }).catch(() => {});

  // Related products from same category
  const relatedRaw = product.category
    ? await db.product.findMany({
        where: {
          categoryId: product.category.id,
          status: "ACTIVE",
          id: { not: product.id },
        },
        include: {
          images: { take: 1, orderBy: { sortOrder: "asc" } },
          store: { select: { id: true, name: true, slug: true } },
          reviews: { where: { status: "APPROVED" }, select: { rating: true } },
        },
        take: 8,
        orderBy: { viewCount: "desc" },
      })
    : [];

  // ── Serialization ────────────────────────────────────────────
  const price = Number(product.price);
  const salePrice = product.salePrice ? Number(product.salePrice) : null;
  const firstImage = product.images[0]?.url ?? null;

  const avgRating =
    product.reviews.length > 0
      ? product.reviews.reduce((s, r) => s + r.rating, 0) / product.reviews.length
      : 0;

  const galleryImages = product.images.map((img) => ({
    id: img.id,
    url: img.url,
    alt: img.alt,
  }));

  const infoData = {
    id: product.id,
    name: product.name,
    slug: product.slug,
    sku: product.sku,
    shortDescription: product.shortDescription,
    price,
    salePrice,
    stock: product.stock,
    lowStockThreshold: product.lowStockThreshold,
    stockStatus: product.stockStatus,
    shippingType: product.shippingType,
    tags: product.tags,
    category: product.category
      ? { name: product.category.name, slug: product.category.slug }
      : null,
    brand: product.brand
      ? { name: product.brand.name, slug: product.brand.slug }
      : null,
    rating: avgRating,
    reviewCount: product.reviews.length,
    storeName: product.store.name,
    storeId: product.store.id,
    vendorId: product.vendorId,
    imageUrl: firstImage,
    weight: product.weight ? Number(product.weight) : null,
  };

  const reviewsData = product.reviews.map((r) => ({
    id: r.id,
    rating: r.rating,
    title: r.title,
    body: r.comment,
    isVerified: r.verifiedPurchase,
    helpfulCount: r.helpfulCount,
    createdAt: r.createdAt.toISOString(),
    user: { name: r.user.name, image: r.user.image },
  }));

  const vendorData = {
    storeName: product.store.name,
    storeSlug: product.store.slug,
    storeDescription: product.store.description,
    storeLogo: product.store.logoUrl,
    storeRating: product.store.vendor.trustScore?.avgRating ?? null,
    productCount: product.store._count.products,
    trustScore: product.store.vendor.trustScore?.overallScore ?? null,
  };

  const relatedProducts: ProductCardData[] = relatedRaw.map((p) => {
    const ratingArr = p.reviews.map((r) => r.rating);
    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: Number(p.price),
      salePrice: p.salePrice ? Number(p.salePrice) : null,
      imageUrl: p.images[0]?.url ?? null,
      storeName: p.store.name,
      storeSlug: p.store.slug,
      storeId: p.store.id,
      vendorId: p.vendorId,
      rating: ratingArr.length > 0 ? ratingArr.reduce((a, b) => a + b, 0) / ratingArr.length : 0,
      reviewCount: ratingArr.length,
    };
  });

  const inStock =
    product.stockStatus === "IN_STOCK" ||
    (product.stock > 0 && product.stockStatus !== "OUT_OF_STOCK");

  // Breadcrumb
  const crumbs = [
    { label: "Home", href: "/shop" },
    ...(product.category
      ? [{ label: product.category.name, href: `/shop/category/${product.category.slug}` }]
      : []),
    { label: product.name, href: null },
  ];

  // ── JSON-LD structured data ──────────────────────────────────
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description || product.shortDescription || product.name,
    image: product.images.map((img) => img.url),
    ...(product.sku ? { sku: product.sku } : {}),
    ...(product.brand ? { brand: { "@type": "Brand", name: product.brand.name } } : {}),
    ...(product.category ? { category: product.category.name } : {}),
    offers: {
      "@type": "Offer",
      url: `https://zainstore.pk/shop/product/${product.slug}`,
      priceCurrency: "PKR",
      price: Number(product.salePrice ?? product.price),
      priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      seller: { "@type": "Organization", name: product.store.name },
      itemCondition: "https://schema.org/NewCondition",
    },
    ...(product.reviews.length > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: avgRating.toFixed(1),
            reviewCount: product.reviews.length,
            bestRating: "5",
            worstRating: "1",
          },
          review: product.reviews.slice(0, 5).map((r) => ({
            "@type": "Review",
            reviewRating: { "@type": "Rating", ratingValue: r.rating },
            author: { "@type": "Person", name: r.user.name ?? "Verified Buyer" },
            reviewBody: r.comment,
            datePublished: r.createdAt.toISOString().split("T")[0],
          })),
        }
      : {}),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.label,
      ...(c.href ? { item: `https://zainstore.pk${c.href}` } : {}),
    })),
  };

  return (
    <div className="bg-zinc-50 min-h-screen pb-24 md:pb-12">
      {/* JSON-LD structured data */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      {/* Track recently viewed (client) */}
      <RecentlyViewedTracker
        id={product.id}
        name={product.name}
        slug={product.slug}
        price={price}
        salePrice={salePrice}
        imageUrl={firstImage}
      />

      <div className="container mx-auto px-4 max-w-7xl">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 py-4 text-xs text-zinc-400 flex-wrap">
          {crumbs.map((c, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && <ChevronRight className="h-3 w-3 text-zinc-300" />}
              {c.href ? (
                <Link href={c.href} className="hover:text-brand-600 transition-colors">
                  {c.label}
                </Link>
              ) : (
                <span className="text-zinc-600 font-medium line-clamp-1 max-w-[180px]">{c.label}</span>
              )}
            </span>
          ))}
        </nav>

        {/* ── Main product section ─────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 mb-8">
          {/* Gallery */}
          <div>
            <ProductGallery images={galleryImages} productName={product.name} videoUrl={product.videoUrl} />
          </div>

          {/* Info + Vendor */}
          <div className="flex flex-col gap-5">
            <ProductInfo product={infoData} />
            <VendorStoreCard vendor={vendorData} />
          </div>
        </div>

        {/* ── Tabs + Reviews ───────────────────────────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
          <div className="xl:col-span-2 space-y-6">
            <ProductDetailTabs
              description={product.description}
              weight={product.weight ? Number(product.weight) : null}
              length={product.length ? Number(product.length) : null}
              width={product.width ? Number(product.width) : null}
              height={product.height ? Number(product.height) : null}
              shippingType={product.shippingType}
              sku={product.sku}
            />
            <ProductReviews
              reviews={reviewsData}
              avgRating={avgRating}
              totalCount={product.reviews.length}
              productId={product.id}
              isLoggedIn={isLoggedIn}
            />
          </div>

          {/* Sidebar (desktop) */}
          <div className="hidden xl:block space-y-4">
            <div className="bg-white rounded-2xl border border-zinc-100 p-5">
              <h3 className="text-sm font-black text-zinc-400 uppercase tracking-wider mb-3">Product Details</h3>
              <dl className="space-y-2 text-xs">
                {product.sku && (
                  <div className="flex justify-between gap-2">
                    <dt className="text-zinc-500">SKU</dt>
                    <dd className="font-mono text-zinc-700">{product.sku}</dd>
                  </div>
                )}
                {product.brand && (
                  <div className="flex justify-between gap-2">
                    <dt className="text-zinc-500">Brand</dt>
                    <dd className="text-zinc-700">{product.brand.name}</dd>
                  </div>
                )}
                {product.category && (
                  <div className="flex justify-between gap-2">
                    <dt className="text-zinc-500">Category</dt>
                    <dd className="text-zinc-700">{product.category.name}</dd>
                  </div>
                )}
                <div className="flex justify-between gap-2">
                  <dt className="text-zinc-500">Views</dt>
                  <dd className="text-zinc-700">{(product.viewCount + 1).toLocaleString()}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-zinc-500">Shipping</dt>
                  <dd className="text-zinc-700 capitalize">{product.shippingType.toLowerCase()}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        {/* ── Related Products ─────────────────────────────── */}
        {relatedProducts.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-black text-zinc-900">Related Products</h2>
              {product.category && (
                <Link
                  href={`/shop/category/${product.category.slug}`}
                  className="text-xs text-brand-600 hover:text-brand-700 font-semibold flex items-center gap-1"
                >
                  See all <ChevronRight className="h-3 w-3" />
                </Link>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
              {relatedProducts.slice(0, 5).map((p) => (
                <ProductCard key={p.id} product={p} compact />
              ))}
            </div>
          </section>
        )}

        {/* ── Recently Viewed ──────────────────────────────── */}
        <RecentlyViewedList currentId={product.id} />
      </div>

      {/* Mobile sticky CTA */}
      <MobileStickyBar
        product={{
          id: product.id,
          name: product.name,
          slug: product.slug,
          price,
          salePrice,
          imageUrl: firstImage,
          storeName: product.store.name,
          storeId: product.store.id,
          vendorId: product.vendorId,
          inStock,
        }}
      />
    </div>
  );
}
