import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const page        = Math.max(1, parseInt(searchParams.get("page")         ?? "1",  10));
    const limit       = Math.min(60, parseInt(searchParams.get("limit")       ?? "24", 10));
    const search      = searchParams.get("search")      ?? "";
    const categoryId  = searchParams.get("category")   ?? "";
    const storeId     = searchParams.get("store")       ?? "";
    const minPrice    = searchParams.get("minPrice")    ? Number(searchParams.get("minPrice"))    : undefined;
    const maxPrice    = searchParams.get("maxPrice")    ? Number(searchParams.get("maxPrice"))    : undefined;
    const minRating   = searchParams.get("rating")      ? Number(searchParams.get("rating"))      : 0;
    const minDiscount = searchParams.get("minDiscount") ? Number(searchParams.get("minDiscount")) : 0;
    const inStock     = searchParams.get("inStock")     === "1";
    const sort        = searchParams.get("sort")        ?? "highest_discount";

    const where: Prisma.ProductWhereInput = {
      status: "ACTIVE",
      salePrice: { not: null },
      ...(search     ? { name: { contains: search, mode: "insensitive" as const } } : {}),
      ...(categoryId ? { categoryId } : {}),
      ...(storeId    ? { storeId }    : {}),
      ...(inStock    ? { stockStatus: "IN_STOCK" as const } : {}),
      ...(minPrice !== undefined || maxPrice !== undefined
        ? {
            salePrice: {
              not: null,
              ...(minPrice !== undefined ? { gte: minPrice } : {}),
              ...(maxPrice !== undefined ? { lte: maxPrice } : {}),
            },
          }
        : {}),
    };

    const raw = await db.product.findMany({
      where,
      select: {
        id: true, name: true, slug: true,
        price: true, salePrice: true,
        stockStatus: true, featured: true, vendorId: true,
        category: { select: { id: true, name: true } },
        store:    { select: { id: true, name: true, slug: true } },
        images:   { take: 1, select: { url: true }, orderBy: { sortOrder: "asc" as const } },
        reviews:  { where: { status: "APPROVED" as const }, select: { rating: true } },
      },
      orderBy: sort === "newest" ? { createdAt: "desc" as const } : undefined,
    });

    let products = raw.map((p) => {
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
        categoryId:   p.category?.id   ?? null,
        rating:       avgRating,
        reviewCount:  ratings.length,
        inStock:      p.stockStatus === "IN_STOCK",
        backorder:    p.stockStatus === "BACKORDER",
        featured:     p.featured,
      };
    });

    if (minDiscount > 0) products = products.filter((p) => p.discount >= minDiscount);
    if (minRating   > 0) products = products.filter((p) => p.rating   >= minRating);

    switch (sort) {
      case "highest_discount": products.sort((a, b) => b.discount - a.discount || b.rating - a.rating); break;
      case "price_asc":        products.sort((a, b) => a.salePrice - b.salePrice); break;
      case "price_desc":       products.sort((a, b) => b.salePrice - a.salePrice); break;
      case "rating":           products.sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount); break;
      case "popular":          products.sort((a, b) => b.reviewCount - a.reviewCount); break;
    }

    const total     = products.length;
    const paginated = products.slice((page - 1) * limit, page * limit);

    return NextResponse.json({ products: paginated, total, page, limit });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch sale products" }, { status: 500 });
  }
}
