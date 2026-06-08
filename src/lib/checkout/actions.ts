"use server";

import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { revalidatePath } from "next/cache";

// ─── Types ────────────────────────────────────────────────────

export type CheckoutItem = {
  productId: string;
  name: string;
  sku: string | null;
  quantity: number;
  unitPrice: number;
  imageUrl: string | null;
};

export type PlaceOrderInput = {
  // Contact
  email: string;
  phone: string;
  // Address
  fullName: string;
  province: string;
  city: string;
  area: string;
  streetAddress: string;
  postalCode: string;
  orderNotes: string;
  // Financials
  subtotal: number;
  shippingTotal: number;
  discountTotal: number;
  grandTotal: number;
  couponCode: string;
  shippingMethod: string;
  // Payment
  paymentMethod: string;
  // Items
  items: CheckoutItem[];
};

export type PlaceOrderResult =
  | { success: true; orderNumber: string; orderId: string }
  | { success: false; error: string };

// ─── Validate coupon ──────────────────────────────────────────

export type CouponResult =
  | { valid: true; type: string; value: number; code: string; description: string }
  | { valid: false; error: string };

export async function validateCoupon(
  code: string,
  subtotal: number
): Promise<CouponResult> {
  if (!code.trim()) return { valid: false, error: "Enter a coupon code" };

  const coupon = await db.coupon.findUnique({
    where: { code: code.toUpperCase().trim() },
  });

  if (!coupon || !coupon.active) {
    return { valid: false, error: "Invalid or expired coupon code" };
  }

  const now = new Date();
  if (coupon.startsAt && coupon.startsAt > now) {
    return { valid: false, error: "This coupon is not active yet" };
  }
  if (coupon.expiresAt && coupon.expiresAt < now) {
    return { valid: false, error: "This coupon has expired" };
  }
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
    return { valid: false, error: "This coupon has reached its usage limit" };
  }
  if (coupon.minOrderAmount && subtotal < Number(coupon.minOrderAmount)) {
    return {
      valid: false,
      error: `Minimum order of PKR ${Number(coupon.minOrderAmount).toLocaleString()} required`,
    };
  }

  const value = Number(coupon.value);
  let description = "";
  if (coupon.type === "PERCENTAGE") description = `${value}% off`;
  else if (coupon.type === "FIXED") description = `PKR ${value.toLocaleString()} off`;
  else if (coupon.type === "FREE_SHIPPING") description = "Free shipping";

  return {
    valid: true,
    type: coupon.type,
    value,
    code: coupon.code,
    description,
  };
}

// ─── Place order ──────────────────────────────────────────────

export async function placeOrder(input: PlaceOrderInput): Promise<PlaceOrderResult> {
  try {
    if (!input.items.length) {
      return { success: false, error: "Your cart is empty" };
    }
    if (!input.email || !input.phone || !input.fullName || !input.city || !input.streetAddress) {
      return { success: false, error: "Please fill in all required fields" };
    }

    // ── Resolve or create customer ─────────────────────────────
    const session = await getServerSession(authOptions);

    let customerId: string;

    if (session?.user) {
      customerId = (session.user as { id: string }).id;
    } else {
      // Find or create guest customer account
      const existing = await db.user.findUnique({
        where: { email: input.email.toLowerCase().trim() },
      });
      if (existing) {
        customerId = existing.id;
      } else {
        const newUser = await db.user.create({
          data: {
            email: input.email.toLowerCase().trim(),
            name: input.fullName,
            role: "CUSTOMER",
            emailVerified: null,
          },
        });
        customerId = newUser.id;
      }
    }

    // ── Resolve products + vendor ids ─────────────────────────

    const productIds = input.items.map((i) => i.productId);
    const products = await db.product.findMany({
      where: { id: { in: productIds }, status: "ACTIVE" },
      select: { id: true, vendorId: true, stock: true, trackInventory: true },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    for (const item of input.items) {
      const p = productMap.get(item.productId);
      if (!p) return { success: false, error: `Product "${item.name}" is no longer available` };
      if (p.trackInventory && p.stock < item.quantity) {
        return { success: false, error: `Not enough stock for "${item.name}"` };
      }
    }

    // ── Generate order number ─────────────────────────────────

    const orderNumber = `ZS-${Date.now().toString(36).toUpperCase()}-${Math.random()
      .toString(36)
      .slice(2, 6)
      .toUpperCase()}`;

    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(estimatedDelivery.getDate() + 5);

    // ── Create address ────────────────────────────────────────

    const address = await db.address.create({
      data: {
        userId: customerId,
        label: "Order Address",
        line1: input.streetAddress,
        line2: input.area || null,
        city: input.city,
        region: input.province,
        postalCode: input.postalCode || null,
        country: "Pakistan",
      },
    });

    // ── Create order ──────────────────────────────────────────

    const order = await db.order.create({
      data: {
        orderNumber,
        customerId,
        shippingAddressId: address.id,
        status: "PENDING",
        paymentStatus: input.paymentMethod === "cod" ? "PENDING" : "PENDING",
        subtotal: input.subtotal,
        discountTotal: input.discountTotal,
        shippingTotal: input.shippingTotal,
        taxTotal: 0,
        grandTotal: input.grandTotal,
        notes: [
          input.orderNotes,
          `Phone: ${input.phone}`,
          `Payment: ${input.paymentMethod.toUpperCase()}`,
          input.couponCode ? `Coupon: ${input.couponCode}` : "",
        ]
          .filter(Boolean)
          .join(" | ") || null,
        estimatedDelivery,
        items: {
          create: input.items.map((item) => {
            const p = productMap.get(item.productId)!;
            return {
              productId: item.productId,
              vendorId: p.vendorId,
              name: item.name,
              sku: item.sku,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              discountTotal: 0,
              taxTotal: 0,
              shippingTotal: 0,
              lineTotal: item.unitPrice * item.quantity,
              commissionTotal: 0,
            };
          }),
        },
        timeline: {
          create: {
            status: "PENDING",
            note: "Order placed successfully",
            actorId: customerId,
          },
        },
      },
    });

    // ── Decrement stock ───────────────────────────────────────

    await Promise.all(
      input.items.map((item) => {
        const p = productMap.get(item.productId)!;
        if (!p.trackInventory) return Promise.resolve();
        return db.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      })
    );

    // ── Record coupon usage ────────────────────────────────────

    if (input.couponCode) {
      const coupon = await db.coupon.findUnique({
        where: { code: input.couponCode.toUpperCase() },
      });
      if (coupon) {
        await db.coupon.update({
          where: { id: coupon.id },
          data: { usedCount: { increment: 1 } },
        });
        await db.couponUsage.create({
          data: { couponId: coupon.id, userId: customerId, orderId: order.id },
        });
      }
    }

    revalidatePath("/customer/orders");

    return { success: true, orderNumber, orderId: order.id };
  } catch (err) {
    console.error("placeOrder error:", err);
    return { success: false, error: "Failed to place order. Please try again." };
  }
}
