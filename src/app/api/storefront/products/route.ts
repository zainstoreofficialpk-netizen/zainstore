import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const page  = Math.max(1, parseInt(searchParams.get("page")  ?? "1",  10));
    const limit = Math.min(60, Math.max(1, parseInt(searchParams.get("limit") ?? "36", 10)));
    const skip  = (page - 1) * limit;

    const search     = searchParams.get("search") ?? "";
    const categoryId = searchParams.get("category") ?? "";
    const brandId    = searchParams.get("brand") ?? "";
    const storeId    = searchParams.get("store") ?? "";
    const minPrice   = searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : undefined;
    const maxPrice   = searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined;
    const minRating  = searchParams.get("rating") ? Number(searchParams.get("rating")) : 0;
    const onSale     = searchParams.get("onSale")    === "1";
    const inStock    = searchParams.get("inStock")   === "1";
    const featured   = searchParams.get("featured")  === "1";
    const sort       = searchParams.get("sort") ?? "newest";

    const where: Prisma.ProductWhereInput = {
      status: "ACTIVE",
      ...(search     ? { name: { contains: search, mode: "insensitive" as const } } : {}),
      ...(categoryId ? { categoryId } : {}),
      ...(brandId    ? { brandId }    : {}),
      ...(storeId    ? { storeId }    : {}),
      ...(onSale     ? { salePrice: { not: null } } : {}),
      ...(inStock    ? { stockStatus: "IN_STOCK" as const } : {}),
      ...(featured   ? { featured: true } : {}),
      ...(minPrice !== undefined || maxPrice !== undefined
        ? {
            OR: [
              { salePrice: { ...(minPrice !== undefined ? { gte: minPrice } : {}), ...(maxPrice !== undefined ? { lte: maxPrice } : {}) } },
              { salePrice: null, price: { ...(minPrice !== undefined ? { gte: minPrice } : {}), ...(maxPrice !== undefined ? { lte: maxPrice } : {}) } },
            ],
          }
        : {}),
    };

    const orderBy: Prisma.ProductOrderByWithRelationInput =
      sort === "price_asc"  ? { price: "asc" }      :
      sort === "price_desc" ? { price: "desc" }     :
      sort === "popular"    ? { viewCount: "desc" } :
      sort === "featured"   ? { featured: "desc" }  :
                              { createdAt: "desc" };

    const [raw, total] = await Promise.all([
      db.product.findMany({
        where, skip, take: limit, orderBy,
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
      db.product.count({ where }),
    ]);

    let products = raw.map((p) => {
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

    if (sort === "rating") products = [...products].sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount);
    if (minRating > 0) products = products.filter((p) => p.rating >= minRating);

    return NextResponse.json({ products, total, page, limit });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}
