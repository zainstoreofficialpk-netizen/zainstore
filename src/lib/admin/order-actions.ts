"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { OrderStatus, PaymentStatus, NotificationType } from "@prisma/client";

import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";

type ActionResult = { success: true; message: string } | { success: false; error: string };

// Valid forward-only transitions (prevents rolling back delivered status)
const VALID_TRANSITIONS: Record<string, OrderStatus[]> = {
  PENDING:    [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
  PROCESSING: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
  SHIPPED:    [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
  DELIVERED:  [],   // terminal — only refund process can move from here
  CANCELLED:  [],   // terminal
  REFUNDED:   [],   // terminal
};

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");
  if (session.user.role !== "SUPER_ADMIN") throw new Error("Forbidden");
  return session.user;
}

async function notifyOrderVendors(orderId: string, title: string, body: string) {
  const vendors = await db.orderItem.findMany({
    where: { orderId },
    select: { vendor: { select: { userId: true } } },
    distinct: ["vendorId"],
  });
  await Promise.all(
    vendors.map((item) =>
      db.notification.create({
        data: {
          userId: item.vendor.userId,
          type: NotificationType.ORDER,
          title,
          body,
        },
      }),
    ),
  );
}

// ── Update order status (admin only) ─────────────────────────────────────────

const updateStatusSchema = z.object({
  orderId: z.string().min(1),
  newStatus: z.nativeEnum(OrderStatus),
  note: z.string().optional(),
});

export async function updateOrderStatus(
  orderId: string,
  newStatus: OrderStatus,
  note?: string,
): Promise<ActionResult> {
  try {
    await requireAdmin();

    const order = await db.order.findUnique({
      where: { id: orderId },
      select: { id: true, status: true, orderNumber: true },
    });
    if (!order) return { success: false, error: "Order not found." };

    const allowed = VALID_TRANSITIONS[order.status] ?? [];
    if (!allowed.includes(newStatus)) {
      return {
        success: false,
        error: `Cannot move order from ${order.status} to ${newStatus}. Allowed: ${allowed.join(", ") || "none"}.`,
      };
    }

    const now = new Date();
    const data: Record<string, unknown> = { status: newStatus, updatedAt: now };

    if (newStatus === OrderStatus.DELIVERED) {
      data.deliveredAt = now;     // unlocks earning clock
    }
    if (newStatus === OrderStatus.CANCELLED) {
      data.cancelledAt = now;
    }

    await db.order.update({ where: { id: orderId }, data });

    // Write to order timeline
    await db.orderTimeline.create({
      data: {
        orderId,
        status: newStatus,
        note: note ?? `Status updated to ${newStatus} by admin`,
      },
    });

    // Notify vendor(s)
    const statusLabels: Record<string, string> = {
      PROCESSING: "is now being processed",
      SHIPPED:    "has been shipped",
      DELIVERED:  "has been marked as delivered — earnings will unlock in 7 days",
      CANCELLED:  "has been cancelled",
    };
    await notifyOrderVendors(
      orderId,
      `Order ${order.orderNumber} — ${newStatus}`,
      `Your order ${order.orderNumber} ${statusLabels[newStatus] ?? `moved to ${newStatus}`}.`,
    );

    revalidatePath("/admin/orders");
    revalidatePath("/vendor/orders");

    return {
      success: true,
      message:
        newStatus === OrderStatus.DELIVERED
          ? `Order marked as Delivered. Vendor earnings will unlock after ${7}-day holding period.`
          : `Order moved to ${newStatus}.`,
    };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to update order." };
  }
}

// ── Update payment status (admin only) ───────────────────────────────────────

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

    // Only allow: PENDING → PAID, PAID → REFUNDED
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
    return { success: false, error: e instanceof Error ? e.message : "Failed to update payment status." };
  }
}

// ── Add note to order ─────────────────────────────────────────────────────────

export async function addOrderNote(orderId: string, note: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    if (!note.trim()) return { success: false, error: "Note cannot be empty." };

    const existing = await db.order.findUnique({ where: { id: orderId }, select: { status: true } });
    if (!existing) return { success: false, error: "Order not found." };
    await db.orderTimeline.create({
      data: {
        orderId,
        status: existing.status,
        note: note.trim(),
      },
    });

    revalidatePath("/admin/orders");
    return { success: true, message: "Note added." };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to add note." };
  }
}
