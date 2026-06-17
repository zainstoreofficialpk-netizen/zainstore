"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";

type ActionResult<T = void> =
  | { success: true; message: string; data?: T }
  | { success: false; error: string };

async function requireVendor() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");
  if (session.user.role !== "VENDOR") throw new Error("Forbidden");
  const vendor = await db.vendorProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!vendor) throw new Error("Vendor profile not found");
  return { user: session.user, vendor };
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

export type CouponFormData = z.infer<typeof couponSchema>;

export async function createCouponAction(raw: CouponFormData): Promise<ActionResult<{ id: string }>> {
  try {
    const { vendor } = await requireVendor();
    const parsed = couponSchema.safeParse(raw);
    if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

    const { code, name, type, value, startsAt, expiresAt, usageLimit, minOrderAmount, active } = parsed.data;

    if (type === "PERCENTAGE" && value > 100) {
      return { success: false, error: "Percentage discount cannot exceed 100%" };
    }

    const existing = await db.coupon.findUnique({ where: { code } });
    if (existing) return { success: false, error: "A coupon with this code already exists" };

    const coupon = await db.coupon.create({
      data: {
        code,
        name,
        type,
        value,
        vendorId: vendor.id,
        active,
        startsAt: startsAt ? new Date(startsAt) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        usageLimit: usageLimit ? Number(usageLimit) : null,
        minOrderAmount: minOrderAmount ? Number(minOrderAmount) : null,
      },
    });

    revalidatePath("/vendor/coupons");
    return { success: true, message: "Coupon created successfully", data: { id: coupon.id } };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to create coupon";
    return { success: false, error: msg };
  }
}

export async function updateCouponAction(couponId: string, raw: CouponFormData): Promise<ActionResult> {
  try {
    const { vendor } = await requireVendor();
    const parsed = couponSchema.safeParse(raw);
    if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

    const { code, name, type, value, startsAt, expiresAt, usageLimit, minOrderAmount, active } = parsed.data;

    if (type === "PERCENTAGE" && value > 100) {
      return { success: false, error: "Percentage discount cannot exceed 100%" };
    }

    const coupon = await db.coupon.findFirst({ where: { id: couponId, vendorId: vendor.id } });
    if (!coupon) return { success: false, error: "Coupon not found" };

    const codeConflict = await db.coupon.findFirst({ where: { code, NOT: { id: couponId } } });
    if (codeConflict) return { success: false, error: "A coupon with this code already exists" };

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

    revalidatePath("/vendor/coupons");
    return { success: true, message: "Coupon updated successfully" };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to update coupon";
    return { success: false, error: msg };
  }
}

export async function deleteCouponAction(couponId: string): Promise<ActionResult> {
  try {
    const { vendor } = await requireVendor();
    const coupon = await db.coupon.findFirst({ where: { id: couponId, vendorId: vendor.id } });
    if (!coupon) return { success: false, error: "Coupon not found" };

    await db.coupon.delete({ where: { id: couponId } });
    revalidatePath("/vendor/coupons");
    return { success: true, message: "Coupon deleted" };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to delete coupon";
    return { success: false, error: msg };
  }
}

export async function toggleCouponStatusAction(couponId: string): Promise<ActionResult> {
  try {
    const { vendor } = await requireVendor();
    const coupon = await db.coupon.findFirst({ where: { id: couponId, vendorId: vendor.id } });
    if (!coupon) return { success: false, error: "Coupon not found" };

    await db.coupon.update({ where: { id: couponId }, data: { active: !coupon.active } });
    revalidatePath("/vendor/coupons");
    return { success: true, message: coupon.active ? "Coupon deactivated" : "Coupon activated" };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to update coupon";
    return { success: false, error: msg };
  }
}
