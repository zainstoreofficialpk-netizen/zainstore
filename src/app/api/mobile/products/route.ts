import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const page       = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit      = Math.min(40, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
    const skip       = (page - 1) * limit;
    const search     = searchParams.get("search") ?? "";
    const categoryId = searchParams.get("categoryId") ?? "";
    const brandId    = searchParams.get("brandId") ?? "";
    const storeId    = searchParams.get("storeId") ?? "";
    const onSale     = searchParams.get("onSale") === "1";
    const inStock    = searchParams.get("inStock") === "1";
    const sort       = searchParams.get("sort") ?? "newest";

    const where: Prisma.ProductWhereInput = {
      status: "ACTIVE",
      ...(search     ? { name: { contains: search, mode: "insensitive" } } : {}),
      ...(categoryId ? { categoryId } : {}),
      ...(brandId    ? { brandId }    : {}),
      ...(storeId    ? { storeId }    : {}),
      ...(onSale     ? { salePrice: { not: null } } : {}),
      ...(inStock    ? { stockStatus: "IN_STOCK" }  : {}),
    };

    const orderBy: Prisma.ProductOrderByWithRelationInput =
      sort === "price_asc"  ? { price: "asc" }      :
      sort === "price_desc" ? { price: "desc" }     :
      sort === "popular"    ? { viewCount: "desc" } :
                              { createdAt: "desc" };

    const [raw, total] = await Promise.all([
      db.product.findMany({
        where, skip, take: limit, orderBy,
        select: {
          id: true, name: true, slug: true, price: true, salePrice: true,
          stockStatus: true, stock: true, vendorId: true, shippingType: true,
          images:   { take: 1, select: { url: true }, orderBy: { sortOrder: "asc" } },
          store:    { select: { id: true, name: true, slug: true } },
          category: { select: { id: true, name: true, slug: true } },
          brand:    { select: { id: true, name: true } },
          reviews:  { where: { status: "APPROVED" }, select: { rating: true } },
          _count:   { select: { orderItems: true } },
        },
      }),
      db.product.count({ where }),
    ]);

    const products = raw.map((p) => {
      const ratings = p.reviews.map((r) => r.rating);
      const avg = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        price: Number(p.price),
        salePrice: p.salePrice ? Number(p.salePrice) : null,
        imageUrl: p.images[0]?.url ?? null,
        stockStatus: p.stockStatus,
        stock: p.stock,
        shippingType: p.shippingType,
        vendorId: p.vendorId,
        storeName: p.store?.name ?? null,
        storeSlug: p.store?.slug ?? null,
        storeId: p.store?.id ?? null,
        category: p.category ? { id: p.category.id, name: p.category.name, slug: p.category.slug } : null,
        brand: p.brand ? { name: p.brand.name } : null,
        rating: Math.round(avg * 10) / 10,
        reviewCount: ratings.length,
        soldCount: p._count.orderItems,
      };
    });

    return NextResponse.json({ products, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (e) {
    console.error("[mobile/products]", e);
    return NextResponse.json({ error: "Failed to fetch products." }, { status: 500 });
  }
}
