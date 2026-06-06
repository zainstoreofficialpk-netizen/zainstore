import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { authOptions } from "@/lib/auth/config";
import { getVendorStore } from "@/lib/vendor/product-data";
import { CouponForm } from "@/components/vendor/coupon-form";

export default async function NewCouponPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const vendorStore = await getVendorStore(session.user.id);
  if (!vendorStore) redirect("/vendor");

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/vendor/coupons"
          className="mb-2 inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-700"
        >
          <ChevronLeft className="size-3.5" /> Back to Coupons
        </Link>
        <h2 className="text-lg font-bold text-zinc-950">Create Coupon</h2>
        <p className="mt-0.5 text-sm text-zinc-400">
          This coupon will only apply to your store's products.
        </p>
      </div>
      <CouponForm />
    </div>
  );
}
