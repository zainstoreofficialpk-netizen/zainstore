import { Bell, Heart, MapPin, MessageSquare, ShoppingCart } from "lucide-react";

import { ModuleTable } from "@/components/dashboard/module-table";
import { StatCard } from "@/components/dashboard/stat-card";

const stats = [
  { title: "Orders", value: "18", helper: "2 currently active", icon: ShoppingCart },
  { title: "Addresses", value: "3", helper: "Primary shipping selected", icon: MapPin },
  { title: "Wishlist", value: "24", helper: "Saved products", icon: Heart },
  { title: "Reviews", value: "11", helper: "2 waiting moderation", icon: MessageSquare },
  { title: "Notifications", value: "5", helper: "Unread account alerts", icon: Bell },
];

const rows = [
  ["ZS-10482", "Urban Loom", "PKR 8,499", "Paid", "Processing"],
  ["ZS-10481", "Gadget Yard", "PKR 12,999", "Paid", "Shipped"],
  ["ZS-10479", "Urban Loom", "PKR 2,999", "Refunded", "Refunded"],
];

export default function CustomerDashboardPage() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>
      <ModuleTable
        title="Customer Orders"
        description="Customers only access their own orders, addresses, wishlist, reviews, support tickets, and notifications."
        columns={["Order", "Vendor", "Total", "Payment", "Status"]}
        rows={rows}
      />
    </div>
  );
}
