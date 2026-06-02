import {
  BadgePercent,
  Boxes,
  CircleDollarSign,
  RefreshCcw,
  ShoppingCart,
  Store,
  Users,
  WalletCards,
} from "lucide-react";

import { StatCard } from "@/components/dashboard/stat-card";
import { formatCurrency } from "@/lib/format";
import type { getAdminDashboardStats } from "@/lib/admin/dashboard-data";

type Stats = Awaited<ReturnType<typeof getAdminDashboardStats>>;

export function AdminStatCards({ stats }: { stats: Stats }) {
  const growthLabel = stats.revenueGrowth
    ? `${Number(stats.revenueGrowth) >= 0 ? "+" : ""}${stats.revenueGrowth}% vs last month`
    : "This month";

  const cards = [
    {
      title: "Total Revenue",
      value: formatCurrency(stats.totalRevenue),
      helper: growthLabel,
      icon: CircleDollarSign,
    },
    {
      title: "Total Orders",
      value: stats.totalOrders.toLocaleString(),
      helper: "All time orders",
      icon: ShoppingCart,
    },
    {
      title: "Active Vendors",
      value: stats.totalVendors.toLocaleString(),
      helper: `${stats.pendingVendorApprovals} pending approval`,
      icon: Store,
    },
    {
      title: "Customers",
      value: stats.totalCustomers.toLocaleString(),
      helper: "Registered customers",
      icon: Users,
    },
    {
      title: "Active Products",
      value: stats.totalProducts.toLocaleString(),
      helper: "Live in catalog",
      icon: Boxes,
    },
    {
      title: "Pending Withdrawals",
      value: stats.pendingWithdrawals.toLocaleString(),
      helper: "Awaiting processing",
      icon: WalletCards,
    },
    {
      title: "Pending Approvals",
      value: stats.pendingVendorApprovals.toLocaleString(),
      helper: "Vendor applications",
      icon: BadgePercent,
    },
    {
      title: "Refund Requests",
      value: stats.pendingRefunds.toLocaleString(),
      helper: "Awaiting decision",
      icon: RefreshCcw,
    },
  ] as const;

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <StatCard key={card.title} {...card} />
      ))}
    </div>
  );
}
