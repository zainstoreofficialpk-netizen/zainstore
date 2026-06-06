"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Package, ChevronRight, Search, Filter, RefreshCcw,
  MapPin, Calendar, CreditCard, ShoppingBag,
} from "lucide-react";

import { cancelOrderAction } from "@/lib/customer/order-actions";
import { OrderTracker, ORDER_STATUS_LABELS, ORDER_STATUS_TONE, type OrderStatusKey } from "@/components/customer/order-tracker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/format";

type OrderItem = {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number | string;
  lineTotal: number | string;
  product: { id: string; name: string; images: { url: string; alt: string | null }[] };
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
};

type Props = {
  orders: Order[];
  total: number;
  pages: number;
  currentPage: number;
  currentFilter: string;
};

const STATUS_FILTERS = [
  { key: "ALL", label: "All Orders" },
  { key: "PENDING", label: "Pending" },
  { key: "PROCESSING", label: "Processing" },
  { key: "SHIPPED", label: "Shipped" },
  { key: "OUT_FOR_DELIVERY", label: "Out for Delivery" },
  { key: "DELIVERED", label: "Delivered" },
  { key: "CANCELLED", label: "Cancelled" },
];

function OrderCard({ order }: { order: Order }) {
  const [isPending, startTransition] = useTransition();
  const [showCancel, setShowCancel] = useState(false);

  function handleCancel() {
    startTransition(async () => {
      const r = await cancelOrderAction(order.id);
      if (r.success) toast.success(r.message);
      else toast.error(r.error);
      setShowCancel(false);
    });
  }

  const status = order.status as OrderStatusKey;
  const canCancel = order.status === "PENDING";
  const isActive = !["DELIVERED", "CANCELLED", "REFUNDED"].includes(order.status);

  return (
    <Card className={`overflow-hidden transition-shadow hover:shadow-md ${isActive ? "border-brand-200" : ""}`}>
      {/* Header */}
      <div className={`flex items-center justify-between gap-3 px-5 py-3 ${isActive ? "bg-brand-50/50" : "bg-zinc-50/50"} border-b border-zinc-100`}>
        <div className="flex items-center gap-3">
          <Package size={15} className="text-zinc-500 shrink-0" />
          <div>
            <span className="font-mono text-sm font-bold text-zinc-900">{order.orderNumber}</span>
            <span className="mx-2 text-zinc-300">·</span>
            <span className="text-xs text-zinc-500">
              {new Date(order.createdAt).toLocaleDateString("en-PK", {
                day: "numeric", month: "short", year: "numeric",
              })}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone={ORDER_STATUS_TONE[status] ?? "muted"} className="text-xs">
            {ORDER_STATUS_LABELS[status] ?? order.status}
          </Badge>
          <Link
            href={`/customer/orders/${order.id}`}
            className="flex items-center gap-1 rounded-md bg-brand-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-600"
          >
            Details <ChevronRight size={12} />
          </Link>
        </div>
      </div>

      <CardContent className="p-5">
        {/* Compact progress tracker */}
        <div className="mb-4">
          <OrderTracker currentStatus={status} compact />
          <p className="mt-1 text-xs text-zinc-500">{ORDER_STATUS_LABELS[status]}</p>
        </div>

        {/* Items */}
        <div className="space-y-2.5">
          {order.items.slice(0, 3).map((item) => (
            <div key={item.id} className="flex items-center gap-3">
              {item.product.images[0]?.url ? (
                <img
                  src={item.product.images[0].url}
                  alt={item.product.images[0].alt ?? item.name}
                  className="size-12 shrink-0 rounded-md object-cover border border-zinc-100"
                />
              ) : (
                <div className="grid size-12 shrink-0 place-items-center rounded-md bg-zinc-100">
                  <ShoppingBag size={16} className="text-zinc-400" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-zinc-800">{item.name}</p>
                <p className="text-xs text-zinc-400">
                  Qty {item.quantity} · {formatCurrency(Number(item.unitPrice))} each
                  {item.vendor?.store && <> · <span className="text-zinc-500">{item.vendor.store.name}</span></>}
                </p>
              </div>
              <p className="shrink-0 text-sm font-semibold text-zinc-900">
                {formatCurrency(Number(item.lineTotal))}
              </p>
            </div>
          ))}
          {order.items.length > 3 && (
            <p className="text-xs text-zinc-400">+{order.items.length - 3} more item{order.items.length - 3 > 1 ? "s" : ""}</p>
          )}
        </div>

        {/* Tracking info */}
        {order.trackingNumber && (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-100 px-3 py-2">
            <MapPin size={13} className="text-emerald-600 shrink-0" />
            <p className="text-xs text-emerald-700">
              Tracking: <span className="font-mono font-semibold">{order.trackingNumber}</span>
              {order.trackingUrl && (
                <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer" className="ml-2 underline">
                  Track
                </a>
              )}
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-zinc-100 pt-4">
          <div className="flex items-center gap-4 text-xs text-zinc-500">
            <span className="flex items-center gap-1">
              <CreditCard size={12} />
              <Badge tone={order.paymentStatus === "PAID" ? "success" : "warning"} className="text-[10px]">
                {order.paymentStatus}
              </Badge>
            </span>
            {order.estimatedDelivery && order.status !== "DELIVERED" && (
              <span className="flex items-center gap-1 text-brand-600">
                <Calendar size={12} />
                Est. {new Date(order.estimatedDelivery).toLocaleDateString("en-PK", { day: "numeric", month: "short" })}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <p className="text-sm font-bold text-zinc-950">
              {formatCurrency(Number(order.grandTotal))}
            </p>
            {canCancel && !showCancel && (
              <button
                onClick={() => setShowCancel(true)}
                className="text-xs text-rose-500 hover:underline"
              >
                Cancel
              </button>
            )}
            {showCancel && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-600">Cancel this order?</span>
                <button
                  onClick={handleCancel}
                  disabled={isPending}
                  className="rounded bg-rose-500 px-2.5 py-1 text-xs text-white hover:bg-rose-600 disabled:opacity-50"
                >
                  {isPending ? "…" : "Yes, Cancel"}
                </button>
                <button onClick={() => setShowCancel(false)} className="text-xs text-zinc-400 hover:underline">No</button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function OrdersView({ orders, total, pages, currentPage, currentFilter }: Props) {
  const [search, setSearch] = useState("");

  function buildUrl(params: Record<string, string>) {
    const u = new URLSearchParams({ filter: currentFilter, page: String(currentPage) });
    for (const [k, v] of Object.entries(params)) u.set(k, v);
    return `/customer/orders?${u}`;
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (search.trim()) window.location.href = buildUrl({ search: search.trim(), page: "1" });
  }

  return (
    <div className="space-y-5">
      {/* Search + filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search order #…"
              className="h-9 pl-8 w-44 text-sm"
            />
          </div>
          <Button type="submit" size="sm" variant="outline" className="h-9">Search</Button>
        </form>

        {/* Status filters */}
        <div className="flex flex-wrap gap-1.5">
          {STATUS_FILTERS.map((f) => (
            <a
              key={f.key}
              href={buildUrl({ filter: f.key, page: "1" })}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all whitespace-nowrap border ${
                currentFilter === f.key
                  ? "bg-brand-500 text-white border-brand-500 shadow-sm"
                  : "bg-white text-zinc-500 border-zinc-200 hover:border-zinc-400 hover:text-zinc-800"
              }`}
            >
              {f.label}
            </a>
          ))}
        </div>
      </div>

      {/* Order count */}
      <p className="text-xs text-zinc-400">{total} order{total !== 1 ? "s" : ""}</p>

      {/* Orders */}
      {orders.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-zinc-200 py-20 text-center">
          <ShoppingBag size={36} className="text-zinc-300" />
          <p className="text-sm font-medium text-zinc-500">No orders found</p>
          <p className="text-xs text-zinc-400">
            {currentFilter !== "ALL" ? "Try a different filter." : "Your orders will appear here once placed."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          {currentPage > 1 && (
            <a href={buildUrl({ page: String(currentPage - 1) })} className="rounded-md border border-zinc-200 px-4 py-2 text-xs hover:bg-zinc-50">← Previous</a>
          )}
          <span className="text-xs text-zinc-400">Page {currentPage} of {pages}</span>
          {currentPage < pages && (
            <a href={buildUrl({ page: String(currentPage + 1) })} className="rounded-md border border-zinc-200 px-4 py-2 text-xs hover:bg-zinc-50">Next →</a>
          )}
        </div>
      )}
    </div>
  );
}
