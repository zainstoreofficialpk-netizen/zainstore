import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";

export default async function AdminReportsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "SUPER_ADMIN") redirect("/login");

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalRevenue, monthRevenue, totalOrders, monthOrders,
    totalVendors, activeVendors, totalProducts, totalCustomers,
    topVendors, recentActivity,
  ] = await Promise.all([
    db.order.aggregate({ _sum: { grandTotal: true }, where: { paymentStatus: "PAID" } }),
    db.order.aggregate({ _sum: { grandTotal: true }, where: { paymentStatus: "PAID", createdAt: { gte: monthStart } } }),
    db.order.count(),
    db.order.count({ where: { createdAt: { gte: monthStart } } }),
    db.vendorProfile.count(),
    db.vendorProfile.count({ where: { status: "ACTIVE" } }),
    db.product.count({ where: { status: "ACTIVE" } }),
    db.user.count({ where: { role: "CUSTOMER" } }),
    db.orderItem.groupBy({ by: ["vendorId"], _sum: { lineTotal: true }, orderBy: { _sum: { lineTotal: "desc" } }, take: 5 }),
    db.order.findMany({ take: 5, orderBy: { createdAt: "desc" }, include: { customer: { select: { name: true } } } }),
  ]);

  const vendorIds = topVendors.map((v) => v.vendorId);
  const vendors = vendorIds.length > 0 ? await db.vendorProfile.findMany({
    where: { id: { in: vendorIds } },
    include: { store: { select: { name: true } } },
  }) : [];

  return (
    <div className="space-y-8">
      <div><h2 className="text-lg font-bold text-zinc-950">Reports & Analytics</h2>
        <p className="mt-0.5 text-sm text-zinc-400">Platform-wide performance overview with real data.</p></div>

      {/* KPI grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total Revenue", value: formatCurrency(Number(totalRevenue._sum.grandTotal ?? 0)), sub: `${formatCurrency(Number(monthRevenue._sum.grandTotal ?? 0))} this month` },
          { label: "Total Orders", value: totalOrders.toLocaleString(), sub: `${monthOrders} this month` },
          { label: "Active Vendors", value: activeVendors.toLocaleString(), sub: `${totalVendors} registered total` },
          { label: "Customers", value: totalCustomers.toLocaleString(), sub: `${totalProducts} active products` },
        ].map((s) => (
          <Card key={s.label}><CardContent className="pt-5">
            <p className="text-sm text-zinc-500">{s.label}</p>
            <p className="mt-1 text-2xl font-bold text-zinc-950">{s.value}</p>
            <p className="mt-1 text-xs text-zinc-400">{s.sub}</p>
          </CardContent></Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top vendors */}
        <Card>
          <CardHeader><CardTitle>Top Vendors by Revenue</CardTitle></CardHeader>
          <CardContent className="p-0">
            {topVendors.length === 0
              ? <p className="px-5 py-8 text-center text-sm text-zinc-400">No sales data yet.</p>
              : <div className="divide-y divide-zinc-50">
                  {topVendors.map((item, i) => {
                    const vendor = vendors.find((v) => v.id === item.vendorId);
                    return (
                      <div key={item.vendorId} className="flex items-center justify-between px-5 py-3">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-zinc-300">#{i+1}</span>
                          <span className="text-sm font-medium text-zinc-800">{vendor?.store?.name ?? "Unknown"}</span>
                        </div>
                        <span className="text-sm font-semibold text-brand-600">{formatCurrency(Number(item._sum.lineTotal ?? 0))}</span>
                      </div>
                    );
                  })}
                </div>}
          </CardContent>
        </Card>

        {/* Recent orders */}
        <Card>
          <CardHeader><CardTitle>Recent Orders</CardTitle></CardHeader>
          <CardContent className="p-0">
            {recentActivity.length === 0
              ? <p className="px-5 py-8 text-center text-sm text-zinc-400">No orders yet.</p>
              : <div className="divide-y divide-zinc-50">
                  {recentActivity.map((order) => (
                    <div key={order.id} className="flex items-center justify-between px-5 py-3">
                      <div>
                        <p className="text-sm font-medium text-zinc-800">{order.customer.name}</p>
                        <p className="text-xs text-zinc-400">{order.orderNumber}</p>
                      </div>
                      <span className="text-sm font-semibold text-zinc-800">{formatCurrency(Number(order.grandTotal))}</span>
                    </div>
                  ))}
                </div>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
