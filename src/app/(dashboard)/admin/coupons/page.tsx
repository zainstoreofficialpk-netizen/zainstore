import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { AdminCouponManager } from "@/components/admin/coupon-manager";

export default async function AdminCouponsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "SUPER_ADMIN") redirect("/login");

  const coupons = await db.coupon.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { usages: true } },
      vendor: { select: { store: { select: { name: true } } } },
    },
  });

  return <AdminCouponManager coupons={coupons} />;
}
