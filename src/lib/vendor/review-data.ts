import { db } from "@/lib/db";
import { ReviewStatus } from "@prisma/client";

export type ReviewFilter = "ALL" | "APPROVED" | "PENDING" | "FLAGGED" | "REJECTED";
export type ReviewSort = "latest" | "highest" | "lowest" | "helpful";

export async function getVendorReviews(
  vendorId: string,
  opts: {
    filter?: ReviewFilter;
    sort?: ReviewSort;
    rating?: number;
    page?: number;
    search?: string;
  } = {},
) {
  const { filter = "ALL", sort = "latest", rating, page = 1, search } = opts;
  const LIMIT = 20;

  const where: Record<string, unknown> = {
    product: { vendorId },
  };
  if (filter !== "ALL") where.status = filter as ReviewStatus;
  if (rating) where.rating = rating;
  if (search) {
    where.OR = [
      { comment: { contains: search, mode: "insensitive" } },
      { title: { contains: search, mode: "insensitive" } },
    ];
  }

  const orderBy =
    sort === "highest" ? { rating: "desc" as const } :
    sort === "lowest"  ? { rating: "asc" as const } :
    sort === "helpful" ? { helpfulCount: "desc" as const } :
                         { createdAt: "desc" as const };

  const [reviews, total] = await Promise.all([
    db.review.findMany({
      where,
      orderBy,
      take: LIMIT,
      skip: (page - 1) * LIMIT,
      include: {
        user: { select: { name: true, image: true } },
        product: { select: { id: true, name: true, images: { take: 1, select: { url: true } } } },
        images: true,
        _count: { select: { votes: true, reports: true } },
      },
    }),
    db.review.count({ where }),
  ]);

  return { reviews, total, pages: Math.ceil(total / LIMIT) };
}

export async function getVendorReviewStats(vendorId: string) {
  const [byRating, monthly, total, replied] = await Promise.all([
    db.review.groupBy({
      by: ["rating"],
      where: { product: { vendorId }, status: ReviewStatus.APPROVED },
      _count: { rating: true },
    }),
    db.review.groupBy({
      by: ["createdAt"],
      where: {
        product: { vendorId },
        status: ReviewStatus.APPROVED,
        createdAt: { gte: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000) },
      },
      _count: { id: true },
      _avg: { rating: true },
    }),
    db.review.count({ where: { product: { vendorId }, status: ReviewStatus.APPROVED } }),
    db.review.count({ where: { product: { vendorId }, status: ReviewStatus.APPROVED, vendorReply: { not: null } } }),
  ]);

  const ratingDist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let ratingSum = 0;
  for (const g of byRating) {
    ratingDist[g.rating] = g._count.rating;
    ratingSum += g.rating * g._count.rating;
  }

  const avgRating = total > 0 ? ratingSum / total : 0;
  const positiveCount = (ratingDist[4] ?? 0) + (ratingDist[5] ?? 0);
  const responseRate = total > 0 ? Math.round((replied / total) * 100) : 0;

  return {
    total,
    avgRating: Math.round(avgRating * 10) / 10,
    ratingDist,
    positivePercent: total > 0 ? Math.round((positiveCount / total) * 100) : 0,
    responseRate,
    pendingCount: await db.review.count({ where: { product: { vendorId }, status: ReviewStatus.PENDING } }),
    flaggedCount: await db.review.count({ where: { product: { vendorId }, status: ReviewStatus.FLAGGED } }),
  };
}

export async function getVendorReviewAnalytics(vendorId: string) {
  // Monthly avg rating over last 6 months
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const reviews = await db.review.findMany({
    where: {
      product: { vendorId },
      status: ReviewStatus.APPROVED,
      createdAt: { gte: sixMonthsAgo },
    },
    select: { rating: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  // Group by month
  const byMonth: Record<string, { sum: number; count: number }> = {};
  for (const r of reviews) {
    const key = r.createdAt.toISOString().slice(0, 7); // "YYYY-MM"
    if (!byMonth[key]) byMonth[key] = { sum: 0, count: 0 };
    byMonth[key].sum += r.rating;
    byMonth[key].count++;
  }

  const trendData = Object.entries(byMonth).map(([month, { sum, count }]) => ({
    month,
    avgRating: Math.round((sum / count) * 10) / 10,
    count,
  }));

  return { trendData };
}
