import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import { VendorOrderPostEx } from "@/components/vendor/vendor-order-postex";
import { VendorStatusUpdater } from "@/components/vendor/vendor-status-updater";
import { ArrowLeft, Package, MapPin, User, CreditCard } from "lucide-react";
import Link from "next/link";


export default async function VendorOrderDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const vendor = await db.vendorProfile.findUnique({
    where: { userId: session.user.id },
    select: {
      id: true,
      postexPickupCode: true,
      postexReturnCode: true,
      store: { select: { name: true, address: true, phone: true } },
    },
  });
  if (!vendor) redirect("/vendor");

  const order = await db.order.findFirst({
    where: {
      id: params.id,
      items: { some: { vendorId: vendor.id } },
    },
    include: {
      customer: { select: { name: true, email: true, phone: true } },
      shippingAddress: true,
      items: {
        where: { vendorId: vendor.id },
        include: { product: { select: { name: true, sku: true } } },
      },
    },
  });

  if (!order) notFound();

  const vendorItems = order.items;
  const vendorTotal = vendorItems.reduce((sum, i) => sum + Number(i.lineTotal), 0);
  const customerPhone = (order.customer as { phone?: string | null }).phone ?? "";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/vendor/orders" className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-800 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Orders
        </Link>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-zinc-950">Order #{order.orderNumber}</h2>
          <p className="mt-0.5 text-sm text-zinc-400">
            {new Date(order.createdAt).toLocaleDateString("en-PK", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
      </div>

      {/* Status + updater */}
      <Card>
        <CardContent className="p-4">
          <VendorStatusUpdater orderId={order.id} initialStatus={order.status} />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Items + PostEx */}
        <div className="lg:col-span-2 space-y-4">
          {/* Items */}
          <Card>
            <CardContent className="p-0">
              <div className="px-4 py-3 border-b border-zinc-100 flex items-center gap-2">
                <Package className="w-4 h-4 text-brand-500" />
                <span className="text-sm font-semibold text-zinc-800">Your Items</span>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-zinc-50/50 border-b border-zinc-100">
                  <tr>
                    {["Product", "SKU", "Qty", "Unit Price", "Total"].map((h) => (
                      <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  {vendorItems.map((item) => (
                    <tr key={item.id} className="hover:bg-zinc-50/40">
                      <td className="px-4 py-3 font-medium text-zinc-900">{item.product.name}</td>
                      <td className="px-4 py-3 font-mono text-xs text-zinc-400">{item.product.sku ?? "—"}</td>
                      <td className="px-4 py-3 text-center">{item.quantity}</td>
                      <td className="px-4 py-3">{formatCurrency(Number(item.unitPrice))}</td>
                      <td className="px-4 py-3 font-semibold">{formatCurrency(Number(item.lineTotal))}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t border-zinc-100 bg-zinc-50/50">
                  <tr>
                    <td colSpan={4} className="px-4 py-3 text-sm font-semibold text-zinc-700 text-right">Your Subtotal</td>
                    <td className="px-4 py-3 font-bold text-zinc-900">{formatCurrency(vendorTotal)}</td>
                  </tr>
                </tfoot>
              </table>
            </CardContent>
          </Card>

          {/* PostEx Booking */}
          <VendorOrderPostEx
            orderId={order.id}
            orderNumber={order.orderNumber}
            grandTotal={Number(order.grandTotal)}
            customerName={order.customer.name ?? ""}
            customerPhone={customerPhone}
            deliveryAddress={
              order.shippingAddress
                ? [order.shippingAddress.line1, order.shippingAddress.city].filter(Boolean).join(", ")
                : ""
            }
            deliveryCity={order.shippingAddress?.city ?? ""}
            items={vendorItems.map((i) => ({
              name: i.product.name,
              quantity: i.quantity,
              unitPrice: Number(i.unitPrice),
            }))}
            vendorPickupCode={vendor.postexPickupCode ?? ""}
            vendorReturnCode={vendor.postexReturnCode ?? ""}
            vendorReturnCity={vendor.store?.address ?? ""}
            pickupAddress={vendor.store?.address ?? ""}
            existingAwb={order.postexAwbNumber ?? null}
            existingTrackingUrl={order.trackingUrl ?? null}
            storeName={vendor.store?.name ?? "ZainStore Vendor"}
            orderDate={new Date(order.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).replace(/ /g, "-")}
          />
        </div>

        {/* Right: Customer + Shipping */}
        <div className="space-y-4">
          {/* Customer */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <User className="w-4 h-4 text-brand-500" />
                <span className="text-sm font-semibold text-zinc-800">Customer</span>
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-900">{order.customer.name}</p>
                <p className="text-xs text-zinc-500">{order.customer.email}</p>
                {customerPhone && <p className="text-xs text-zinc-500">{customerPhone}</p>}
              </div>
            </CardContent>
          </Card>

          {/* Shipping Address */}
          {order.shippingAddress && (
            <Card>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center gap-2 mb-1">
                  <MapPin className="w-4 h-4 text-brand-500" />
                  <span className="text-sm font-semibold text-zinc-800">Delivery Address</span>
                </div>
                <div className="text-sm text-zinc-600 space-y-0.5">
                  <p>{order.shippingAddress.label && <span className="font-medium">{order.shippingAddress.label}: </span>}{order.shippingAddress.line1}</p>
                  {order.shippingAddress.line2 && <p>{order.shippingAddress.line2}</p>}
                  <p>{order.shippingAddress.city}{order.shippingAddress.region ? `, ${order.shippingAddress.region}` : ""}</p>
                  <p>{order.shippingAddress.country}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payment */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <CreditCard className="w-4 h-4 text-brand-500" />
                <span className="text-sm font-semibold text-zinc-800">Order Summary</span>
              </div>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between text-zinc-600">
                  <span>Subtotal</span><span>{formatCurrency(Number(order.subtotal))}</span>
                </div>
                {Number(order.shippingTotal) > 0 && (
                  <div className="flex justify-between text-zinc-600">
                    <span>Shipping</span><span>{formatCurrency(Number(order.shippingTotal))}</span>
                  </div>
                )}
                {Number(order.discountTotal) > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span><span>-{formatCurrency(Number(order.discountTotal))}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-zinc-900 border-t border-zinc-100 pt-2 mt-1">
                  <span>Grand Total</span><span>{formatCurrency(Number(order.grandTotal))}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
