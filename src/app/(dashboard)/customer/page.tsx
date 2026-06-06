import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import {
  ShoppingCart, Package, Star, Bell, Heart,
  ChevronRight,
} from "lucide-react";

import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { getCustomerOrderStats, getCustomerRecentOrders } from "@/lib/customer/order-data";
import { getCustomerNotifications, getCustomerUnreadCount } from "@/lib/customer/notification-actions";
import { getWishlistCount } from "@/lib/customer/wishlist-actions";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  OrderTracker,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_TONE,
  type OrderStatusKey,
} from "@/components/customer/order-tracker";
import { formatCurrency } from "@/lib/format";

export default async function CustomerDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "CUSTOMER") redirect("/login");

  const userId = session.user.id;

  const [orderStats, recentOrders, reviewCount, unreadCount, recentNotifications, wishlistCount] =
    await Promise.all([
      getCustomerOrderStats(userId),
      getCustomerRecentOrders(userId, 4),
      db.review.count({ where: { userId } }),
      getCustomerUnreadCount(userId),
      getCustomerNotifications(userId, 5),
      getWishlistCount(userId),
    ]);

  const stats = [
    {
      title: "Total Orders",
      value: String(orderStats.total),
      helper: orderStats.active > 0 ? `${orderStats.active} in progress` : "No active orders",
      icon: ShoppingCart,
    },
    {
      title: "Delivered",
      value: String(orderStats.delivered),
      helper: "Completed successfully",
      icon: Package,
    },
    {
      title: "Wishlist",
      value: String(wishlistCount),
      helper: wishlistCount > 0 ? "Saved products" : "No saved products",
      icon: Heart,
    },
    {
      title: "Reviews",
      value: String(reviewCount),
      helper: "Reviews written",
      icon: Star,
    },
    {
      title: "Notifications",
      value: String(unreadCount),
      helper: unreadCount > 0 ? "Unread alerts" : "All caught up",
      icon: Bell,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-zinc-950">
          Welcome back, {session.user.name?.split(" ")[0] ?? "there"}!
        </h2>
        <p className="mt-0.5 text-sm text-zinc-400">Here's what's happening with your account.</p>
      </div>

      {/* Stats — 5 focused cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Recent orders — takes 3 cols */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Orders</CardTitle>
                <Link
                  href="/customer/orders"
                  className="flex items-center gap-1 text-xs text-brand-600 hover:underline"
                >
                  View all <ChevronRight size={12} />
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {recentOrders.length === 0 ? (
                <div className="py-12 text-center">
                  <Package size={28} className="mx-auto mb-2 text-zinc-300" />
                  <p className="text-sm text-zinc-400">No orders yet.</p>
                </div>
              ) : (
                <div className="divide-y divide-zinc-100">
                  {recentOrders.map((order) => {
                    const status = order.status as OrderStatusKey;
                    const isActive = !["DELIVERED", "CANCELLED", "REFUNDED"].includes(order.status);
                    return (
                      <Link
                        key={order.id}
                        href={`/customer/orders/${order.id}`}
                        className="flex items-center gap-4 px-5 py-4 hover:bg-zinc-50/80 transition-colors"
                      >
                        <div className="flex -space-x-2 shrink-0">
                          {order.items.slice(0, 2).map((item) =>
                            item.product.images[0]?.url ? (
                              <img
                                key={item.id}
                                src={item.product.images[0].url}
                                alt={item.product.name}
                                className="size-10 rounded-md object-cover border-2 border-white ring-1 ring-zinc-100"
                              />
                            ) : (
                              <div key={item.id} className="grid size-10 place-items-center rounded-md bg-zinc-100 border-2 border-white">
                                <Package size={13} className="text-zinc-400" />
                              </div>
                            ),
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xs font-bold text-zinc-900">{order.orderNumber}</span>
                            {isActive && <span className="size-1.5 rounded-full bg-brand-500 animate-pulse" />}
                          </div>
                          <p className="text-xs text-zinc-400 truncate">
                            {order.items.map((i) => i.product.name).join(", ")}
                          </p>
                        </div>

                        <div className="shrink-0 text-right">
                          <Badge tone={ORDER_STATUS_TONE[status] ?? "muted"} className="text-[10px]">
                            {ORDER_STATUS_LABELS[status] ?? order.status}
                          </Badge>
                          <p className="mt-0.5 text-xs text-zinc-500">
                            {formatCurrency(Number(order.grandTotal))}
                          </p>
                        </div>

                        <ChevronRight size={13} className="text-zinc-300 shrink-0" />
                      </Link>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent notifications — takes 2 cols */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Bell size={14} className="text-brand-600" />
                  Notifications
                  {unreadCount > 0 && (
                    <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-accent-500 px-1.5 text-[10px] font-bold text-white">
                      {unreadCount}
                    </span>
                  )}
                </CardTitle>
                <Link href="/customer/notifications" className="flex items-center gap-1 text-xs text-brand-600 hover:underline">
                  View all <ChevronRight size={12} />
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {recentNotifications.length === 0 ? (
                <div className="py-10 text-center">
                  <Bell size={24} className="mx-auto mb-2 text-zinc-300" />
                  <p className="text-xs text-zinc-400">No notifications yet.</p>
                </div>
              ) : (
                <div className="divide-y divide-zinc-100">
                  {recentNotifications.map((n) => {
                    const isUnread = !n.readAt;
                    return (
                      <div
                        key={n.id}
                        className={`px-5 py-3 ${isUnread ? "bg-brand-50/30" : ""}`}
                      >
                        <div className="flex items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs ${isUnread ? "font-semibold text-zinc-900" : "text-zinc-600"}`}>
                              {n.title}
                              {isUnread && (
                                <span className="ml-1.5 inline-block size-1.5 rounded-full bg-brand-500 align-middle" />
                              )}
                            </p>
                            <p className="mt-0.5 text-[11px] text-zinc-400 truncate">{n.body}</p>
                          </div>
                        </div>
                        <p className="mt-1 text-[10px] text-zinc-300">
                          {new Date(n.createdAt).toLocaleString("en-PK", {
                            day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                          })}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
              {recentNotifications.length > 0 && (
                <div className="border-t border-zinc-100 px-5 py-3">
                  <Link href="/customer/notifications" className="text-xs text-brand-600 hover:underline">
                    See all notifications →
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
