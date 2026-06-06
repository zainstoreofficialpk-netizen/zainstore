import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * POST /api/vendor/coupons/validate
 *
 * Validates a coupon at checkout and returns the discount amount.
 *
 * Body: { code: string; vendorId: string; orderAmount: number }
 *
 * Only coupons owned by the specified vendor are eligible.
 * The discount is applied only to the eligible vendor's portion of the order.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { code, vendorId, orderAmount } = body as {
      code: string;
      vendorId: string;
      orderAmount: number;
    };

    if (!code || !vendorId || typeof orderAmount !== "number") {
      return NextResponse.json({ valid: false, error: "Missing required fields" }, { status: 400 });
    }

    const coupon = await db.coupon.findFirst({
      where: { code: code.toUpperCase(), vendorId },
    });

    if (!coupon) {
      return NextResponse.json({ valid: false, error: "Coupon not found or does not apply to this store" });
    }

    if (!coupon.active) {
      return NextResponse.json({ valid: false, error: "This coupon is inactive" });
    }

    const now = new Date();
    if (coupon.startsAt && coupon.startsAt > now) {
      return NextResponse.json({ valid: false, error: "This coupon is not yet active" });
    }
    if (coupon.expiresAt && coupon.expiresAt < now) {
      return NextResponse.json({ valid: false, error: "This coupon has expired" });
    }

    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
      return NextResponse.json({ valid: false, error: "This coupon has reached its usage limit" });
    }

    if (coupon.minOrderAmount !== null && orderAmount < Number(coupon.minOrderAmount)) {
      return NextResponse.json({
        valid: false,
        error: `Minimum order amount of PKR ${Number(coupon.minOrderAmount).toLocaleString("en-PK")} required`,
      });
    }

    let discountAmount = 0;
    if (coupon.type === "PERCENTAGE") {
      discountAmount = (orderAmount * Number(coupon.value)) / 100;
    } else {
      discountAmount = Math.min(Number(coupon.value), orderAmount);
    }

    return NextResponse.json({
      valid: true,
      couponId: coupon.id,
      code: coupon.code,
      name: coupon.name,
      type: coupon.type,
      discountAmount: Math.round(discountAmount),
    });
  } catch {
    return NextResponse.json({ valid: false, error: "Server error" }, { status: 500 });
  }
}
