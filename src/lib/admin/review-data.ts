import { db } from "@/lib/db";
import { ReviewStatus } from "@prisma/client";

export type AdminReviewFilter = "ALL" | "PENDING" | "APPROVED" | "REJECTED" | "FLAGGED";

export async function getAdminReviews(filter: AdminReviewFilter = "ALL", page = 1) {
  const LIMIT = 25;
  const where = filter === "ALL" ? {} : { status: filter as ReviewStatus };

  const [reviews, total, stats] = await Promise.all([
    db.review.findMany({
      where,
      take: LIMIT,
      skip: (page - 1) * LIMIT,
      orderBy: [{ flagged: "desc" }, { createdAt: "desc" }],
      include: {
        user: { select: { name: true, email: true, image: true } },
        product: {
          select: {
            id: true,
            name: true,
            images: { take: 1, select: { url: true } },
            vendor: { select: { id: true, store: { select: { name: true } } } },
          },
        },
        images: true,
        reports: { select: { reason: true, createdAt: true, user: { select: { name: true } } } },
        _count: { select: { votes: true, reports: true } },
      },
    }),
    db.review.count({ where }),
    Promise.all([
      db.review.count({ where: { status: "PENDING" } }),
      db.review.count({ where: { status: "APPROVED" } }),
      db.review.count({ where: { status: "REJECTED" } }),
      db.review.count({ where: { status: "FLAGGED" } }),
      db.review.count({ where: { flagged: true } }),
      db.reviewReport.count(),
    ]),
  ]);

  return {
    reviews,
    total,
    pages: Math.ceil(total / LIMIT),
    stats: {
      pending: stats[0],
      approved: stats[1],
      rejected: stats[2],
      flagged: stats[3],
      autoFlagged: stats[4],
      totalReports: stats[5],
    },
  };
}

export async function getVendorLeaderboard(limit = 20) {
  const scores = await db.vendorTrustScore.findMany({
    orderBy: { overallScore: "desc" },
    take: limit,
    include: {
      vendor: {
        include: {
          user: { select: { name: true, email: true } },
          store: { select: { name: true } },
        },
      },
    },
  });
  return scores;
}

export async function getMarketplaceReviewAnalytics() {
  const [total, approved, pending, avgRating, topProducts] = await Promise.all([
    db.review.count(),
    db.review.count({ where: { status: "APPROVED" } }),
    db.review.count({ where: { status: "PENDING" } }),
    db.review.aggregate({ _avg: { rating: true }, where: { status: "APPROVED" } }),
    db.review.groupBy({
      by: ["productId"],
      where: { status: "APPROVED" },
      _count: { id: true },
      _avg: { rating: true },
      orderBy: { _count: { id: "desc" } },
      take: 5,
    }),
  ]);

  return {
    total,
    approved,
    pending,
    avgRating: Math.round((avgRating._avg.rating ?? 0) * 10) / 10,
    approvalRate: total > 0 ? Math.round((approved / total) * 100) : 0,
  };
}
