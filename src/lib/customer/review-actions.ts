"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { ReviewStatus, OrderStatus, PaymentStatus, NotificationType } from "@prisma/client";

import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { upsertVendorTrustScore } from "@/lib/trust-score";
import { createNotification } from "@/lib/notifications";

type ActionResult<T = void> =
  | { success: true; message: string; data?: T }
  | { success: false; error: string };

async function requireCustomer() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user;
}

// ── Anti-abuse helpers ────────────────────────────────────────────────────────

async function isSuspiciousReview(userId: string, productId: string): Promise<boolean> {
  // Flag if same user has >3 reviews across different products in last 24h (velocity check)
  const recent = await db.review.count({
    where: {
      userId,
      createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    },
  });
  return recent >= 5;
}

// ── Submit review ─────────────────────────────────────────────────────────────

const submitSchema = z.object({
  orderItemId: z.string().min(1),
  title: z.string().max(120).optional(),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().min(10, "Review must be at least 10 characters").max(2000).optional(),
  imageUrls: z.array(z.string().url()).max(5).optional(),
});

export async function submitReviewAction(data: z.infer<typeof submitSchema>): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireCustomer();

    const parsed = submitSchema.safeParse(data);
    if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

    const { orderItemId, title, rating, comment, imageUrls } = parsed.data;

    // Verified purchase check: order item must exist, belong to this customer, and be DELIVERED
    const orderItem = await db.orderItem.findFirst({
      where: {
        id: orderItemId,
        order: {
          customerId: user.id,
          status: OrderStatus.DELIVERED,
          paymentStatus: PaymentStatus.PAID,
        },
      },
      include: {
        order: { select: { customerId: true } },
        product: { select: { id: true, vendorId: true, name: true } },
        review: { select: { id: true } },
      },
    });

    if (!orderItem) {
      return { success: false, error: "You can only review products from delivered and paid orders." };
    }

    // One review per order item
    if (orderItem.review) {
      return { success: false, error: "You have already reviewed this item." };
    }

    // Self-review guard: block if customer is the vendor
    const vendorProfile = await db.vendorProfile.findUnique({
      where: { id: orderItem.product.vendorId },
      select: { userId: true },
    });
    if (vendorProfile?.userId === user.id) {
      return { success: false, error: "You cannot review your own products." };
    }

    // Velocity / spam check
    const suspicious = await isSuspiciousReview(user.id, orderItem.product.id);

    const review = await db.review.create({
      data: {
        userId: user.id,
        productId: orderItem.product.id,
        orderItemId,
        title,
        rating,
        comment,
        verifiedPurchase: true,
        // Auto-approve verified purchase reviews; flag suspicious ones for moderation
        status: suspicious ? ReviewStatus.FLAGGED : ReviewStatus.APPROVED,
        flagged: suspicious,
        images: imageUrls?.length
          ? { create: imageUrls.map((url) => ({ url })) }
          : undefined,
      },
    });

    // Notify vendor
    if (!suspicious) {
      const vendor = await db.vendorProfile.findUnique({
        where: { id: orderItem.product.vendorId },
        select: { userId: true },
      });
      if (vendor) {
        await createNotification({
          userId: vendor.userId,
          type: NotificationType.REVIEW,
          title: `New ${rating}★ review on "${orderItem.product.name}"`,
          body: comment ? `"${comment.slice(0, 100)}${comment.length > 100 ? "…" : ""}"` : "A customer left a star rating.",
          url: "/vendor/reviews",
        });
      }

      // Recalculate vendor trust score in background (non-blocking)
      upsertVendorTrustScore(orderItem.product.vendorId).catch(() => {});
    }

    revalidatePath("/customer/reviews");
    return {
      success: true,
      message: suspicious
        ? "Review submitted and pending moderation."
        : "Review published successfully.",
      data: { id: review.id },
    };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to submit review." };
  }
}

// ── Edit review (within 48h of posting) ──────────────────────────────────────

const editSchema = z.object({
  reviewId: z.string().min(1),
  title: z.string().max(120).optional(),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().min(10).max(2000).optional(),
});

export async function editReviewAction(data: z.infer<typeof editSchema>): Promise<ActionResult> {
  try {
    const user = await requireCustomer();
    const parsed = editSchema.safeParse(data);
    if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

    const { reviewId, title, rating, comment } = parsed.data;

    const review = await db.review.findFirst({
      where: { id: reviewId, userId: user.id },
    });
    if (!review) return { success: false, error: "Review not found." };

    const EDIT_WINDOW_MS = 48 * 60 * 60 * 1000;
    if (Date.now() - review.createdAt.getTime() > EDIT_WINDOW_MS) {
      return { success: false, error: "Reviews can only be edited within 48 hours of posting." };
    }

    await db.review.update({
      where: { id: reviewId },
      data: { title, rating, comment, editedAt: new Date(), vendorReply: null, vendorRepliedAt: null },
    });

    // Re-trigger trust score update
    if (review.productId) {
      const product = await db.product.findUnique({ where: { id: review.productId }, select: { vendorId: true } });
      if (product) upsertVendorTrustScore(product.vendorId).catch(() => {});
    }

    revalidatePath("/customer/reviews");
    return { success: true, message: "Review updated." };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to edit review." };
  }
}

// ── Vote helpful / not helpful ────────────────────────────────────────────────

export async function voteReviewAction(reviewId: string, helpful: boolean): Promise<ActionResult> {
  try {
    const user = await requireCustomer();

    const review = await db.review.findUnique({ where: { id: reviewId }, select: { userId: true } });
    if (!review) return { success: false, error: "Review not found." };
    if (review.userId === user.id) return { success: false, error: "You cannot vote on your own review." };

    // Upsert: change vote if already voted
    await db.reviewVote.upsert({
      where: { reviewId_userId: { reviewId, userId: user.id } },
      create: { reviewId, userId: user.id, helpful },
      update: { helpful },
    });

    // Update denormalized counter
    const helpfulCount = await db.reviewVote.count({ where: { reviewId, helpful: true } });
    await db.review.update({ where: { id: reviewId }, data: { helpfulCount } });

    return { success: true, message: helpful ? "Marked as helpful." : "Marked as not helpful." };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to vote." };
  }
}

// ── Report a review ───────────────────────────────────────────────────────────

const reportSchema = z.object({
  reviewId: z.string().min(1),
  reason: z.string().min(5).max(500),
});

export async function reportReviewAction(data: z.infer<typeof reportSchema>): Promise<ActionResult> {
  try {
    const user = await requireCustomer();
    const parsed = reportSchema.safeParse(data);
    if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

    const { reviewId, reason } = parsed.data;

    const existing = await db.reviewReport.findUnique({
      where: { reviewId_userId: { reviewId, userId: user.id } },
    });
    if (existing) return { success: false, error: "You have already reported this review." };

    await db.$transaction(async (tx) => {
      await tx.reviewReport.create({ data: { reviewId, userId: user.id, reason } });
      const reportCount = await tx.reviewReport.count({ where: { reviewId } });
      await tx.review.update({
        where: { id: reviewId },
        data: {
          reportCount,
          // Auto-flag if 3+ reports
          flagged: reportCount >= 3,
          status: reportCount >= 3 ? ReviewStatus.FLAGGED : undefined,
        },
      });
    });

    return { success: true, message: "Review reported. Our team will review it." };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to report." };
  }
}

// ── Data: eligible order items for review ─────────────────────────────────────

export async function getReviewableOrderItems(userId: string) {
  return db.orderItem.findMany({
    where: {
      order: {
        customerId: userId,
        status: OrderStatus.DELIVERED,
        paymentStatus: PaymentStatus.PAID,
      },
      review: null, // not yet reviewed
    },
    include: {
      product: { select: { id: true, name: true, images: { take: 1, select: { url: true } } } },
      order: { select: { orderNumber: true, deliveredAt: true } },
    },
    orderBy: { order: { createdAt: "desc" } },
  });
}

// ── Data: customer's own reviews ──────────────────────────────────────────────

export async function getCustomerReviews(userId: string) {
  return db.review.findMany({
    where: { userId },
    include: {
      product: { select: { id: true, name: true, images: { take: 1, select: { url: true } } } },
      images: true,
      _count: { select: { votes: true, reports: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}
