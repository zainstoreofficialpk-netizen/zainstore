import { ModulePage } from "@/components/dashboard/module-page";
import { couponRows } from "@/lib/dashboard/sample-data";

export default function CouponsPage() {
  return (
    <ModulePage
      title="Coupon Management"
      description="Create marketplace-wide coupons with percentage, fixed, or free shipping discounts and restrict usage by product, category, or vendor."
      columns={["Code", "Type", "Value", "Limit", "Restriction", "Status"]}
      rows={couponRows}
      capabilities={["Usage Limits", "Expiry Dates", "Minimum Order", "Used By Report"]}
    />
  );
}
