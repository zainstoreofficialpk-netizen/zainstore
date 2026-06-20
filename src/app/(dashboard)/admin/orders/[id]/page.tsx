import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/format";
import { OrderStatusUpdater } from "@/components/admin/order-status-updater";
import { VendorOrderPostEx } from "@/components/vendor/vendor-order-postex";
import { ArrowLeft, Package, MapPin, User, CreditCard, Store, Share2 } from "lucide-react";
import Link from "next/link";
import { OrderSourceUpdater } from "@/components/admin/order-source-updater";

const ORDER_TONE: Record<string, "success" | "warning" | "danger" | "accent" | "muted"> = {
  PENDING: "warning", PROCESSING: "accent", SHIPPED: "accent",
  DELIVERED: "success", CANCELLED: "danger", REFUNDED: "muted",
};

export default async function AdminOrderDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "SUPER_ADMIN") redirect("/login");

  const order = await db.order.findUnique({
    where: { id: params.id },
    include: {
      customer: { select: { name: true, email: true, phone: true } },
      shippingAddress: true,
      items: {
        include: {
          product: { select: { name: true, sku: true } },
          vendor: {
            select: {
              id: true,
              postexPickupCode: true,
              postexReturnCode: true,
              store: { select: { name: true, address: true } },
            },
          },
        },
      },
    },
  });

  if (!order) notFound();

  const firstVendor = order.items[0]?.vendor;
  const customerPhone = (order.customer as { phone?: string | null }).phone ?? "";
  const deliveryAddress = order.shippingAddress
    ? [order.shippingAddress.line1, order.shippingAddress.line2, order.shippingAddress.city].filter(Boolean).join(", ")
    : "";

  const orderDate = new Date(order.createdAt)
    .toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    .replace(/ /g, "-");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/orders" className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-800 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Orders
        </Link>
      </div>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-bold text-zinc-950">Order #{order.orderNumber}</h2>
          <p className="mt-0.5 text-sm text-zinc-400">
            {new Date(order.createdAt).toLocaleDateString("en-PK", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone={ORDER_TONE[order.status] ?? "muted"}>{order.status}</Badge>
        </div>
      </div>

      {/* Status updater */}
      <Card>
        <CardContent className="p-4">
          <OrderStatusUpdater orderId={order.id} orderNumber={order.orderNumber} currentStatus={order.status} paymentStatus={order.paymentStatus} />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: items + PostEx */}
        <div className="lg:col-span-2 space-y-4">

          {/* Items */}
          <Card>
            <CardContent className="p-0">
              <div className="px-4 py-3 border-b border-zinc-100 flex items-center gap-2">
                <Package className="w-4 h-4 text-zinc-400" />
                <p className="text-sm font-semibold text-zinc-800">Order Items</p>
              </div>
              <div className="divide-y divide-zinc-50">
                {order.items.map(item => (
                  <div key={item.id} className="flex items-center justify-between px-4 py-3 gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-800 truncate">{item.product?.name ?? "—"}</p>
                      {item.product?.sku && <p className="text-xs text-zinc-400">SKU: {item.product.sku}</p>}
                      <p className="text-xs text-zinc-500 mt-0.5 flex items-center gap-1">
                        <Store className="w-3 h-3" /> {item.vendor?.store?.name ?? "Unknown Store"}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-zinc-900">{formatCurrency(Number(item.lineTotal))}</p>
                      <p className="text-xs text-zinc-400">{item.quantity} × {formatCurrency(Number(item.unitPrice))}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-4 py-3 bg-zinc-50 border-t border-zinc-100 flex justify-between">
                <p className="text-sm font-bold text-zinc-700">Order Total</p>
                <p className="text-sm font-black text-zinc-900">{formatCurrency(Number(order.grandTotal))}</p>
              </div>
            </CardContent>
          </Card>

          {/* PostEx card */}
          <VendorOrderPostEx
            orderId={order.id}
            orderNumber={order.orderNumber}
            grandTotal={Number(order.grandTotal)}
            customerName={order.customer.name ?? ""}
            customerPhone={customerPhone}
            deliveryAddress={deliveryAddress}
            deliveryCity={order.shippingAddress?.city ?? ""}
            items={order.items.map(i => ({ name: i.product?.name ?? "Item", quantity: i.quantity, unitPrice: Number(i.unitPrice) }))}
            vendorPickupCode={firstVendor?.postexPickupCode ?? ""}
            vendorReturnCode={firstVendor?.postexReturnCode ?? ""}
            vendorReturnCity={firstVendor?.store?.address ?? ""}
            existingAwb={order.postexAwbNumber ?? null}
            existingTrackingUrl={order.trackingUrl ?? null}
            storeName={firstVendor?.store?.name ?? "ZainStore.pk"}
            orderDate={orderDate}
            pickupAddress={firstVendor?.store?.address ?? ""}
          />
        </div>

        {/* Right: customer + address + payment */}
        <div className="space-y-4">
          {/* Customer */}
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-sm"><User className="w-4 h-4" /> Customer</CardTitle></CardHeader>
            <CardContent className="space-y-1.5">
              <p className="text-sm font-semibold text-zinc-800">{order.customer.name}</p>
              <p className="text-xs text-zinc-500">{order.customer.email}</p>
              {customerPhone && <p className="text-xs text-zinc-500">📞 {customerPhone}</p>}
            </CardContent>
          </Card>

          {/* Shipping address */}
          {order.shippingAddress && (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2 text-sm"><MapPin className="w-4 h-4" /> Shipping Address</CardTitle></CardHeader>
              <CardContent className="space-y-1 text-sm text-zinc-600">
                <p>{order.shippingAddress.line1}</p>
                {order.shippingAddress.line2 && <p>{order.shippingAddress.line2}</p>}
                <p>{order.shippingAddress.city}{order.shippingAddress.region ? `, ${order.shippingAddress.region}` : ""}</p>
                {order.shippingAddress.postalCode && <p className="text-xs text-zinc-400">{order.shippingAddress.postalCode}</p>}
              </CardContent>
            </Card>
          )}

          {/* Order Source */}
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-sm"><Share2 className="w-4 h-4" /> Order Source</CardTitle></CardHeader>
            <CardContent>
              <OrderSourceUpdater
                orderId={order.id}
                currentSource={order.orderSource}
                currentReference={order.sourceReference ?? null}
              />
            </CardContent>
          </Card>

          {/* Payment */}
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-sm"><CreditCard className="w-4 h-4" /> Payment</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Status</span>
                <Badge tone={order.paymentStatus === "PAID" ? "success" : "warning"}>{order.paymentStatus}</Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Method</span>
                <span className="font-medium">COD</span>
              </div>
              <div className="flex justify-between text-sm font-bold border-t border-zinc-100 pt-2">
                <span>Total</span>
                <span>{formatCurrency(Number(order.grandTotal))}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
