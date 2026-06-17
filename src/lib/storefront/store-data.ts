import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";

// ─── Types ────────────────────────────────────────────────────

export type StoreListItem = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  featured: boolean;
  featuredOrder: number | null;
  productCount: number;
  avgRating: number;
  totalReviews: number;
  overallScore: number;
  completedOrders: number;
  createdAt: Date;
};

export type StoreDetail = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  returnPolicy: string | null;
  shippingPolicy: string | null;
  inquiryEnabled: boolean;
  featured: boolean;
  createdAt: Date;
  productCount: number;
  avgRating: number;
  totalReviews: number;
  overallScore: number;
  verificationBadge: boolean;
  joinDate: Date;
};

export type StoreProduct = {
  id: string;
  name: string;
  slug: string;
  price: number;
  salePrice: number | null;
  imageUrl: string | null;
  storeName: string | null;
  storeSlug: string | null;
  storeId: string | null;
  vendorId: string | null;
  rating: number;
  reviewCount: number;
  categoryId: string | null;
  categoryName: string | null;
  createdAt: Date;
};

export type StoreReview = {
  id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  verifiedPurchase: boolean;
  helpfulCount: number;
  vendorReply: string | null;
  vendorRepliedAt: Date | null;
  createdAt: Date;
  user: { name: string | null; image: string | null };
  images: { url: string }[];
};

// ─── All Stores ───────────────────────────────────────────────

export type GetStoresOptions = {
  search?: string;
  categorySlug?: string;
  sort?: "top_rated" | "most_products" | "newest" | "featured";
  page?: number;
  limit?: number;
};

export async function getAllStores(opts: GetStoresOptions = {}) {
  const { search = "", categorySlug, sort = "featured", page = 1, limit = 24 } = opts;

  const where: Prisma.StoreWhereInput = {
    vacationMode: false,
    vendor: { status: "ACTIVE" },
    ...(search ? { name: { contains: search, mode: "insensitive" as const } } : {}),
    ...(categorySlug
      ? {
          categories: {
            some: { category: { slug: categorySlug } },
          },
        }
      : {}),
  };

  const [raw, total] = await Promise.all([
    db.store.findMany({
      where,
      include: {
        _count: {
          select: {
            products: { where: { status: "ACTIVE" } },
          },
        },
        vendor: {
          include: {
            trustScore: true,
          },
        },
      },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.store.count({ where }),
  ]);

  const stores: StoreListItem[] = raw.map((s) => ({
    id: s.id,
    name: s.name,
    slug: s.slug,
    description: s.description,
    logoUrl: s.logoUrl,
    bannerUrl: s.bannerUrl,
    featured: s.featured,
    featuredOrder: s.featuredOrder,
    productCount: s._count.products,
    avgRating: s.vendor.trustScore?.avgRating ?? 0,
    totalReviews: s.vendor.trustScore?.totalReviews ?? 0,
    overallScore: s.vendor.trustScore?.overallScore ?? 0,
    completedOrders: 0,
    createdAt: s.createdAt,
  }));

  // Sort in-memory after fetch for complex ranking
  if (sort === "featured") {
    stores.sort((a, b) => {
      if (a.featured !== b.featured) return a.featured ? -1 : 1;
      if (a.featuredOrder !== null && b.featuredOrder !== null) return a.featuredOrder - b.featuredOrder;
      if (a.featuredOrder !== null) return -1;
      if (b.featuredOrder !== null) return 1;
      return b.overallScore - a.overallScore;
    });
  } else if (sort === "top_rated") {
    stores.sort((a, b) => b.avgRating - a.avgRating || b.totalReviews - a.totalReviews);
  } else if (sort === "most_products") {
    stores.sort((a, b) => b.productCount - a.productCount);
  } else if (sort === "newest") {
    stores.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  return { stores, total, page, limit };
}

// ─── Store Detail ─────────────────────────────────────────────

export async function getStoreBySlug(slug: string): Promise<StoreDetail | null> {
  const store = await db.store.findUnique({
    where: { slug },
    include: {
      vendor: {
        include: {
          trustScore: true,
          user: { select: { createdAt: true } },
        },
      },
      _count: {
        select: { products: { where: { status: "ACTIVE" } } },
      },
    },
  });

  if (!store || store.vendor.status !== "ACTIVE") return null;

  return {
    id: store.id,
    name: store.name,
    slug: store.slug,
    description: store.description,
    logoUrl: store.logoUrl,
    bannerUrl: store.bannerUrl,
    address: store.address,
    phone: store.phone,
    email: store.email,
    returnPolicy: store.returnPolicy,
    shippingPolicy: store.shippingPolicy,
    inquiryEnabled: store.inquiryEnabled,
    featured: store.featured,
    createdAt: store.createdAt,
    productCount: store._count.products,
    avgRating: store.vendor.trustScore?.avgRating ?? 0,
    totalReviews: store.vendor.trustScore?.totalReviews ?? 0,
    overallScore: store.vendor.trustScore?.overallScore ?? 0,
    verificationBadge: store.vendor.verificationBadge,
    joinDate: store.vendor.user.createdAt,
  };
}

// ─── Store Products ───────────────────────────────────────────

export type GetStoreProductsOptions = {
  storeId: string;
  categoryId?: string;
  search?: string;
  sort?: "newest" | "price_asc" | "price_desc" | "top_rated" | "popular";
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  page?: number;
  limit?: number;
};

export async function getStoreProducts(opts: GetStoreProductsOptions) {
  const { storeId, categoryId, search, sort = "newest", minPrice, maxPrice, page = 1, limit = 24 } = opts;

  const where: Prisma.ProductWhereInput = {
    storeId,
    status: "ACTIVE",
    ...(categoryId ? { categoryId } : {}),
    ...(search ? { name: { contains: search, mode: "insensitive" as const } } : {}),
    ...(minPrice !== undefined || maxPrice !== undefined
      ? {
          OR: [
            {
              salePrice: {
                ...(minPrice !== undefined ? { gte: minPrice } : {}),
                ...(maxPrice !== undefined ? { lte: maxPrice } : {}),
              },
            },
            {
              salePrice: null,
              price: {
                ...(minPrice !== undefined ? { gte: minPrice } : {}),
                ...(maxPrice !== undefined ? { lte: maxPrice } : {}),
              },
            },
          ],
        }
      : {}),
  };

  const orderBy: Prisma.ProductOrderByWithRelationInput =
    sort === "price_asc"
      ? { price: "asc" }
      : sort === "price_desc"
      ? { price: "desc" }
      : sort === "popular"
      ? { viewCount: "desc" }
      : { createdAt: "desc" };

  const [raw, total] = await Promise.all([
    db.product.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        salePrice: true,
        createdAt: true,
        categoryId: true,
        vendorId: true,
        category: { select: { name: true } },
        images: { take: 1, select: { url: true }, orderBy: { sortOrder: "asc" } },
        store: { select: { id: true, name: true, slug: true } },
        reviews: { where: { status: "APPROVED" }, select: { rating: true } },
      },
    }),
    db.product.count({ where }),
  ]);

  let products: StoreProduct[] = raw.map((p) => {
    const ratings = p.reviews.map((r) => r.rating);
    const avg = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
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
      vendorId: p.vendorId,
      rating: avg,
      reviewCount: ratings.length,
      categoryId: p.categoryId,
      categoryName: p.category?.name ?? null,
      createdAt: p.createdAt,
    };
  });

  // Filter by minRating in memory (needs computed avg)
  if (opts.minRating !== undefined && opts.minRating > 0) {
    products = products.filter((p) => p.rating >= opts.minRating!);
  }

  return { products, total, page, limit };
}

// ─── Store Categories ─────────────────────────────────────────

export async function getStoreCategories(storeId: string) {
  const rows = await db.product.groupBy({
    by: ["categoryId"],
    where: { storeId, status: "ACTIVE", categoryId: { not: null } },
    _count: { id: true },
  });

  if (rows.length === 0) return [];

  const catIds = rows.map((r) => r.categoryId).filter(Boolean) as string[];
  const cats = await db.category.findMany({
    where: { id: { in: catIds } },
    select: { id: true, name: true, slug: true },
  });

  return cats.map((c) => ({
    ...c,
    count: rows.find((r) => r.categoryId === c.id)?._count.id ?? 0,
  }));
}

// ─── Store Reviews ────────────────────────────────────────────

export async function getStoreReviews(storeId: string, page = 1, limit = 10) {
  const where = { storeId, status: "APPROVED" as const };

  const [reviews, total, stats] = await Promise.all([
    db.review.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        user: { select: { name: true, image: true } },
        images: { select: { url: true } },
      },
    }),
    db.review.count({ where }),
    db.review.aggregate({
      where,
      _avg: { rating: true },
      _count: { id: true },
    }),
  ]);

  const ratingBreakdown = await db.review.groupBy({
    by: ["rating"],
    where,
    _count: { id: true },
  });

  return {
    reviews: reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      title: r.title,
      comment: r.comment,
      verifiedPurchase: r.verifiedPurchase,
      helpfulCount: r.helpfulCount,
      vendorReply: r.vendorReply,
      vendorRepliedAt: r.vendorRepliedAt,
      createdAt: r.createdAt,
      user: r.user,
      images: r.images,
    })),
    total,
    avgRating: stats._avg.rating ?? 0,
    ratingBreakdown: [5, 4, 3, 2, 1].map((star) => ({
      star,
      count: ratingBreakdown.find((r) => r.rating === star)?._count.id ?? 0,
    })),
  };
}

// ─── Featured stores for homepage ────────────────────────────

export async function getFeaturedStores(limit = 8) {
  const raw = await db.store.findMany({
    where: { vacationMode: false, vendor: { status: "ACTIVE" } },
    orderBy: [
      { featured: "desc" },
      { featuredOrder: "asc" },
    ],
    take: limit * 3, // over-fetch for in-memory ranking
    include: {
      _count: { select: { products: { where: { status: "ACTIVE" } } } },
      vendor: { include: { trustScore: true } },
    },
  });

  const scored = raw.map((s) => ({
    id: s.id,
    name: s.name,
    slug: s.slug,
    description: s.description,
    logoUrl: s.logoUrl,
    bannerUrl: s.bannerUrl,
    featured: s.featured,
    featuredOrder: s.featuredOrder,
    productCount: s._count.products,
    avgRating: s.vendor.trustScore?.avgRating ?? 0,
    totalReviews: s.vendor.trustScore?.totalReviews ?? 0,
    overallScore: s.vendor.trustScore?.overallScore ?? 0,
    createdAt: s.createdAt,
  }));

  scored.sort((a, b) => {
    if (a.featured !== b.featured) return a.featured ? -1 : 1;
    return b.overallScore - a.overallScore;
  });

  return scored.slice(0, limit);
}
