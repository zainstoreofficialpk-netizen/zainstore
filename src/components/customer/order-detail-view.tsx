"use client";

import { useTransition, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  ChevronLeft, Package, MapPin, CreditCard, RefreshCcw,
  ExternalLink, Copy, ShoppingBag, Calendar,
} from "lucide-react";

import { reorderAction } from "@/lib/customer/order-actions";
import { OrderTracker, ORDER_STATUS_LABELS, ORDER_STATUS_TONE, type OrderStatusKey } from "@/components/customer/order-tracker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";

type OrderItem = {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number | string;
  lineTotal: number | string;
  discountTotal: number | string;
  sku: string | null;
  product: { id: string; name: string; images: { url: string; alt: string | null }[] };
  variant: { id: string; name: string } | null;
  vendor: { store: { name: string } | null } | null;
};

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  subtotal: number | string;
  grandTotal: number | string;
  shippingTotal: number | string;
  discountTotal: number | string;
  taxTotal: number | string;
  notes: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  estimatedDelivery: Date | null;
  createdAt: Date;
  deliveredAt: Date | null;
  cancelledAt: Date | null;
  items: OrderItem[];
  shippingAddress: {
    label: string | null;
    line1: string;
    line2: string | null;
    city: string;
    region: string | null;
    postalCode: string | null;
    country: string;
  } | null;
  timeline: { status: string; note: string | null; createdAt: Date }[];
  payments: { method: string | null; status: string; amount: number | string; createdAt: Date }[];
};

export function OrderDetailView({ order }: { order: Order }) {
  const [isPending, startTransition] = useTransition();
  const status = order.status as OrderStatusKey;

  function handleReorder() {
    startTransition(async () => {
      const r = await reorderAction(order.id);
      if (r.success) {
        toast.success(r.message);
      } else {
        toast.error(r.error);
      }
    });
  }

  function copyOrderNumber() {
    navigator.clipboard.writeText(order.orderNumber);
    toast.success("Order number copied!");
  }

  return (
    <div className="space-y-6">
      {/* Back + header */}
      <div>
        <Link
          href="/customer/orders"
          className="mb-3 inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-700"
        >
          <ChevronLeft size={13} /> Back to Orders
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-zinc-950 font-mono">{order.orderNumber}</h2>
              <button onClick={copyOrderNumber} title="Copy order number" className="text-zinc-400 hover:text-zinc-600">
                <Copy size={13} />
              </button>
            </div>
            <p className="mt-0.5 text-xs text-zinc-400">
              Placed{" "}
              {new Date(order.createdAt).toLocaleDateString("en-PK", {
                weekday: "long", day: "numeric", month: "long", year: "numeric",
              })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge tone={ORDER_STATUS_TONE[status] ?? "muted"}>
              {ORDER_STATUS_LABELS[status] ?? order.status}
            </Badge>
            <Button
              onClick={handleReorder}
              disabled={isPending}
              variant="outline"
              size="sm"
              className="gap-1.5"
            >
              <RefreshCcw size={13} />
              {isPending ? "Placing…" : "Reorder"}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column: tracker + items */}
        <div className="space-y-6 lg:col-span-2">
          {/* Progress tracker */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package size={15} className="text-brand-600" /> Order Progress
              </CardTitle>
              {order.estimatedDelivery && status !== "DELIVERED" && (
                <p className="flex items-center gap-1 text-xs text-brand-600">
                  <Calendar size={11} />
                  Estimated delivery:{" "}
                  {new Date(order.estimatedDelivery).toLocaleDateString("en-PK", {
                    weekday: "short", day: "numeric", month: "long",
                  })}
                </p>
              )}
            </CardHeader>
            <CardContent>
              <OrderTracker
                currentStatus={status}
                timeline={order.timeline}
              />
            </CardContent>
          </Card>

          {/* Tracking */}
          {order.trackingNumber && (
            <Card className="border-emerald-200 bg-emerald-50/40">
              <CardContent className="flex items-center gap-3 py-4">
                <MapPin size={18} className="text-emerald-600 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-emerald-800">Shipment Tracking</p>
                  <p className="mt-0.5 font-mono text-sm text-emerald-700">{order.trackingNumber}</p>
                </div>
                {order.trackingUrl && (
                  <a
                    href={order.trackingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
                  >
                    Track <ExternalLink size={11} />
                  </a>
                )}
              </CardContent>
            </Card>
          )}

          {/* Order items */}
          <Card>
            <CardHeader>
              <CardTitle>Items Ordered ({order.items.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-zinc-100">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 px-5 py-4">
                    {item.product.images[0]?.url ? (
                      <img
                        src={item.product.images[0].url}
                        alt={item.product.images[0].alt ?? item.name}
                        className="size-16 shrink-0 rounded-lg object-cover border border-zinc-100"
                      />
                    ) : (
                      <div className="grid size-16 shrink-0 place-items-center rounded-lg bg-zinc-100">
                        <ShoppingBag size={20} className="text-zinc-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-zinc-900 truncate">{item.name}</p>
                      {item.variant && (
                        <p className="text-xs text-zinc-500">{item.variant.name}</p>
                      )}
                      {item.sku && (
                        <p className="text-[10px] font-mono text-zinc-400">SKU: {item.sku}</p>
                      )}
                      <p className="mt-0.5 text-xs text-zinc-500">
                        {item.vendor?.store?.name ?? "Marketplace Seller"} · Qty {item.quantity}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-zinc-950">{formatCurrency(Number(item.lineTotal))}</p>
                      <p className="text-xs text-zinc-400">{formatCurrency(Number(item.unitPrice))} each</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column: summary + address */}
        <div className="space-y-6">
          {/* Order summary */}
          <Card>
            <CardHeader><CardTitle>Order Summary</CardTitle></CardHeader>
            <CardContent className="space-y-2.5">
              {[
                { label: "Subtotal", value: Number(order.subtotal) },
                { label: "Shipping", value: Number(order.shippingTotal) },
                { label: "Tax", value: Number(order.taxTotal) },
                ...(Number(order.discountTotal) > 0
                  ? [{ label: "Discount", value: -Number(order.discountTotal) }]
                  : []),
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between text-sm">
                  <span className="text-zinc-600">{label}</span>
                  <span className={value < 0 ? "text-emerald-600" : "text-zinc-900"}>
                    {value < 0 ? `−${formatCurrency(-value)}` : formatCurrency(value)}
                  </span>
                </div>
              ))}
              <div className="border-t border-zinc-100 pt-2.5 flex items-center justify-between font-semibold">
                <span className="text-zinc-900">Total</span>
                <span className="text-lg text-zinc-950">{formatCurrency(Number(order.grandTotal))}</span>
              </div>
            </CardContent>
          </Card>

          {/* Payment */}
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><CreditCard size={14} /> Payment</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-sm text-zinc-700">Status</p>
                <Badge tone={order.paymentStatus === "PAID" ? "success" : "warning"}>
                  {order.paymentStatus}
                </Badge>
              </div>
              {order.payments[0] && (
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-xs text-zinc-500">Method</p>
                  <p className="text-xs font-medium text-zinc-700">
                    {order.payments[0].method?.replace(/_/g, " ") ?? "Online"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Delivery address */}
          {order.shippingAddress && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin size={14} /> Delivery Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                {order.shippingAddress.label && (
                  <p className="text-xs font-medium text-brand-600 mb-1">{order.shippingAddress.label}</p>
                )}
                <address className="not-italic text-sm text-zinc-700 leading-relaxed">
                  {order.shippingAddress.line1}
                  {order.shippingAddress.line2 && <><br />{order.shippingAddress.line2}</>}
                  <br />
                  {order.shippingAddress.city}
                  {order.shippingAddress.region && `, ${order.shippingAddress.region}`}
                  {order.shippingAddress.postalCode && ` ${order.shippingAddress.postalCode}`}
                  <br />
                  {order.shippingAddress.country}
                </address>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {order.notes && (
            <Card>
              <CardHeader><CardTitle>Order Notes</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm text-zinc-600">{order.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
