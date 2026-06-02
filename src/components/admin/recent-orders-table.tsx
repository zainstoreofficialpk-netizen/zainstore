import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/format";
import type { getRecentOrders } from "@/lib/admin/dashboard-data";

type Orders = Awaited<ReturnType<typeof getRecentOrders>>;

const ORDER_STATUS_TONE: Record<string, "success" | "warning" | "danger" | "accent" | "muted"> = {
  PENDING: "warning",
  PROCESSING: "accent",
  SHIPPED: "accent",
  DELIVERED: "success",
  CANCELLED: "danger",
  REFUNDED: "muted",
};

const PAYMENT_STATUS_TONE: Record<string, "success" | "warning" | "danger" | "muted"> = {
  PAID: "success",
  PENDING: "warning",
  FAILED: "danger",
  REFUNDED: "muted",
  AUTHORIZED: "warning",
};

export function RecentOrdersTable({ orders }: { orders: Orders }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Recent Orders</CardTitle>
            <p className="mt-0.5 text-xs text-zinc-400">Latest {orders.length} orders across all vendors</p>
          </div>
          <Link
            href="/admin/orders"
            className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-500"
          >
            View all <ArrowRight size={13} />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {orders.length === 0 ? (
          <p className="px-6 py-8 text-center text-sm text-zinc-400">No orders yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 text-left">
                  <th className="px-6 py-3 text-xs font-medium text-zinc-500">Order</th>
                  <th className="px-3 py-3 text-xs font-medium text-zinc-500">Customer</th>
                  <th className="px-3 py-3 text-xs font-medium text-zinc-500">Vendor</th>
                  <th className="px-3 py-3 text-xs font-medium text-zinc-500">Total</th>
                  <th className="px-3 py-3 text-xs font-medium text-zinc-500">Payment</th>
                  <th className="px-6 py-3 text-xs font-medium text-zinc-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {orders.map((order) => {
                  const storeName = order.items[0]?.vendor?.store?.name ?? "—";
                  return (
                    <tr key={order.id} className="hover:bg-zinc-50/60">
                      <td className="px-6 py-3">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="font-mono text-xs font-semibold text-brand-600 hover:underline"
                        >
                          {order.orderNumber}
                        </Link>
                      </td>
                      <td className="px-3 py-3 text-xs text-zinc-700">{order.customer.name}</td>
                      <td className="px-3 py-3 text-xs text-zinc-500">{storeName}</td>
                      <td className="px-3 py-3 text-xs font-medium text-zinc-800">
                        {formatCurrency(Number(order.grandTotal))}
                      </td>
                      <td className="px-3 py-3">
                        <Badge tone={PAYMENT_STATUS_TONE[order.paymentStatus] ?? "muted"}>
                          {order.paymentStatus}
                        </Badge>
                      </td>
                      <td className="px-6 py-3">
                        <Badge tone={ORDER_STATUS_TONE[order.status] ?? "muted"}>
                          {order.status}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
