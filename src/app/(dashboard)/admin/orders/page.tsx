import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import Link from "next/link";

import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { OrderStatus } from "@prisma/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency } from "@/lib/format";
import { EARNINGS_HOLD_DAYS } from "@/lib/admin/withdrawal-data";
import { OrderStatusUpdater } from "@/components/admin/order-status-updater";
import { AdminOrderPostEx } from "@/components/admin/admin-order-postex";
import { OrderSourceBadge } from "@/components/admin/order-source-updater";

const ORDER_TONE: Record<string, "success" | "warning" | "danger" | "accent" | "muted"> = {
  PENDING: "warning", PROCESSING: "accent", READY_FOR_DISPATCH: "accent",
  SHIPPED: "accent", OUT_FOR_DELIVERY: "accent",
  DELIVERED: "success", CANCELLED: "danger", REFUNDED: "muted",
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pending", PROCESSING: "Processing",
  READY_FOR_DISPATCH: "Ready", SHIPPED: "Shipped",
  OUT_FOR_DELIVERY: "Out for Del.", DELIVERED: "Delivered",
  CANCELLED: "Cancelled", REFUNDED: "Refunded",
};
const PAY_TONE: Record<string, "success" | "warning" | "danger" | "muted"> = {
  PAID: "success", PENDING: "warning", FAILED: "danger", REFUNDED: "muted", AUTHORIZED: "warning",
};

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: { status?: string; page?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "SUPER_ADMIN") redirect("/login");

  const status = searchParams.status as OrderStatus | undefined;
  const page = Number(searchParams.page ?? "1");
  const LIMIT = 20;
  const where = status ? { status } : {};

  const [orders, total, aggStats, counts] = await Promise.all([
    db.order.findMany({
      where,
      skip: (page - 1) * LIMIT,
      take: LIMIT,
      orderBy: { createdAt: "desc" },
      include: {
        customer: { select: { name: true, email: true, phone: true } },
        items: {
          include: {
            product: { select: { name: true } },
            vendor: {
              select: {
                postexPickupCode: true,
                postexReturnCode: true,
                store: { select: { name: true } },
              },
            },
          },
        },
        shippingAddress: { select: { city: true, line1: true } },
      },
    }),
    db.order.count({ where }),
    db.order.aggregate({ _sum: { grandTotal: true }, where: { paymentStatus: "PAID" } }),
    Promise.all([
      db.order.count(),
      db.order.count({ where: { status: "PENDING" } }),
      db.order.count({ where: { status: "PROCESSING" } }),
      db.order.count({ where: { status: "SHIPPED" } }),
      db.order.count({ where: { status: "DELIVERED" } }),
    ]),
  ]);

  const [totalOrders, pending, processing, shipped, delivered] = counts;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-zinc-950">Order Management</h2>
        <p className="mt-0.5 text-sm text-zinc-400">
          Only admins can advance order status. Vendor earnings unlock {EARNINGS_HOLD_DAYS} days after delivery.
        </p>
      </div>

      {/* Fraud prevention notice */}
      <div className="rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-xs text-brand-800 space-y-0.5">
        <p className="font-semibold">Earnings Protection Rules Active</p>
        <p>• Earnings counted only from DELIVERED + PAID orders · {EARNINGS_HOLD_DAYS}-day holding period after delivery</p>
        <p>• Self-purchases excluded · Refunded orders clawed back · Only admins can mark orders Delivered</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          { label: "Total", value: totalOrders, href: "/admin/orders" },
          { label: "Pending", value: pending, href: "/admin/orders?status=PENDING" },
          { label: "Processing", value: processing, href: "/admin/orders?status=PROCESSING" },
          { label: "Shipped", value: shipped, href: "/admin/orders?status=SHIPPED" },
          { label: "Delivered", value: delivered, href: "/admin/orders?status=DELIVERED" },
        ].map((s) => (
          <a key={s.label} href={s.href}>
            <Card className="hover:border-brand-200 transition-colors">
              <CardContent className="py-3 text-center">
                <p className="text-xl font-bold text-zinc-950">{s.value}</p>
                <p className="mt-0.5 text-xs text-zinc-500">{s.label}</p>
              </CardContent>
            </Card>
          </a>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {["ALL", "PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"].map((s) => (
          <a
            key={s}
            href={s === "ALL" ? "/admin/orders" : `/admin/orders?status=${s}`}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              (s === "ALL" && !status) || s === status
                ? "bg-brand-500 text-white"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            }`}
          >
            {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
          </a>
        ))}
      </div>

      {/* Order table */}
      <Card className="overflow-hidden">
        {orders.length === 0 ? (
          <EmptyState
            icon="🛒"
            title="No orders found"
            description="Orders will appear here once customers start placing them."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-zinc-100 bg-zinc-50/50">
                <tr>
                  {["Order #", "Customer", "Vendor", "Source", "Total", "Payment", "Status", "PostEx AWB", "Delivered", "Actions"].map(
                    (h) => (
                      <th
                        key={h}
                        className={`px-4 py-3 text-left text-xs font-medium text-zinc-500 whitespace-nowrap${h === "Actions" ? " w-24" : ""}`}
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {orders.map((order) => {
                  const holdCutoff = new Date();
                  holdCutoff.setDate(holdCutoff.getDate() - EARNINGS_HOLD_DAYS);
                  const earningsLocked =
                    order.deliveredAt && order.deliveredAt > holdCutoff;
                  const unlockDate = order.deliveredAt
                    ? new Date(new Date(order.deliveredAt).getTime() + EARNINGS_HOLD_DAYS * 864e5)
                    : null;

                  return (
                    <tr key={order.id} className="hover:bg-zinc-50/60">
                      <td className="px-4 py-3">
                        <Link href={`/admin/orders/${order.id}`} className="font-mono text-xs font-semibold text-brand-600 hover:underline">
                          {order.orderNumber}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium">{order.customer.name}</p>
                        <p className="text-xs text-zinc-400">{order.customer.email}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-zinc-500">
                        {order.items[0]?.vendor?.store?.name ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-0.5">
                          <OrderSourceBadge source={order.orderSource} />
                          {order.sourceReference && (
                            <span className="font-mono text-[10px] text-zinc-400">#{order.sourceReference}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">
                        {formatCurrency(Number(order.grandTotal))}
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={PAY_TONE[order.paymentStatus] ?? "muted"}>
                          {order.paymentStatus}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Badge tone={ORDER_TONE[order.status] ?? "muted"}>
                          {STATUS_LABEL[order.status] ?? order.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <AdminOrderPostEx
                          orderId={order.id}
                          orderNumber={order.orderNumber}
                          grandTotal={Number(order.grandTotal)}
                          customerName={order.customer.name ?? ""}
                          customerPhone={(order.customer as { phone?: string | null }).phone ?? ""}
                          deliveryAddress={order.shippingAddress ? `${order.shippingAddress.line1}, ${order.shippingAddress.city}` : ""}
                          deliveryCity={order.shippingAddress?.city ?? ""}
                          items={order.items.map(i => ({ name: i.product?.name ?? "Item", quantity: i.quantity, unitPrice: Number(i.unitPrice) }))}
                          existingAwb={order.postexAwbNumber ?? null}
                          existingTrackingUrl={order.trackingUrl ?? null}
                          vendorPickupCode={order.items[0]?.vendor?.postexPickupCode ?? ""}
                          vendorReturnCode={order.items[0]?.vendor?.postexReturnCode ?? ""}
                        />
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {order.deliveredAt ? (
                          <div>
                            <p className="text-zinc-600">
                              {new Date(order.deliveredAt).toLocaleDateString("en-PK", {
                                day: "numeric",
                                month: "short",
                              })}
                            </p>
                            {earningsLocked ? (
                              <p className="text-amber-600 font-medium">
                                Unlocks{" "}
                                {unlockDate?.toLocaleDateString("en-PK", {
                                  day: "numeric",
                                  month: "short",
                                })}
                              </p>
                            ) : (
                              <p className="text-emerald-600 font-medium">Earnings unlocked</p>
                            )}
                          </div>
                        ) : (
                          <span className="text-zinc-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 w-24 whitespace-nowrap">
                        <OrderStatusUpdater
                          orderId={order.id}
                          orderNumber={order.orderNumber}
                          currentStatus={order.status}
                          paymentStatus={order.paymentStatus}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Pagination */}
      {total > LIMIT && (
        <div className="flex items-center justify-between text-xs text-zinc-500">
          <span>
            Page {page} of {Math.ceil(total / LIMIT)} · {total} orders
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <a
                href={`/admin/orders?page=${page - 1}${status ? `&status=${status}` : ""}`}
                className="rounded border border-zinc-200 px-3 py-1 hover:bg-zinc-50"
              >
                ← Prev
              </a>
            )}
            {page < Math.ceil(total / LIMIT) && (
              <a
                href={`/admin/orders?page=${page + 1}${status ? `&status=${status}` : ""}`}
                className="rounded border border-zinc-200 px-3 py-1 hover:bg-zinc-50"
              >
                Next →
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
