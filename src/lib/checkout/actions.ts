"use server";

import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { revalidatePath } from "next/cache";
import { sendEmail, orderConfirmationEmailHtml, vendorNewOrderEmailHtml } from "@/lib/email";
import { OrderSource } from "@prisma/client";

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
  // Traffic source (auto-detected from UTM params)
  orderSource?: string;
  sourceReference?: string | null;
};

export type PlaceOrderResult =
  | { success: true; orderNumber: string; orderId: string }
  | { success: false; error: string };

// ─── Validate coupon ──────────────────────────────────────────

type CartLineItem = { vendorId: string | null; price: number; salePrice: number | null; quantity: number };

export type CouponResult =
  | {
      valid: true;
      type: string;
      value: number;
      code: string;
      description: string;
      scope: "platform" | "vendor";
      vendorId: string | null;
      storeName: string | null;
      eligibleSubtotal: number;
      discountAmount: number;
    }
  | { valid: false; error: string };

export async function validateCoupon(
  code: string,
  subtotal: number,
  items: CartLineItem[] = [],
): Promise<CouponResult> {
  if (!code.trim()) return { valid: false, error: "Enter a coupon code" };

  const coupon = await db.coupon.findUnique({
    where: { code: code.toUpperCase().trim() },
    include: { vendor: { include: { store: { select: { name: true } } } } },
  });

  if (!coupon || !coupon.active) {
    return { valid: false, error: "Invalid or expired coupon code" };
  }

  const now = new Date();
  if (coupon.startsAt && coupon.startsAt > now)
    return { valid: false, error: "This coupon is not active yet" };
  if (coupon.expiresAt && coupon.expiresAt < now)
    return { valid: false, error: "This coupon has expired" };
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit)
    return { valid: false, error: "This coupon has reached its usage limit" };

  // ── Determine scope and eligible subtotal ─────────────────────
  const scope: "platform" | "vendor" = coupon.vendorId ? "vendor" : "platform";
  const storeName = coupon.vendor?.store?.name ?? null;

  let eligibleSubtotal = subtotal;

  if (scope === "vendor" && items.length > 0) {
    // Only sum items from this vendor
    eligibleSubtotal = items
      .filter((i) => i.vendorId === coupon.vendorId)
      .reduce((sum, i) => sum + (i.salePrice ?? i.price) * i.quantity, 0);

    if (eligibleSubtotal === 0) {
      return {
        valid: false,
        error: storeName
          ? `This coupon only applies to products from "${storeName}". None of those products are in your cart.`
          : "This coupon only applies to a specific vendor's products, which aren't in your cart.",
      };
    }
  }

  if (coupon.minOrderAmount && eligibleSubtotal < Number(coupon.minOrderAmount)) {
    const scope_label = scope === "vendor" && storeName ? ` on ${storeName} products` : "";
    return {
      valid: false,
      error: `Minimum order of PKR ${Number(coupon.minOrderAmount).toLocaleString()}${scope_label} required`,
    };
  }

  // ── Compute discount on eligible subtotal only ────────────────
  const value = Number(coupon.value);
  let discountAmount = 0;
  let description = "";

  if (coupon.type === "PERCENTAGE") {
    discountAmount = Math.round((eligibleSubtotal * value) / 100);
    description = `${value}% off${scope === "vendor" && storeName ? ` on ${storeName}` : ""}`;
  } else if (coupon.type === "FIXED") {
    discountAmount = Math.min(value, eligibleSubtotal);
    description = `PKR ${value.toLocaleString()} off${scope === "vendor" && storeName ? ` on ${storeName}` : ""}`;
  } else if (coupon.type === "FREE_SHIPPING") {
    description = "Free shipping";
  }

  return {
    valid: true,
    type: coupon.type,
    value,
    code: coupon.code,
    description,
    scope,
    vendorId: coupon.vendorId,
    storeName,
    eligibleSubtotal,
    discountAmount,
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
      select: {
        id: true, vendorId: true, stock: true, trackInventory: true,
        category: { select: { commissionType: true, commissionValue: true } },
      },
    });

    // Fetch global commission rate
    const globalRateSetting = await db.settings.findUnique({ where: { key: "commission.global_rate" } });
    const globalRate = typeof (globalRateSetting?.value as any)?.rate === "number"
      ? (globalRateSetting!.value as any).rate
      : 10;

    // Fetch vendor commission overrides for all vendors in this order
    const vendorIds = [...new Set(products.map((p) => p.vendorId).filter(Boolean))] as string[];
    const vendorOverrides = vendorIds.length
      ? await db.vendorProfile.findMany({
          where: { id: { in: vendorIds } },
          select: { id: true, commissionType: true, commissionValue: true },
        })
      : [];
    const vendorOverrideMap = new Map(vendorOverrides.map((v) => [v.id, v]));

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

    const resolvedSource = (input.orderSource as OrderSource | undefined) ?? OrderSource.DIRECT;

    const order = await db.order.create({
      data: {
        orderNumber,
        customerId,
        shippingAddressId: address.id,
        orderSource: resolvedSource,
        sourceReference: input.sourceReference ?? null,
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
            const lineTotal = item.unitPrice * item.quantity;

            // Commission priority: vendor override → category rate → global rate
            let effectiveRate = globalRate;
            if (p.vendorId) {
              const vOverride = vendorOverrideMap.get(p.vendorId);
              if (vOverride?.commissionType === "PERCENTAGE_OF_SALE" && vOverride.commissionValue != null) {
                effectiveRate = Number(vOverride.commissionValue);
              } else if (p.category?.commissionType === "PERCENTAGE_OF_SALE" && p.category.commissionValue != null) {
                effectiveRate = Number(p.category.commissionValue);
              }
            }
            const commissionTotal = Math.round((lineTotal * effectiveRate) / 100);

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
              lineTotal,
              commissionTotal,
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

    // ── Send emails (fire-and-forget, never block order creation) ────────────
    void (async () => {
      try {
        const customer = await db.user.findUnique({
          where: { id: customerId },
          select: { email: true, name: true },
        });

        const shippingLine = [input.streetAddress, input.area, input.city, input.province]
          .filter(Boolean)
          .join(", ");

        const emailItems = input.items.map((i) => ({
          name: i.name,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
        }));

        if (customer?.email) {
          await sendEmail({
            to: customer.email,
            subject: `Order Confirmed: ${orderNumber} — ZainStore.pk`,
            html: orderConfirmationEmailHtml({
              customerName: customer.name ?? input.fullName,
              orderNumber,
              items: emailItems,
              subtotal: input.subtotal,
              shippingTotal: input.shippingTotal,
              discountTotal: input.discountTotal,
              grandTotal: input.grandTotal,
              paymentMethod: input.paymentMethod,
              shippingAddress: shippingLine,
            }),
          });
        }

        // Notify each unique vendor with their items only
        const vendorItemMap = new Map<string, { userId: string; name: string; storeName: string; items: typeof emailItems }>();
        for (const item of input.items) {
          const p = productMap.get(item.productId);
          if (!p?.vendorId) continue;
          if (!vendorItemMap.has(p.vendorId)) {
            const vendorInfo = await db.vendorProfile.findUnique({
              where: { id: p.vendorId },
              select: { userId: true, user: { select: { name: true, email: true } }, store: { select: { name: true } } },
            });
            if (!vendorInfo) continue;
            vendorItemMap.set(p.vendorId, {
              userId: vendorInfo.userId,
              name: vendorInfo.user.name ?? "Vendor",
              storeName: vendorInfo.store?.name ?? "Your Store",
              items: [],
            });
          }
          vendorItemMap.get(p.vendorId)!.items.push({ name: item.name, quantity: item.quantity, unitPrice: item.unitPrice });
        }

        for (const [vendorId, v] of vendorItemMap) {
          const vendorUser = await db.user.findUnique({ where: { id: v.userId }, select: { email: true } });
          if (!vendorUser?.email) continue;
          const vendorTotal = v.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
          await sendEmail({
            to: vendorUser.email,
            subject: `New Order: ${orderNumber} — ZainStore.pk`,
            html: vendorNewOrderEmailHtml({
              vendorName: v.name,
              storeName: v.storeName,
              orderNumber,
              customerName: input.fullName,
              items: v.items,
              vendorTotal,
            }),
          });
        }
      } catch (emailErr) {
        console.error("Order email error:", emailErr);
      }
    })();

    return { success: true, orderNumber, orderId: order.id };
  } catch (err) {
    console.error("placeOrder error:", err);
    return { success: false, error: "Failed to place order. Please try again." };
  }
}
