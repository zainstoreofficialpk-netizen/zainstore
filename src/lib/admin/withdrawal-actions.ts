"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { WithdrawalStatus, PayoutMethod, NotificationType } from "@prisma/client";

import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { calcVendorBalance } from "@/lib/admin/withdrawal-data";
import { sendEmail, withdrawalPaidEmailHtml } from "@/lib/email";
import { createNotification } from "@/lib/notifications";

type ActionResult = { success: true; message: string } | { success: false; error: string };

// Statuses that can still be acted on (not yet in a terminal state)
const ACTIONABLE_STATUSES: WithdrawalStatus[] = [
  WithdrawalStatus.REQUESTED,
  WithdrawalStatus.APPROVED,
  WithdrawalStatus.PROCESSING,
];

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");
  if (session.user.role !== "SUPER_ADMIN") throw new Error("Forbidden");
  return session.user;
}

async function notifyVendor(vendorId: string, title: string, body: string) {
  const vendor = await db.vendorProfile.findUnique({
    where: { id: vendorId },
    select: { userId: true },
  });
  if (!vendor) return;
  await createNotification({
    userId: vendor.userId,
    type: NotificationType.WITHDRAWAL,
    title,
    body,
    url: "/vendor/withdrawals",
  });
}

// ── Admin creates a payout (no vendor request needed) ─────────────────────────

const createPayoutSchema = z.object({
  vendorId: z.string().min(1),
  amount: z.coerce.number().positive("Amount must be positive"),
  method: z.nativeEnum(PayoutMethod),
  note: z.string().optional(),
  reference: z.string().optional(),
});

export async function adminCreatePayout(formData: FormData): Promise<ActionResult> {
  try {
    await requireAdmin();

    const parsed = createPayoutSchema.safeParse({
      vendorId: formData.get("vendorId"),
      amount: formData.get("amount"),
      method: formData.get("method"),
      note: formData.get("note") || undefined,
      reference: formData.get("reference") || undefined,
    });
    if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

    const { vendorId, amount, method, note, reference } = parsed.data;

    const balance = await calcVendorBalance(vendorId);
    if (amount > balance.available) {
      return {
        success: false,
        error: `Amount (PKR ${amount.toLocaleString()}) exceeds available balance (PKR ${balance.available.toLocaleString()}).`,
      };
    }

    const isPaid = !!reference;
    await db.withdrawal.create({
      data: {
        vendorId,
        amount,
        method,
        status: isPaid ? WithdrawalStatus.PAID : WithdrawalStatus.PROCESSING,
        initiatedByAdmin: true,
        adminNote: note,
        reference: reference || null,
        processedAt: new Date(),
        paidAt: isPaid ? new Date() : null,
      },
    });

    await notifyVendor(
      vendorId,
      isPaid ? "Payout Sent" : "Payout Processing",
      isPaid
        ? `PKR ${amount.toLocaleString()} has been transferred to your account via ${method.replace(/_/g, " ")}.${reference ? ` Ref: ${reference}` : ""}`
        : `A payout of PKR ${amount.toLocaleString()} via ${method.replace(/_/g, " ")} is being processed.`,
    );

    revalidatePath("/admin/withdrawals");
    revalidatePath("/admin");
    return {
      success: true,
      message: isPaid
        ? `Payout of PKR ${amount.toLocaleString()} marked as Paid.`
        : `Payout of PKR ${amount.toLocaleString()} created and set to Processing.`,
    };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to create payout." };
  }
}

// ── Move REQUESTED → PROCESSING ───────────────────────────────────────────────

export async function processWithdrawal(withdrawalId: string, note?: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const w = await db.withdrawal.findUnique({ where: { id: withdrawalId } });
    if (!w) return { success: false, error: "Withdrawal not found." };
    if (w.status !== WithdrawalStatus.REQUESTED) {
      return { success: false, error: "Only REQUESTED withdrawals can be moved to Processing." };
    }

    await db.withdrawal.update({
      where: { id: withdrawalId },
      data: {
        status: WithdrawalStatus.PROCESSING,
        processedAt: new Date(),
        adminNote: note || null,
      },
    });

    await notifyVendor(
      w.vendorId,
      "Payout Processing",
      `Your withdrawal of PKR ${Number(w.amount).toLocaleString()} is now being processed.`,
    );

    revalidatePath("/admin/withdrawals");
    return { success: true, message: "Withdrawal moved to Processing." };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to process withdrawal." };
  }
}

// ── Mark REQUESTED or PROCESSING → PAID ──────────────────────────────────────

const markPaidSchema = z.object({
  reference: z.string().min(1, "Reference / transaction ID is required"),
  note: z.string().optional(),
});

export async function markWithdrawalPaid(withdrawalId: string, formData: FormData): Promise<ActionResult> {
  try {
    await requireAdmin();

    const parsed = markPaidSchema.safeParse({
      reference: formData.get("reference"),
      note: formData.get("note") || undefined,
    });
    if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

    const w = await db.withdrawal.findUnique({ where: { id: withdrawalId } });
    if (!w) return { success: false, error: "Withdrawal not found." };
    if (w.status !== WithdrawalStatus.PROCESSING && w.status !== WithdrawalStatus.REQUESTED) {
      return { success: false, error: "Withdrawal must be REQUESTED or PROCESSING to mark as Paid." };
    }

    await db.withdrawal.update({
      where: { id: withdrawalId },
      data: {
        status: WithdrawalStatus.PAID,
        reference: parsed.data.reference,
        adminNote: parsed.data.note || null,
        processedAt: w.processedAt ?? new Date(),
        paidAt: new Date(),
      },
    });

    await notifyVendor(
      w.vendorId,
      "Payout Sent ✓",
      `Your payout of PKR ${Number(w.amount).toLocaleString()} has been transferred. Reference: ${parsed.data.reference}`,
    );

    // Email the vendor
    void (async () => {
      try {
        const vendor = await db.vendorProfile.findUnique({
          where: { id: w.vendorId },
          select: { user: { select: { name: true, email: true } } },
        });
        if (vendor?.user?.email) {
          await sendEmail({
            to: vendor.user.email,
            subject: `Payout of PKR ${Number(w.amount).toLocaleString()} Sent — ZainStore.pk`,
            html: withdrawalPaidEmailHtml({
              vendorName: vendor.user.name ?? "Vendor",
              amount: Number(w.amount),
              method: w.method,
              reference: parsed.data.reference,
            }),
          });
        }
      } catch (emailErr) {
        console.error("Withdrawal paid email error:", emailErr);
      }
    })();

    revalidatePath("/admin/withdrawals");
    revalidatePath("/admin");
    return { success: true, message: "Withdrawal marked as Paid and vendor notified." };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to mark as paid." };
  }
}

// ── Reject a withdrawal (only while still actionable) ────────────────────────

export async function rejectWithdrawal(withdrawalId: string, reason: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    if (!reason?.trim()) return { success: false, error: "Rejection reason is required." };

    const w = await db.withdrawal.findUnique({ where: { id: withdrawalId } });
    if (!w) return { success: false, error: "Withdrawal not found." };

    if (!ACTIONABLE_STATUSES.includes(w.status)) {
      return {
        success: false,
        error: `Cannot reject a withdrawal with status "${w.status}". Only REQUESTED, APPROVED, or PROCESSING withdrawals can be rejected.`,
      };
    }

    await db.withdrawal.update({
      where: { id: withdrawalId },
      data: {
        status: WithdrawalStatus.REJECTED,
        rejectionReason: reason,
        processedAt: new Date(),
      },
    });

    await notifyVendor(
      w.vendorId,
      "Withdrawal Rejected",
      `Your withdrawal request of PKR ${Number(w.amount).toLocaleString()} was rejected. Reason: ${reason}. The amount has been returned to your available balance — you can submit a new request.`,
    );

    revalidatePath("/admin/withdrawals");
    return { success: true, message: "Withdrawal rejected and vendor notified. Balance automatically restored." };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to reject withdrawal." };
  }
}

// ── Bulk payout: create admin payouts for multiple vendors at once ─────────────

export async function bulkAdminPayout(
  vendorIds: string[],
  method: PayoutMethod,
  note?: string,
): Promise<ActionResult> {
  try {
    await requireAdmin();
    if (!vendorIds.length) return { success: false, error: "Select at least one vendor." };

    const results: string[] = [];
    let skipped = 0;

    for (const vendorId of vendorIds) {
      const balance = await calcVendorBalance(vendorId);
      if (balance.available <= 0) { skipped++; continue; }

      await db.withdrawal.create({
        data: {
          vendorId,
          amount: balance.available,
          method,
          status: WithdrawalStatus.PROCESSING,
          initiatedByAdmin: true,
          adminNote: note || "Weekly batch payout",
          processedAt: new Date(),
        },
      });

      await notifyVendor(
        vendorId,
        "Payout Processing",
        `A payout of PKR ${balance.available.toLocaleString()} via ${method.replace(/_/g, " ")} is being processed.`,
      );

      results.push(vendorId);
    }

    revalidatePath("/admin/withdrawals");
    revalidatePath("/admin");

    if (results.length === 0) {
      return { success: false, error: "No vendors had available balance to pay out." };
    }

    return {
      success: true,
      message: `Payouts created for ${results.length} vendor${results.length > 1 ? "s" : ""}${skipped > 0 ? ` (${skipped} skipped — zero balance)` : ""}.`,
    };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Bulk payout failed." };
  }
}
