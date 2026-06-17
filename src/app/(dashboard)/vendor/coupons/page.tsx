import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth/config";
import { getVendorStore } from "@/lib/vendor/product-data";
import { getVendorCoupons, getVendorCouponStats } from "@/lib/vendor/coupon-data";
import { CouponTable } from "@/components/vendor/coupon-table";

export default async function VendorCouponsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const vendorStore = await getVendorStore(session.user.id);
  if (!vendorStore) redirect("/vendor");

  const vendorId = vendorStore.id;

  const [coupons, stats] = await Promise.all([
    getVendorCoupons(vendorId),
    getVendorCouponStats(vendorId),
  ]);

  return <CouponTable coupons={coupons} stats={stats} storeName={vendorStore.store?.name ?? "Your Store"} />;
}
