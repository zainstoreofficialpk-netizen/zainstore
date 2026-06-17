"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { VendorStatus, WithdrawalStatus, RefundStatus, ProductStatus, NotificationType } from "@prisma/client";

import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { createNotification } from "@/lib/notifications";

type ActionResult = { success: true; message: string } | { success: false; error: string };

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");
  if (session.user.role !== "SUPER_ADMIN") throw new Error("Forbidden");
  return session.user;
}

// ── Vendor Actions ────────────────────────────────────────────────────────────

export async function approveVendor(vendorId: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    await db.vendorProfile.update({
      where: { id: vendorId },
      data: { status: VendorStatus.ACTIVE, approvedAt: new Date(), rejectedAt: null },
    });
    revalidatePath("/admin");
    revalidatePath("/admin/vendors");
    return { success: true, message: "Vendor approved successfully." };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to approve vendor." };
  }
}

export async function rejectVendor(vendorId: string, reason?: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    await db.vendorProfile.update({
      where: { id: vendorId },
      data: {
        status: VendorStatus.REJECTED,
        rejectedAt: new Date(),
        internalNotes: reason ?? null,
      },
    });
    revalidatePath("/admin");
    revalidatePath("/admin/vendors");
    return { success: true, message: "Vendor rejected." };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to reject vendor." };
  }
}

export async function suspendVendor(vendorId: string, reason?: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    await db.vendorProfile.update({
      where: { id: vendorId },
      data: {
        status: VendorStatus.SUSPENDED,
        suspendedAt: new Date(),
        internalNotes: reason ?? null,
      },
    });
    revalidatePath("/admin");
    revalidatePath("/admin/vendors");
    return { success: true, message: "Vendor suspended." };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to suspend vendor." };
  }
}

// ── Withdrawal Actions ────────────────────────────────────────────────────────

export async function approveWithdrawal(withdrawalId: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    await db.withdrawal.update({
      where: { id: withdrawalId },
      data: { status: WithdrawalStatus.APPROVED, processedAt: new Date() },
    });
    revalidatePath("/admin");
    revalidatePath("/admin/withdrawals");
    return { success: true, message: "Withdrawal approved." };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to approve withdrawal." };
  }
}

export async function rejectWithdrawal(withdrawalId: string, reason: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    await db.withdrawal.update({
      where: { id: withdrawalId },
      data: {
        status: WithdrawalStatus.REJECTED,
        rejectionReason: reason,
        processedAt: new Date(),
      },
    });
    revalidatePath("/admin");
    revalidatePath("/admin/withdrawals");
    return { success: true, message: "Withdrawal rejected." };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to reject withdrawal." };
  }
}

export async function markWithdrawalPaid(withdrawalId: string, reference: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    await db.withdrawal.update({
      where: { id: withdrawalId },
      data: {
        status: WithdrawalStatus.PAID,
        reference,
        processedAt: new Date(),
      },
    });
    revalidatePath("/admin");
    revalidatePath("/admin/withdrawals");
    return { success: true, message: "Withdrawal marked as paid." };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to mark withdrawal as paid." };
  }
}

// ── Refund Actions ────────────────────────────────────────────────────────────

export async function approveRefund(refundId: string, decision?: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    await db.refundRequest.update({
      where: { id: refundId },
      data: {
        status: RefundStatus.APPROVED,
        adminDecision: decision ?? "Approved by admin",
      },
    });
    revalidatePath("/admin");
    revalidatePath("/admin/refunds");
    return { success: true, message: "Refund approved." };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to approve refund." };
  }
}

export async function rejectRefund(refundId: string, decision: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    await db.refundRequest.update({
      where: { id: refundId },
      data: { status: RefundStatus.REJECTED, adminDecision: decision },
    });
    revalidatePath("/admin");
    revalidatePath("/admin/refunds");
    return { success: true, message: "Refund rejected." };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to reject refund." };
  }
}

// ── Product Actions ───────────────────────────────────────────────────────────

export async function approveProduct(productId: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    await db.product.update({
      where: { id: productId },
      data: { status: ProductStatus.ACTIVE, rejectionReason: null },
    });
    revalidatePath("/admin");
    revalidatePath("/admin/products");
    return { success: true, message: "Product approved and is now live." };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to approve product." };
  }
}

export async function rejectProduct(productId: string, reason: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const product = await db.product.update({
      where: { id: productId },
      data: { status: ProductStatus.REJECTED, rejectionReason: reason },
      include: { vendor: { select: { userId: true } } },
    });
    await createNotification({
      userId: product.vendor.userId,
      type: NotificationType.VENDOR,
      title: "Product Rejected",
      body: `Your product "${product.name}" was rejected. Reason: ${reason}`,
      url: "/vendor/products",
    });
    revalidatePath("/admin");
    revalidatePath("/admin/products");
    revalidatePath(`/admin/products/${productId}`);
    return { success: true, message: "Product rejected and vendor notified." };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to reject product." };
  }
}

export async function requestProductChanges(productId: string, note: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    if (!note.trim()) return { success: false, error: "Please describe what changes are needed." };
    const product = await db.product.update({
      where: { id: productId },
      data: { status: ProductStatus.CHANGES_REQUESTED, adminNote: note },
      include: { vendor: { select: { userId: true } } },
    });
    await createNotification({
      userId: product.vendor.userId,
      type: NotificationType.VENDOR,
      title: "Changes Requested for Product",
      body: `Your product "${product.name}" needs changes before it can go live. Admin note: ${note}`,
      url: "/vendor/products",
    });
    revalidatePath("/admin");
    revalidatePath("/admin/products");
    revalidatePath(`/admin/products/${productId}`);
    return { success: true, message: "Changes requested and vendor notified." };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to request changes." };
  }
}

export async function approveProductById(productId: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const product = await db.product.update({
      where: { id: productId },
      data: { status: ProductStatus.ACTIVE, rejectionReason: null, adminNote: null },
      include: { vendor: { select: { userId: true } } },
    });
    await createNotification({
      userId: product.vendor.userId,
      type: NotificationType.VENDOR,
      title: "Product Approved",
      body: `Great news! Your product "${product.name}" has been approved and is now live on ZainStore.`,
      url: "/vendor/products",
    });
    revalidatePath("/admin");
    revalidatePath("/admin/products");
    revalidatePath(`/admin/products/${productId}`);
    return { success: true, message: "Product approved and vendor notified." };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to approve product." };
  }
}

export async function toggleProductFeatured(productId: string, featured: boolean): Promise<ActionResult> {
  try {
    await requireAdmin();
    await db.product.update({ where: { id: productId }, data: { featured } });
    revalidatePath("/admin");
    revalidatePath("/admin/products");
    return { success: true, message: featured ? "Product marked as featured." : "Product removed from featured." };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to update product." };
  }
}

export async function toggleStoreFeatured(storeId: string, featured: boolean): Promise<ActionResult> {
  try {
    await requireAdmin();
    await db.store.update({ where: { id: storeId }, data: { featured } });
    revalidatePath("/admin/vendors");
    revalidatePath("/shop");
    return { success: true, message: featured ? "Store marked as featured." : "Store removed from featured." };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to update store." };
  }
}
