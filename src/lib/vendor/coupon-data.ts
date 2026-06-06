import { db } from "@/lib/db";

export async function getVendorCoupons(vendorId: string) {
  return db.coupon.findMany({
    where: { vendorId },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { usages: true } } },
  });
}

export async function getVendorCoupon(couponId: string, vendorId: string) {
  return db.coupon.findFirst({
    where: { id: couponId, vendorId },
  });
}

export async function getVendorCouponStats(vendorId: string) {
  const [total, active, expired] = await Promise.all([
    db.coupon.count({ where: { vendorId } }),
    db.coupon.count({ where: { vendorId, active: true } }),
    db.coupon.count({
      where: { vendorId, expiresAt: { lt: new Date() } },
    }),
  ]);
  return { total, active, expired };
}
