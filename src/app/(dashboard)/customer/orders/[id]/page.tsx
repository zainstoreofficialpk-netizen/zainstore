import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth/config";
import { getCustomerOrder } from "@/lib/customer/order-data";
import { OrderDetailView } from "@/components/customer/order-detail-view";

export default async function CustomerOrderDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "CUSTOMER") redirect("/login");

  const order = await getCustomerOrder(params.id, session.user.id);
  if (!order) notFound();

  // Serialize Decimal → number for client component
  const serialized = {
    ...order,
    subtotal: Number(order.subtotal),
    grandTotal: Number(order.grandTotal),
    shippingTotal: Number(order.shippingTotal),
    discountTotal: Number(order.discountTotal),
    taxTotal: Number(order.taxTotal),
    items: order.items.map((item) => ({
      ...item,
      unitPrice: Number(item.unitPrice),
      lineTotal: Number(item.lineTotal),
      discountTotal: Number(item.discountTotal),
    })),
    payments: order.payments.map((p) => ({
      method: p.method,
      status: p.status,
      amount: Number(p.amount),
      createdAt: p.createdAt,
    })),
  };

  return <OrderDetailView order={serialized} />;
}
