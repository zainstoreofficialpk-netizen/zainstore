"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";

type ActionResult = { success: true; message: string } | { success: false; error: string };

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");
  if (session.user.role !== "SUPER_ADMIN") throw new Error("Forbidden");
  return session.user;
}

const GLOBAL_RATE_KEY = "commission.global_rate";

const rateSchema = z.object({
  rate: z.coerce.number().min(0, "Rate cannot be negative").max(100, "Rate cannot exceed 100%"),
});

export async function setGlobalCommissionRate(rate: number): Promise<ActionResult> {
  try {
    await requireAdmin();
    const parsed = rateSchema.safeParse({ rate });
    if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

    await db.settings.upsert({
      where: { key: GLOBAL_RATE_KEY },
      create: {
        key: GLOBAL_RATE_KEY,
        value: { rate: parsed.data.rate },
        group: "commission",
        description: "Global marketplace commission rate applied to all vendor sales (%)",
      },
      update: { value: { rate: parsed.data.rate } },
    });

    revalidatePath("/admin/commissions");
    return { success: true, message: `Global commission rate set to ${parsed.data.rate}%.` };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to update rate." };
  }
}

export async function setVendorCommissionOverride(
  vendorId: string,
  rate: number | null,
): Promise<ActionResult> {
  try {
    await requireAdmin();

    await db.vendorProfile.update({
      where: { id: vendorId },
      data: { commissionValue: rate === null ? null : rate },
    });

    revalidatePath("/admin/commissions");
    revalidatePath(`/admin/vendors/${vendorId}`);
    return {
      success: true,
      message: rate === null ? "Vendor override removed — using global rate." : `Vendor rate set to ${rate}%.`,
    };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to update vendor rate." };
  }
}
