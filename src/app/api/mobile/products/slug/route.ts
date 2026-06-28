import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");
    if (!slug) return NextResponse.json({ error: "Slug required." }, { status: 400 });

    const product = await db.product.findUnique({
      where: { slug, status: "ACTIVE" },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        category: { select: { id: true, name: true, slug: true } },
        brand: { select: { id: true, name: true } },
        store: { select: { id: true, name: true, slug: true, logoUrl: true } },
        reviews: {
          where: { status: "APPROVED" },
          include: { user: { select: { name: true, image: true } } },
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      },
    });

    if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });

    // Fire and forget view count
    db.product.update({ where: { id: product.id }, data: { viewCount: { increment: 1 } } }).catch(() => {});

    const ratings = product.reviews.map((r) => r.rating);
    const avgRating = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;

    return NextResponse.json({
      id: product.id,
      name: product.name,
      slug: product.slug,
      sku: product.sku,
      description: product.description,
      shortDescription: product.shortDescription,
      price: Number(product.price),
      salePrice: product.salePrice ? Number(product.salePrice) : null,
      stock: product.stock,
      stockStatus: product.stockStatus,
      shippingType: product.shippingType,
      weight: product.weight ? Number(product.weight) : null,
      tags: product.tags,
      videoUrl: product.videoUrl,
      vendorId: product.vendorId,
      images: product.images.map((img) => ({ id: img.id, url: img.url, alt: img.alt })),
      category: product.category,
      brand: product.brand,
      store: product.store,
      avgRating: Math.round(avgRating * 10) / 10,
      reviewCount: ratings.length,
      reviews: product.reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        title: r.title,
        comment: r.comment,
        verifiedPurchase: r.verifiedPurchase,
        helpfulCount: r.helpfulCount,
        createdAt: r.createdAt.toISOString(),
        user: { name: r.user.name, image: r.user.image },
      })),
    });
  } catch (e) {
    console.error("[mobile/products/slug]", e);
    return NextResponse.json({ error: "Failed to fetch product." }, { status: 500 });
  }
}
