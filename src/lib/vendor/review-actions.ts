"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { NotificationType } from "@prisma/client";

import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { upsertVendorTrustScore } from "@/lib/trust-score";
import { createNotification } from "@/lib/notifications";

type ActionResult = { success: true; message: string } | { success: false; error: string };

async function requireVendor() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");
  if (session.user.role !== "VENDOR") throw new Error("Forbidden");
  const vendor = await db.vendorProfile.findUnique({ where: { userId: session.user.id } });
  if (!vendor) throw new Error("Vendor profile not found");
  return vendor;
}

const replySchema = z.object({
  reviewId: z.string().min(1),
  reply: z.string().min(5, "Reply must be at least 5 characters").max(1000),
});

export async function replyToReviewAction(data: z.infer<typeof replySchema>): Promise<ActionResult> {
  try {
    const vendor = await requireVendor();
    const parsed = replySchema.safeParse(data);
    if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

    const { reviewId, reply } = parsed.data;

    // Verify this review belongs to vendor's products
    const review = await db.review.findFirst({
      where: { id: reviewId, product: { vendorId: vendor.id } },
      include: { user: { select: { id: true } } },
    });
    if (!review) return { success: false, error: "Review not found." };

    await db.review.update({
      where: { id: reviewId },
      data: { vendorReply: reply, vendorRepliedAt: new Date() },
    });

    // Notify the reviewer
    await createNotification({
      userId: review.user.id,
      type: NotificationType.REVIEW,
      title: "Vendor replied to your review",
      body: `"${reply.slice(0, 120)}${reply.length > 120 ? "…" : ""}"`,
      url: "/customer/reviews",
    });

    // Update trust score (response rate changed)
    upsertVendorTrustScore(vendor.id).catch(() => {});

    revalidatePath("/vendor/reviews");
    return { success: true, message: "Reply posted successfully." };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to post reply." };
  }
}

export async function deleteReplyAction(reviewId: string): Promise<ActionResult> {
  try {
    const vendor = await requireVendor();
    const review = await db.review.findFirst({
      where: { id: reviewId, product: { vendorId: vendor.id } },
    });
    if (!review) return { success: false, error: "Review not found." };

    await db.review.update({
      where: { id: reviewId },
      data: { vendorReply: null, vendorRepliedAt: null },
    });

    upsertVendorTrustScore(vendor.id).catch(() => {});
    revalidatePath("/vendor/reviews");
    return { success: true, message: "Reply removed." };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to remove reply." };
  }
}
