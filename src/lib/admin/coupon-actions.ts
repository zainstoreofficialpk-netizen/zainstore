"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";

type ActionResult<T = void> =
  | { success: true; message: string; data?: T }
  | { success: false; error: string };

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");
  if (session.user.role !== "SUPER_ADMIN") throw new Error("Forbidden");
  return session.user;
}

const couponSchema = z.object({
  code: z.string().min(3).max(32).toUpperCase(),
  name: z.string().min(2).max(100),
  type: z.enum(["PERCENTAGE", "FIXED"]),
  value: z.coerce.number().positive(),
  startsAt: z.string().optional(),
  expiresAt: z.string().optional(),
  usageLimit: z.coerce.number().int().positive().optional().or(z.literal("")),
  minOrderAmount: z.coerce.number().nonnegative().optional().or(z.literal("")),
  active: z.coerce.boolean().default(true),
});

export type AdminCouponFormData = z.infer<typeof couponSchema>;

export async function adminCreateCouponAction(
  raw: AdminCouponFormData,
): Promise<ActionResult<{ id: string }>> {
  try {
    await requireAdmin();
    const parsed = couponSchema.safeParse(raw);
    if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

    const { code, name, type, value, startsAt, expiresAt, usageLimit, minOrderAmount, active } =
      parsed.data;

    if (type === "PERCENTAGE" && value > 100)
      return { success: false, error: "Percentage cannot exceed 100%" };

    const existing = await db.coupon.findUnique({ where: { code } });
    if (existing) return { success: false, error: "A coupon with this code already exists" };

    const coupon = await db.coupon.create({
      data: {
        code,
        name,
        type,
        value,
        active,
        vendorId: null,
        startsAt: startsAt ? new Date(startsAt) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        usageLimit: usageLimit ? Number(usageLimit) : null,
        minOrderAmount: minOrderAmount ? Number(minOrderAmount) : null,
      },
    });

    revalidatePath("/admin/coupons");
    return { success: true, message: "Coupon created", data: { id: coupon.id } };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to create coupon" };
  }
}

export async function adminUpdateCouponAction(
  couponId: string,
  raw: AdminCouponFormData,
): Promise<ActionResult> {
  try {
    await requireAdmin();
    const parsed = couponSchema.safeParse(raw);
    if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

    const { code, name, type, value, startsAt, expiresAt, usageLimit, minOrderAmount, active } =
      parsed.data;

    if (type === "PERCENTAGE" && value > 100)
      return { success: false, error: "Percentage cannot exceed 100%" };

    const existing = await db.coupon.findUnique({ where: { id: couponId } });
    if (!existing) return { success: false, error: "Coupon not found" };

    const codeConflict = await db.coupon.findFirst({ where: { code, NOT: { id: couponId } } });
    if (codeConflict) return { success: false, error: "Code already used by another coupon" };

    await db.coupon.update({
      where: { id: couponId },
      data: {
        code,
        name,
        type,
        value,
        active,
        startsAt: startsAt ? new Date(startsAt) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        usageLimit: usageLimit ? Number(usageLimit) : null,
        minOrderAmount: minOrderAmount ? Number(minOrderAmount) : null,
      },
    });

    revalidatePath("/admin/coupons");
    return { success: true, message: "Coupon updated" };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to update coupon" };
  }
}

export async function adminDeleteCouponAction(couponId: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const coupon = await db.coupon.findUnique({ where: { id: couponId } });
    if (!coupon) return { success: false, error: "Coupon not found" };

    await db.coupon.delete({ where: { id: couponId } });
    revalidatePath("/admin/coupons");
    return { success: true, message: "Coupon deleted" };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to delete coupon" };
  }
}

export async function adminToggleCouponAction(couponId: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const coupon = await db.coupon.findUnique({ where: { id: couponId } });
    if (!coupon) return { success: false, error: "Coupon not found" };

    await db.coupon.update({ where: { id: couponId }, data: { active: !coupon.active } });
    revalidatePath("/admin/coupons");
    return { success: true, message: coupon.active ? "Coupon deactivated" : "Coupon activated" };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to update coupon" };
  }
}
