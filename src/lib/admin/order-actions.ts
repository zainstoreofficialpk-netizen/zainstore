"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { OrderStatus, PaymentStatus, NotificationType } from "@prisma/client";

import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { sendEmail, orderStatusEmailHtml } from "@/lib/email";
import { createNotification } from "@/lib/notifications";

type ActionResult = { success: true; message: string } | { success: false; error: string };

// Full status progression — forward-only transitions only
const VALID_TRANSITIONS: Record<string, OrderStatus[]> = {
  PENDING:            [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
  PROCESSING:         [OrderStatus.READY_FOR_DISPATCH, OrderStatus.SHIPPED, OrderStatus.CANCELLED],
  READY_FOR_DISPATCH: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
  SHIPPED:            [OrderStatus.OUT_FOR_DELIVERY, OrderStatus.DELIVERED, OrderStatus.CANCELLED],
  OUT_FOR_DELIVERY:   [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
  DELIVERED:          [],
  CANCELLED:          [],
  REFUNDED:           [],
};

const STATUS_LABELS: Record<string, string> = {
  PENDING:            "Order Placed",
  PROCESSING:         "Vendor Processing",
  READY_FOR_DISPATCH: "Ready for Dispatch",
  SHIPPED:            "Dispatched / Shipped",
  OUT_FOR_DELIVERY:   "Out for Delivery",
  DELIVERED:          "Delivered",
  CANCELLED:          "Cancelled",
  REFUNDED:           "Refunded",
};

const STATUS_MESSAGES: Record<string, string> = {
  PROCESSING:         "Good news! Your order is being prepared by the vendor.",
  READY_FOR_DISPATCH: "Your order is packed and ready to be dispatched.",
  SHIPPED:            "Your order is on its way!",
  OUT_FOR_DELIVERY:   "Your order is out for delivery — expect it today!",
  DELIVERED:          "Your order has been delivered. We hope you love it!",
  CANCELLED:          "Your order has been cancelled.",
};

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");
  if (session.user.role !== "SUPER_ADMIN") throw new Error("Forbidden");
  return session.user;
}

async function notifyCustomer(customerId: string, orderNumber: string, status: string) {
  const msg = STATUS_MESSAGES[status];
  if (!msg) return;
  await createNotification({
    userId: customerId,
    type: NotificationType.ORDER,
    title: `Order ${orderNumber} — ${STATUS_LABELS[status] ?? status}`,
    body: msg,
    url: "/customer/orders",
  });
}

async function notifyOrderVendors(orderId: string, title: string, body: string) {
  const vendors = await db.orderItem.findMany({
    where: { orderId },
    select: { vendor: { select: { userId: true } } },
    distinct: ["vendorId"],
  });
  await Promise.all(
    vendors.map((item) =>
      createNotification({ userId: item.vendor.userId, type: NotificationType.ORDER, title, body, url: "/vendor/orders" }),
    ),
  );
}

// ── Update order status ───────────────────────────────────────────────────────

export async function updateOrderStatus(
  orderId: string,
  newStatus: OrderStatus,
  extra?: { note?: string; trackingNumber?: string; trackingUrl?: string; estimatedDelivery?: string },
): Promise<ActionResult> {
  try {
    await requireAdmin();

    const order = await db.order.findUnique({
      where: { id: orderId },
      select: { id: true, status: true, orderNumber: true, customerId: true },
    });
    if (!order) return { success: false, error: "Order not found." };

    const allowed = VALID_TRANSITIONS[order.status] ?? [];
    if (!allowed.includes(newStatus)) {
      return {
        success: false,
        error: `Cannot move from ${order.status} → ${newStatus}. Allowed: ${allowed.join(", ") || "none"}.`,
      };
    }

    const now = new Date();
    const data: Record<string, unknown> = { status: newStatus };

    if (newStatus === OrderStatus.DELIVERED) data.deliveredAt = now;
    if (newStatus === OrderStatus.CANCELLED) data.cancelledAt = now;
    if (extra?.trackingNumber) data.trackingNumber = extra.trackingNumber;
    if (extra?.trackingUrl) data.trackingUrl = extra.trackingUrl;
    if (extra?.estimatedDelivery) data.estimatedDelivery = new Date(extra.estimatedDelivery);

    await db.order.update({ where: { id: orderId }, data });

    await db.orderTimeline.create({
      data: {
        orderId,
        status: newStatus,
        note: extra?.note ?? `Status updated to ${STATUS_LABELS[newStatus] ?? newStatus} by admin`,
      },
    });

    // Notify customer on every status change
    await notifyCustomer(order.customerId, order.orderNumber, newStatus);

    // Email customer for key status transitions
    if (["SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"].includes(newStatus)) {
      void (async () => {
        try {
          const customer = await db.user.findUnique({
            where: { id: order.customerId },
            select: { email: true, name: true },
          });
          if (customer?.email) {
            await sendEmail({
              to: customer.email,
              subject: `Order ${order.orderNumber} — ${STATUS_LABELS[newStatus] ?? newStatus}`,
              html: orderStatusEmailHtml({
                customerName: customer.name ?? "Customer",
                orderNumber: order.orderNumber,
                status: newStatus,
                trackingNumber: extra?.trackingNumber ?? null,
                estimatedDelivery: extra?.estimatedDelivery ?? null,
              }),
            });
          }
        } catch (emailErr) {
          console.error("Order status email error:", emailErr);
        }
      })();
    }

    // Notify vendors
    await notifyOrderVendors(
      orderId,
      `Order ${order.orderNumber} — ${STATUS_LABELS[newStatus] ?? newStatus}`,
      `Order ${order.orderNumber} moved to "${STATUS_LABELS[newStatus] ?? newStatus}".`,
    );

    revalidatePath("/admin/orders");
    revalidatePath("/vendor/orders");
    revalidatePath("/customer/orders");

    return {
      success: true,
      message:
        newStatus === OrderStatus.DELIVERED
          ? `Order marked Delivered. Vendor earnings unlock after 7-day hold.`
          : `Order moved to "${STATUS_LABELS[newStatus] ?? newStatus}".`,
    };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to update order." };
  }
}

// ── Update payment status ─────────────────────────────────────────────────────

export async function updatePaymentStatus(
  orderId: string,
  newStatus: PaymentStatus,
): Promise<ActionResult> {
  try {
    await requireAdmin();

    const order = await db.order.findUnique({
      where: { id: orderId },
      select: { id: true, paymentStatus: true, orderNumber: true, status: true },
    });
    if (!order) return { success: false, error: "Order not found." };

    if (order.paymentStatus === "PAID" && newStatus !== PaymentStatus.REFUNDED) {
      return { success: false, error: "Paid orders can only be moved to Refunded." };
    }
    if (order.paymentStatus === "REFUNDED") {
      return { success: false, error: "Cannot change payment status of a refunded order." };
    }

    await db.order.update({ where: { id: orderId }, data: { paymentStatus: newStatus } });
    await db.orderTimeline.create({
      data: {
        orderId,
        status: order.status as OrderStatus,
        note: `Payment status changed to ${newStatus} by admin`,
      },
    });

    revalidatePath("/admin/orders");
    return { success: true, message: `Payment status updated to ${newStatus}.` };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to update payment." };
  }
}

// ── Add note ──────────────────────────────────────────────────────────────────

export async function addOrderNote(orderId: string, note: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    if (!note.trim()) return { success: false, error: "Note cannot be empty." };

    const existing = await db.order.findUnique({ where: { id: orderId }, select: { status: true } });
    if (!existing) return { success: false, error: "Order not found." };

    await db.orderTimeline.create({
      data: { orderId, status: existing.status, note: note.trim() },
    });

    revalidatePath("/admin/orders");
    return { success: true, message: "Note added." };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to add note." };
  }
}
