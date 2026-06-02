import { Suspense } from "react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth/config";
import {
  getAdminDashboardStats,
  getPendingActionCounts,
  getRecentOrders,
  getRecentVendors,
  getTopSellingProducts,
  getTopVendors,
  getLowStockProducts,
  getPendingVendors,
  getPendingWithdrawals,
  getPendingRefunds,
} from "@/lib/admin/dashboard-data";

import { AdminStatCards } from "@/components/admin/admin-stat-cards";
import { AdminRevenueChart } from "@/components/admin/admin-revenue-chart";
import { AdminPendingActions } from "@/components/admin/admin-pending-actions";
import { RecentOrdersTable } from "@/components/admin/recent-orders-table";
import { RecentVendorsTable } from "@/components/admin/recent-vendors-table";
import { TopProductsTable } from "@/components/admin/top-products-table";
import { TopVendorsTable } from "@/components/admin/top-vendors-table";
import { LowStockAlerts } from "@/components/admin/low-stock-alerts";
import { PendingQueue } from "@/components/admin/pending-queue";

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "SUPER_ADMIN") redirect("/login");

  const [
    stats,
    pendingCounts,
    recentOrders,
    recentVendors,
    topProducts,
    topVendors,
    lowStockProducts,
    pendingVendors,
    pendingWithdrawals,
    pendingRefunds,
  ] = await Promise.all([
    getAdminDashboardStats(),
    getPendingActionCounts(),
    getRecentOrders(8),
    getRecentVendors(6),
    getTopSellingProducts(5),
    getTopVendors(5),
    getLowStockProducts(6),
    getPendingVendors(5),
    getPendingWithdrawals(5),
    getPendingRefunds(5),
  ]);

  return (
    <div className="space-y-8">
      {/* Stats grid */}
      <AdminStatCards stats={stats} />

      {/* Revenue chart + pending action counts */}
      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-zinc-100" />}>
          <AdminRevenueChart />
        </Suspense>
        <AdminPendingActions counts={pendingCounts} />
      </div>

      {/* Recent orders + recent vendor registrations */}
      <div className="grid gap-6 xl:grid-cols-2">
        <RecentOrdersTable orders={recentOrders} />
        <RecentVendorsTable vendors={recentVendors} />
      </div>

      {/* Top products + top vendors */}
      <div className="grid gap-6 xl:grid-cols-2">
        <TopProductsTable products={topProducts} />
        <TopVendorsTable vendors={topVendors} />
      </div>

      {/* Low stock alerts */}
      <LowStockAlerts products={lowStockProducts} />

      {/* Pending actions queue — full approve/reject UI */}
      <div>
        <h2 className="mb-4 text-base font-semibold text-zinc-900">Pending Actions Queue</h2>
        <PendingQueue
          pendingVendors={pendingVendors}
          pendingWithdrawals={pendingWithdrawals}
          pendingRefunds={pendingRefunds}
        />
      </div>
    </div>
  );
}
