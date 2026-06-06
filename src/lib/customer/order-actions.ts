"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { OrderStatus } from "@prisma/client";

import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";

type ActionResult<T = void> =
  | { success: true; message: string; data?: T }
  | { success: false; error: string };

async function requireCustomer() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");
  if (session.user.role !== "CUSTOMER") throw new Error("Forbidden");
  return session.user;
}

// ── Reorder: duplicate a past order as a new PENDING order ───────────────────

export async function reorderAction(orderId: string): Promise<ActionResult<{ orderNumber: string }>> {
  try {
    const user = await requireCustomer();

    const original = await db.order.findFirst({
      where: { id: orderId, customerId: user.id },
      include: {
        items: true,
        shippingAddress: true,
      },
    });
    if (!original) return { success: false, error: "Order not found." };

    // Validate all products still exist and are active
    const productIds = original.items.map((i) => i.productId);
    const products = await db.product.findMany({
      where: { id: { in: productIds }, status: "ACTIVE" },
      select: { id: true, price: true, salePrice: true, stock: true },
    });
    const productMap = new Map(products.map((p) => [p.id, p]));

    const validItems = original.items.filter((item) => {
      const p = productMap.get(item.productId);
      return p && p.stock >= item.quantity;
    });

    if (validItems.length === 0) {
      return { success: false, error: "None of the items in this order are currently available." };
    }

    // Generate unique order number
    const orderNumber = `ZS-${Date.now().toString().slice(-8)}`;

    // Recalculate totals with current prices
    const newItems = validItems.map((item) => {
      const p = productMap.get(item.productId)!;
      const unitPrice = Number(p.salePrice ?? p.price);
      return {
        productId: item.productId,
        variantId: item.variantId,
        vendorId: item.vendorId,
        name: item.name,
        sku: item.sku,
        quantity: item.quantity,
        unitPrice,
        lineTotal: unitPrice * item.quantity,
        commissionTotal: 0,
      };
    });

    const subtotal = newItems.reduce((s, i) => s + i.lineTotal, 0);

    const newOrder = await db.order.create({
      data: {
        orderNumber,
        customerId: user.id,
        shippingAddressId: original.shippingAddressId,
        status: OrderStatus.PENDING,
        paymentStatus: "PENDING",
        subtotal,
        grandTotal: subtotal + Number(original.shippingTotal) + Number(original.taxTotal),
        shippingTotal: original.shippingTotal,
        taxTotal: original.taxTotal,
        discountTotal: 0,
        items: { create: newItems },
        timeline: {
          create: {
            status: OrderStatus.PENDING,
            note: `Reordered from ${original.orderNumber}`,
          },
        },
      },
    });

    revalidatePath("/customer/orders");
    return {
      success: true,
      message: `New order ${orderNumber} placed successfully!`,
      data: { orderNumber },
    };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to reorder." };
  }
}

// ── Cancel order (only PENDING orders) ───────────────────────────────────────

export async function cancelOrderAction(orderId: string, reason?: string): Promise<ActionResult> {
  try {
    const user = await requireCustomer();

    const order = await db.order.findFirst({
      where: { id: orderId, customerId: user.id },
    });
    if (!order) return { success: false, error: "Order not found." };

    if (order.status !== OrderStatus.PENDING) {
      return {
        success: false,
        error: "Only orders that are still pending can be cancelled. Contact support if you need to cancel a processing order.",
      };
    }

    await db.$transaction([
      db.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.CANCELLED, cancelledAt: new Date() },
      }),
      db.orderTimeline.create({
        data: {
          orderId,
          status: OrderStatus.CANCELLED,
          note: reason ? `Cancelled by customer: ${reason}` : "Cancelled by customer",
          actorId: user.id,
        },
      }),
    ]);

    revalidatePath("/customer/orders");
    return { success: true, message: "Order cancelled successfully." };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to cancel order." };
  }
}
