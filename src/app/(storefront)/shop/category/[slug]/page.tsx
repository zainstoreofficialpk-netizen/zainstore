import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight, ShoppingBag } from "lucide-react";
import { db } from "@/lib/db";
import { ShopBrowse } from "@/components/storefront/shop-browse";

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const category = await db.category.findUnique({ where: { slug: params.slug } });
  if (!category) return { title: "Category Not Found" };
  const title = `${category.name} — Buy Online in Pakistan | ZainStore.pk`;
  const description = `Shop the best ${category.name} products from verified sellers across Pakistan. Great prices, fast delivery on ZainStore.pk.`;
  return {
    title,
    description,
    alternates: { canonical: `https://zainstore.pk/shop/category/${params.slug}` },
    openGraph: {
      title,
      description,
      url: `https://zainstore.pk/shop/category/${params.slug}`,
      siteName: "ZainStore.pk",
      type: "website",
      images: category.imageUrl ? [{ url: category.imageUrl, alt: category.name }] : undefined,
    },
    twitter: { card: "summary", title, description },
  };
}

export default async function CategoryPage({ params }: Props) {
  const category = await db.category.findUnique({
    where: { slug: params.slug },
    include: {
      parent: { select: { id: true, name: true, slug: true } },
      children: { select: { id: true, name: true, slug: true }, orderBy: { name: "asc" } },
    },
  });

  if (!category) notFound();

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
    db.brand.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.store.findMany({
      where: { vacationMode: false, vendor: { status: "ACTIVE" } },
      orderBy: { name: "asc" },
      include: { _count: { select: { products: { where: { status: "ACTIVE", categoryId: category.id } } } } },
    }),
    db.product.aggregate({
      where: { status: "ACTIVE", categoryId: category.id },
      _min: { price: true },
      _max: { price: true },
    }),
    db.product.findMany({
      where: { status: "ACTIVE", categoryId: category.id },
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
    db.product.count({ where: { status: "ACTIVE", categoryId: category.id } }),
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

      {/* ── Header ── */}
      <div className="bg-white border-b border-zinc-100">
        <div className="container mx-auto px-4 max-w-7xl py-5">

          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs text-zinc-400 mb-3 flex-wrap">
            <Link href="/shop" className="hover:text-zinc-700 transition-colors">Home</Link>
            <ChevronRight className="h-3 w-3 shrink-0" />
            {category.parent && (
              <>
                <Link href={`/shop/category/${category.parent.slug}`} className="hover:text-zinc-700 transition-colors">
                  {category.parent.name}
                </Link>
                <ChevronRight className="h-3 w-3 shrink-0" />
              </>
            )}
            <span className="text-zinc-700 font-semibold">{category.name}</span>
          </nav>

          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-zinc-900">{category.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <ShoppingBag className="h-3.5 w-3.5 text-brand-500" />
                <span className="text-sm text-zinc-500">
                  <span className="font-bold text-zinc-800">{total.toLocaleString()}</span> products
                  {stores.length > 0 && <> from <span className="font-bold text-zinc-800">{stores.length}</span> stores</>}
                </span>
              </div>
            </div>

            {/* Sub-categories */}
            {category.children.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {category.children.map((sub) => (
                  <Link
                    key={sub.id}
                    href={`/shop/category/${sub.slug}`}
                    className="text-xs font-semibold px-3 py-1.5 bg-zinc-100 hover:bg-brand-50 hover:text-brand-600 border border-zinc-200 hover:border-brand-200 text-zinc-700 rounded-full transition-all"
                  >
                    {sub.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Products ── */}
      <ShopBrowse
        initialProducts={initialProducts}
        initialTotal={total}
        categories={categories}
        brands={brands}
        stores={stores}
        priceMin={priceMin}
        priceMax={priceMax}
        initialCategoryId={category.id}
      />
    </div>
  );
}
