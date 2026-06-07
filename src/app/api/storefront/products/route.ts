import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(80, Math.max(1, parseInt(searchParams.get("limit") ?? "40", 10)));
    const skip = (page - 1) * limit;

    const where = { status: "ACTIVE" as const };

    const [raw, total] = await Promise.all([
      db.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          slug: true,
          price: true,
          salePrice: true,
          images: { take: 1, select: { url: true }, orderBy: { sortOrder: "asc" } },
          store: { select: { name: true, slug: true } },
          reviews: { where: { status: "APPROVED" }, select: { rating: true } },
        },
      }),
      db.product.count({ where }),
    ]);

    const products = raw.map((p) => {
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
        rating: avg,
        reviewCount: ratings.length,
      };
    });

    return NextResponse.json({ products, total, page, limit });
  } catch {
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}
