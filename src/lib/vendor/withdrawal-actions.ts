"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { WithdrawalStatus, PayoutMethod } from "@prisma/client";

import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { getVendorBalance, getOpenWithdrawalRequest } from "@/lib/vendor/withdrawal-data";

type ActionResult = { success: true; message: string } | { success: false; error: string };

async function requireVendor() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");
  if (session.user.role !== "VENDOR") throw new Error("Forbidden");
  const vendor = await db.vendorProfile.findUnique({ where: { userId: session.user.id } });
  if (!vendor) throw new Error("Vendor profile not found");
  return vendor;
}

const requestSchema = z.object({
  amount: z.coerce.number().positive("Amount must be positive"),
  method: z.nativeEnum(PayoutMethod),
});

export async function submitWithdrawalRequest(formData: FormData): Promise<ActionResult> {
  try {
    const vendor = await requireVendor();

    const parsed = requestSchema.safeParse({
      amount: formData.get("amount"),
      method: formData.get("method"),
    });
    if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

    const { amount, method } = parsed.data;

    // Guard: no in-flight request already (REQUESTED, APPROVED, or PROCESSING)
    const open = await getOpenWithdrawalRequest(vendor.id);
    if (open) {
      return {
        success: false,
        error: "You already have a withdrawal request in progress. Wait for it to be resolved first.",
      };
    }

    // Guard: sufficient available balance
    const balance = await getVendorBalance(vendor.id);
    if (amount > balance.available) {
      return {
        success: false,
        error: `Requested amount exceeds available balance of PKR ${balance.available.toLocaleString()}.`,
      };
    }

    await db.withdrawal.create({
      data: {
        vendorId: vendor.id,
        amount,
        method,
        status: WithdrawalStatus.REQUESTED,
        initiatedByAdmin: false,
      },
    });

    revalidatePath("/vendor/withdrawals");
    return { success: true, message: "Withdrawal request submitted. Admin will process it on the weekly payout schedule." };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to submit request." };
  }
}

export async function cancelWithdrawalRequest(withdrawalId: string): Promise<ActionResult> {
  try {
    const vendor = await requireVendor();
    const w = await db.withdrawal.findUnique({ where: { id: withdrawalId } });
    if (!w || w.vendorId !== vendor.id) return { success: false, error: "Not found." };

    // Only REQUESTED withdrawals can be cancelled by the vendor.
    // APPROVED or PROCESSING means admin has already started work — vendor must contact admin.
    if (w.status !== WithdrawalStatus.REQUESTED) {
      return {
        success: false,
        error: "Only pending (not yet reviewed) requests can be cancelled. Contact admin to cancel an in-progress withdrawal.",
      };
    }

    await db.withdrawal.update({
      where: { id: withdrawalId },
      data: { status: WithdrawalStatus.CANCELLED, processedAt: new Date() },
    });

    revalidatePath("/vendor/withdrawals");
    revalidatePath("/admin/withdrawals");
    return { success: true, message: "Withdrawal request cancelled. Your full balance is now available again." };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to cancel." };
  }
}
