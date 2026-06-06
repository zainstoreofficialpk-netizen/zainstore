import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { ShoppingBag } from "lucide-react";
import type { OrderStatus } from "@prisma/client";

import { authOptions } from "@/lib/auth/config";
import { getCustomerOrders } from "@/lib/customer/order-data";
import { OrdersView } from "@/components/customer/orders-view";

export default async function CustomerOrdersPage({
  searchParams,
}: {
  searchParams: { filter?: string; page?: string; search?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "CUSTOMER") redirect("/login");

  const filter = searchParams.filter ?? "ALL";
  const page = Number(searchParams.page ?? "1");
  const search = searchParams.search;

  const { orders, total, pages } = await getCustomerOrders(session.user.id, {
    status: filter !== "ALL" ? (filter as OrderStatus) : undefined,
    search,
    page,
  });

  const serialized = orders.map((o) => ({
    ...o,
    subtotal: Number(o.subtotal),
    grandTotal: Number(o.grandTotal),
    shippingTotal: Number(o.shippingTotal),
    discountTotal: Number(o.discountTotal),
    items: o.items.map((item) => ({
      ...item,
      unitPrice: Number(item.unitPrice),
      lineTotal: Number(item.lineTotal),
    })),
  }));

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <ShoppingBag size={18} className="text-brand-600" />
          <h2 className="text-lg font-bold text-zinc-950">My Orders</h2>
        </div>
        <p className="mt-0.5 text-sm text-zinc-400">
          Track, manage, and reorder your purchases.
        </p>
      </div>
      <OrdersView
        orders={serialized}
        total={total}
        pages={pages}
        currentPage={page}
        currentFilter={filter}
      />
    </div>
  );
}
