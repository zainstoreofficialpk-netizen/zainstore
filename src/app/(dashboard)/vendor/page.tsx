import { Boxes, CircleDollarSign, ShoppingCart, Star, WalletCards } from "lucide-react";

import { ModuleTable } from "@/components/dashboard/module-table";
import { StatCard } from "@/components/dashboard/stat-card";

const stats = [
  { title: "Store Revenue", value: "PKR 1.2M", helper: "Available after admin approval", icon: CircleDollarSign },
  { title: "Products", value: "42", helper: "3 low-stock alerts", icon: Boxes },
  { title: "Orders", value: "318", helper: "12 processing", icon: ShoppingCart },
  { title: "Withdrawals", value: "PKR 250K", helper: "1 pending request", icon: WalletCards },
  { title: "Reviews", value: "4.7", helper: "Store + product rating", icon: Star },
];

const rows = [
  ["ZS-10482", "Cotton Overshirt", "PKR 8,499", "Paid", "Processing"],
  ["ZS-10460", "Cotton Overshirt", "PKR 3,499", "Paid", "Delivered"],
  ["ZS-10451", "Linen Shirt", "PKR 2,999", "Refunded", "Refunded"],
];

export default function VendorDashboardPage() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>
      <ModuleTable
        title="Vendor Orders"
        description="Vendors only see their own order items, fulfillment status, refund requests, earnings, and ledger impacts."
        columns={["Order", "Product", "Total", "Payment", "Status"]}
        rows={rows}
      />
    </div>
  );
}
