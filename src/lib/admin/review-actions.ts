"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { ReviewStatus, NotificationType } from "@prisma/client";

import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { upsertVendorTrustScore } from "@/lib/trust-score";
import { createNotification } from "@/lib/notifications";

type ActionResult = { success: true; message: string } | { success: false; error: string };

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "SUPER_ADMIN") throw new Error("Unauthorized");
  return session.user;
}

async function refreshTrustScoreForReview(reviewId: string) {
  const review = await db.review.findUnique({
    where: { id: reviewId },
    select: { productId: true },
  });
  if (!review?.productId) return;
  const product = await db.product.findUnique({
    where: { id: review.productId },
    select: { vendorId: true },
  });
  if (product) upsertVendorTrustScore(product.vendorId).catch(() => {});
}

export async function approveReviewAction(reviewId: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    await db.review.update({
      where: { id: reviewId },
      data: { status: ReviewStatus.APPROVED, flagged: false },
    });
    await refreshTrustScoreForReview(reviewId);
    revalidatePath("/admin/reviews");
    return { success: true, message: "Review approved and published." };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to approve." };
  }
}

export async function rejectReviewAction(reviewId: string, reason?: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const review = await db.review.findUnique({
      where: { id: reviewId },
      include: { user: { select: { id: true } } },
    });
    if (!review) return { success: false, error: "Review not found." };

    await db.review.update({
      where: { id: reviewId },
      data: { status: ReviewStatus.REJECTED, flagged: false },
    });

    if (review.user) {
      await createNotification({
        userId: review.user.id,
        type: NotificationType.REVIEW,
        title: "Your review was not published",
        body: reason ?? "Your review did not meet our community guidelines and was removed.",
        url: "/customer/reviews",
      });
    }

    await refreshTrustScoreForReview(reviewId);
    revalidatePath("/admin/reviews");
    return { success: true, message: "Review rejected." };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to reject." };
  }
}

export async function flagReviewAction(reviewId: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const review = await db.review.findUnique({ where: { id: reviewId } });
    if (!review) return { success: false, error: "Review not found." };

    await db.review.update({
      where: { id: reviewId },
      data: { flagged: !review.flagged, status: !review.flagged ? ReviewStatus.FLAGGED : ReviewStatus.PENDING },
    });

    revalidatePath("/admin/reviews");
    return { success: true, message: review.flagged ? "Flag removed." : "Review flagged for moderation." };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to flag." };
  }
}

export async function deleteReviewAction(reviewId: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const review = await db.review.findUnique({
      where: { id: reviewId },
      include: { user: { select: { id: true } } },
    });
    if (!review) return { success: false, error: "Review not found." };

    await db.review.delete({ where: { id: reviewId } });

    if (review.user) {
      await createNotification({
        userId: review.user.id,
        type: NotificationType.REVIEW,
        title: "Your review was removed",
        body: "Your review was removed by our moderation team for violating community guidelines.",
        url: "/customer/reviews",
      });
    }

    await refreshTrustScoreForReview(reviewId);
    revalidatePath("/admin/reviews");
    return { success: true, message: "Review deleted." };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to delete." };
  }
}

export async function dismissReportsAction(reviewId: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    await db.$transaction([
      db.reviewReport.deleteMany({ where: { reviewId } }),
      db.review.update({
        where: { id: reviewId },
        data: { reportCount: 0, flagged: false, status: ReviewStatus.APPROVED },
      }),
    ]);
    revalidatePath("/admin/reviews");
    return { success: true, message: "Reports dismissed. Review approved." };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to dismiss reports." };
  }
}
