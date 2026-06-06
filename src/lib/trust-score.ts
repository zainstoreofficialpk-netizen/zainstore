import { db } from "@/lib/db";
import { OrderStatus, PaymentStatus, RefundStatus, ReviewStatus } from "@prisma/client";

export type TrustScoreResult = {
  overallScore: number;
  avgRating: number;
  totalReviews: number;
  verifiedReviews: number;
  positivePercent: number;
  orderCompletionRate: number;
  refundRate: number;
  responseRate: number;
  deliveryScore: number;
  badges: string[];
};

export async function calculateVendorTrustScore(vendorId: string): Promise<TrustScoreResult> {
  const vendor = await db.vendorProfile.findUnique({
    where: { id: vendorId },
    select: { userId: true, verificationBadge: true, createdAt: true, status: true },
  });
  if (!vendor) throw new Error("Vendor not found");

  const [reviewStats, orderStats, refundStats, replyStats] = await Promise.all([
    // Review metrics
    db.review.groupBy({
      by: ["rating"],
      where: {
        product: { vendorId },
        status: ReviewStatus.APPROVED,
      },
      _count: { rating: true },
    }),

    // Order completion metrics
    db.order.findMany({
      where: {
        items: { some: { vendorId } },
        paymentStatus: PaymentStatus.PAID,
      },
      select: { status: true, deliveredAt: true, createdAt: true },
    }),

    // Refund rate (approved refunds on delivered orders)
    db.refundRequest.count({
      where: {
        orderItem: { vendorId },
        status: { in: [RefundStatus.APPROVED, RefundStatus.PROCESSED] },
      },
    }),

    // Vendor reply rate
    db.review.aggregate({
      _count: { id: true },
      where: {
        product: { vendorId },
        status: ReviewStatus.APPROVED,
        vendorReply: { not: null },
      },
    }),
  ]);

  // ── Rating metrics ────────────────────────────────────────────────────────────

  const ratingBuckets: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let totalReviews = 0;
  let ratingSum = 0;
  let verifiedCount = 0;

  for (const g of reviewStats) {
    ratingBuckets[g.rating] = (ratingBuckets[g.rating] ?? 0) + g._count.rating;
    totalReviews += g._count.rating;
    ratingSum += g.rating * g._count.rating;
  }

  const verifiedReviews = await db.review.count({
    where: {
      product: { vendorId },
      status: ReviewStatus.APPROVED,
      verifiedPurchase: true,
    },
  });
  verifiedCount = verifiedReviews;

  const avgRating = totalReviews > 0 ? ratingSum / totalReviews : 0;
  const positiveCount = (ratingBuckets[4] ?? 0) + (ratingBuckets[5] ?? 0);
  const positivePercent = totalReviews > 0 ? (positiveCount / totalReviews) * 100 : 0;

  // ── Order completion ──────────────────────────────────────────────────────────

  const totalOrders = orderStats.length;
  const deliveredOrders = orderStats.filter((o) => o.status === OrderStatus.DELIVERED).length;
  const orderCompletionRate = totalOrders > 0 ? (deliveredOrders / totalOrders) * 100 : 100;

  // ── Refund rate ───────────────────────────────────────────────────────────────

  const refundRate = deliveredOrders > 0 ? (refundStats / deliveredOrders) * 100 : 0;

  // ── Response rate ─────────────────────────────────────────────────────────────

  const repliedCount = replyStats._count.id;
  const responseRate = totalReviews > 0 ? (repliedCount / totalReviews) * 100 : 100;

  // ── Delivery score (based on on-time delivery proxy: avg days to deliver) ─────

  const deliveredWithDate = orderStats.filter(
    (o) => o.status === OrderStatus.DELIVERED && o.deliveredAt,
  );
  let deliveryScore = 80; // default
  if (deliveredWithDate.length > 0) {
    const avgDays =
      deliveredWithDate.reduce((sum, o) => {
        const days = (o.deliveredAt!.getTime() - o.createdAt.getTime()) / (1000 * 60 * 60 * 24);
        return sum + days;
      }, 0) / deliveredWithDate.length;
    // Score: ≤3 days = 100, 7 days = 80, 14+ days = 50
    deliveryScore = Math.max(50, Math.min(100, 100 - (avgDays - 3) * 3.5));
  }

  // ── Composite trust score (weighted) ──────────────────────────────────────────
  // avgRating (0–5 → 0–100): 35%
  // orderCompletionRate: 25%
  // refundRate (inverted): 15%
  // positivePercent: 15%
  // responseRate: 5%
  // deliveryScore: 5%

  const ratingScore = (avgRating / 5) * 100;
  const refundScore = Math.max(0, 100 - refundRate * 5); // 20% refund rate → 0 score

  const overallScore = Math.round(
    ratingScore * 0.35 +
      orderCompletionRate * 0.25 +
      refundScore * 0.15 +
      positivePercent * 0.15 +
      responseRate * 0.05 +
      deliveryScore * 0.05,
  );

  // ── Badge assignment ──────────────────────────────────────────────────────────

  const badges: string[] = [];
  if (vendor.status === "ACTIVE" && vendor.verificationBadge) badges.push("VERIFIED_VENDOR");
  if (overallScore >= 85 && totalReviews >= 5) badges.push("TOP_RATED");
  if (overallScore >= 75 && totalReviews >= 10) badges.push("TRUSTED_SELLER");
  if (responseRate >= 80 && totalReviews >= 5) badges.push("FAST_RESPONDER");
  if (positivePercent >= 90 && totalReviews >= 20) badges.push("CUSTOMER_FAVORITE");

  return {
    overallScore,
    avgRating: Math.round(avgRating * 10) / 10,
    totalReviews,
    verifiedReviews: verifiedCount,
    positivePercent: Math.round(positivePercent),
    orderCompletionRate: Math.round(orderCompletionRate),
    refundRate: Math.round(refundRate * 10) / 10,
    responseRate: Math.round(responseRate),
    deliveryScore: Math.round(deliveryScore),
    badges,
  };
}

export async function upsertVendorTrustScore(vendorId: string): Promise<TrustScoreResult> {
  const score = await calculateVendorTrustScore(vendorId);

  await db.vendorTrustScore.upsert({
    where: { vendorId },
    create: { vendorId, ...score, lastCalculated: new Date() },
    update: { ...score, lastCalculated: new Date() },
  });

  return score;
}

export async function getVendorTrustScore(vendorId: string) {
  return db.vendorTrustScore.findUnique({ where: { vendorId } });
}

export const BADGE_META: Record<string, { label: string; description: string; color: string }> = {
  VERIFIED_VENDOR: { label: "Verified Vendor", description: "Identity and business verified by ZainStore", color: "text-brand-600 bg-brand-50" },
  TOP_RATED: { label: "Top Rated", description: "Trust score ≥ 85 with at least 5 reviews", color: "text-amber-700 bg-amber-50" },
  TRUSTED_SELLER: { label: "Trusted Seller", description: "Trust score ≥ 75 with at least 10 reviews", color: "text-emerald-700 bg-emerald-50" },
  FAST_RESPONDER: { label: "Fast Responder", description: "Replies to 80%+ of customer reviews", color: "text-sky-700 bg-sky-50" },
  CUSTOMER_FAVORITE: { label: "Customer Favorite", description: "90%+ positive feedback across 20+ reviews", color: "text-rose-700 bg-rose-50" },
};
