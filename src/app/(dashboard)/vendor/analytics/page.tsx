import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { formatCurrency } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { VendorSalesChart } from "@/components/vendor/vendor-sales-chart";
import { ShoppingBag, TrendingUp, Star, Package } from "lucide-react";
import { OrderStatus } from "@prisma/client";

export default async function VendorAnalyticsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "VENDOR") redirect("/login");

  const vendor = await db.vendorProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!vendor) redirect("/vendor");

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Parallel queries
  const [recentItems, allTimeItems, topProducts, orderStatusCounts, recentReviews] = await Promise.all([
    // Last 30 days order items
    db.orderItem.findMany({
      where: { vendorId: vendor.id, order: { createdAt: { gte: thirtyDaysAgo } } },
      include: { order: { select: { createdAt: true, status: true } } },
      orderBy: { order: { createdAt: "asc" } },
    }),
    // All-time totals
    db.orderItem.aggregate({
      _sum: { lineTotal: true, quantity: true },
      _count: { id: true },
      where: { vendorId: vendor.id },
    }),
    // Top products by revenue
    db.orderItem.groupBy({
      by: ["productId"],
      _sum: { lineTotal: true, quantity: true },
      where: { vendorId: vendor.id, order: { status: { not: OrderStatus.CANCELLED } } },
      orderBy: { _sum: { lineTotal: "desc" } },
      take: 5,
    }),
    // Order status breakdown
    db.order.groupBy({
      by: ["status"],
      _count: { id: true },
      where: { items: { some: { vendorId: vendor.id } } },
    }),
    // Recent reviews
    db.review.findMany({
      where: { product: { vendorId: vendor.id }, status: "APPROVED" },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { rating: true, title: true, createdAt: true, product: { select: { name: true } } },
    }),
  ]);

  // Fetch product names for top products
  const productIds = topProducts.map(p => p.productId);
  const products = await db.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true, images: { take: 1, select: { url: true } } },
  });
  const productMap = new Map(products.map(p => [p.id, p]));

  // Build daily sales data for chart (last 30 days)
  const dailyMap = new Map<string, number>();
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    dailyMap.set(key, 0);
  }
  for (const item of recentItems) {
    const key = item.order.createdAt.toISOString().slice(0, 10);
    if (dailyMap.has(key)) dailyMap.set(key, (dailyMap.get(key) ?? 0) + Number(item.lineTotal));
  }
  const chartData = Array.from(dailyMap.entries()).map(([date, revenue]) => ({
    date: new Date(date).toLocaleDateString("en-PK", { day: "numeric", month: "short" }),
    revenue,
  }));

  const totalRevenue30 = recentItems.reduce((s, i) => s + Number(i.lineTotal), 0);
  const totalOrders30 = new Set(recentItems.map(i => i.orderId)).size;
  const avgRating = recentReviews.length > 0 ? recentReviews.reduce((s, r) => s + r.rating, 0) / recentReviews.length : 0;

  const statusColors: Record<string, string> = {
    PENDING: "warning", PROCESSING: "accent", SHIPPED: "default",
    DELIVERED: "success", CANCELLED: "danger", REFUNDED: "muted",
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-zinc-950">Analytics</h2>
        <p className="text-sm text-zinc-400 mt-0.5">Sales performance for the last 30 days</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Revenue (30d)", value: formatCurrency(totalRevenue30), icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Orders (30d)", value: totalOrders30.toString(), icon: ShoppingBag, color: "text-brand-600", bg: "bg-brand-50" },
          { label: "All-time Sales", value: formatCurrency(Number(allTimeItems._sum.lineTotal ?? 0)), icon: Package, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Avg Rating", value: avgRating > 0 ? `${avgRating.toFixed(1)} / 5` : "—", icon: Star, color: "text-amber-500", bg: "bg-amber-50" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <div>
                <p className="text-xs text-zinc-500">{label}</p>
                <p className="text-base font-black text-zinc-900">{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Sales chart */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Revenue — Last 30 Days</CardTitle>
        </CardHeader>
        <CardContent>
          <VendorSalesChart data={chartData} />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top products */}
        <Card>
          <CardHeader><CardTitle>Top Products by Revenue</CardTitle></CardHeader>
          <CardContent className="p-0">
            {topProducts.length === 0 ? (
              <p className="px-5 py-8 text-sm text-zinc-400 text-center">No sales yet</p>
            ) : (
              <div className="divide-y divide-zinc-50">
                {topProducts.map((p, i) => {
                  const product = productMap.get(p.productId);
                  return (
                    <div key={p.productId} className="flex items-center gap-3 px-4 py-3">
                      <span className="text-xs font-black text-zinc-400 w-5">#{i + 1}</span>
                      {product?.images[0]?.url
                        ? <img src={product.images[0].url} alt="" className="w-8 h-8 rounded-lg object-cover" />
                        : <div className="w-8 h-8 rounded-lg bg-zinc-100" />
                      }
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-zinc-800 truncate">{product?.name ?? "Unknown"}</p>
                        <p className="text-xs text-zinc-400">{p._sum.quantity ?? 0} sold</p>
                      </div>
                      <span className="text-sm font-bold text-zinc-900">{formatCurrency(Number(p._sum.lineTotal ?? 0))}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Order status breakdown */}
        <Card>
          <CardHeader><CardTitle>Order Status Breakdown</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {orderStatusCounts.length === 0 ? (
              <p className="text-sm text-zinc-400 text-center py-6">No orders yet</p>
            ) : (
              orderStatusCounts.map(s => (
                <div key={s.status} className="flex items-center justify-between">
                  <Badge tone={(statusColors[s.status] ?? "default") as "success" | "warning" | "danger" | "default" | "accent" | "muted"}>
                    {s.status}
                  </Badge>
                  <span className="text-sm font-semibold text-zinc-700">{s._count.id} orders</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent reviews */}
      {recentReviews.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Recent Reviews</CardTitle></CardHeader>
          <CardContent className="divide-y divide-zinc-50">
            {recentReviews.map((r, i) => (
              <div key={i} className="py-3 flex items-start gap-3">
                <div className="flex gap-0.5 shrink-0 mt-0.5">
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} className={`w-3.5 h-3.5 ${s <= r.rating ? "fill-yellow-400 text-yellow-400" : "text-zinc-200 fill-zinc-200"}`} />
                  ))}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-800 truncate">{r.title ?? "Review"}</p>
                  <p className="text-xs text-zinc-400 truncate">{r.product?.name ?? ""}</p>
                </div>
                <p className="text-xs text-zinc-400 shrink-0">{new Date(r.createdAt).toLocaleDateString("en-PK", { day: "numeric", month: "short" })}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
