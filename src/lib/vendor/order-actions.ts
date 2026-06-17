"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { OrderStatus } from "@prisma/client";

type ActionResult = { success: true; message: string } | { success: false; error: string };

// Vendors can advance status but CANNOT mark Delivered — that stays admin-only
const VENDOR_TRANSITIONS: Record<string, OrderStatus[]> = {
  PENDING:    [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
  PROCESSING: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
  SHIPPED:    [OrderStatus.CANCELLED],
  DELIVERED:  [],
  CANCELLED:  [],
  REFUNDED:   [],
};

export async function vendorUpdateOrderStatus(
  orderId: string,
  newStatus: OrderStatus,
): Promise<ActionResult> {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "VENDOR") {
    return { success: false, error: "Unauthorized" };
  }

  const vendor = await db.vendorProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!vendor) return { success: false, error: "Vendor profile not found" };

  const order = await db.order.findFirst({
    where: { id: orderId, items: { some: { vendorId: vendor.id } } },
    select: { id: true, status: true, orderNumber: true },
  });
  if (!order) return { success: false, error: "Order not found" };

  const allowed = VENDOR_TRANSITIONS[order.status] ?? [];
  if (!allowed.includes(newStatus)) {
    return { success: false, error: `Cannot move from ${order.status} to ${newStatus}` };
  }

  const updateData: Record<string, unknown> = { status: newStatus };
  if (newStatus === OrderStatus.CANCELLED) updateData.cancelledAt = new Date();

  await db.order.update({ where: { id: order.id }, data: updateData });

  await db.orderTimeline.create({
    data: {
      orderId: order.id,
      status: newStatus,
      note: `Status updated to ${newStatus} by vendor`,
    },
  });

  revalidatePath(`/vendor/orders/${orderId}`);
  revalidatePath("/vendor/orders");

  const labels: Record<string, string> = {
    PROCESSING: "Order marked as Processing",
    SHIPPED: "Order marked as Shipped",
    CANCELLED: "Order cancelled",
  };
  return { success: true, message: labels[newStatus] ?? `Status updated to ${newStatus}` };
}
