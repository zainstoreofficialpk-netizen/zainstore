import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getMobileUser } from "@/lib/mobile/jwt";
import { OrderSource } from "@prisma/client";
import bcrypt from "bcryptjs";

function generateOrderNumber() {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `ZS-${ts}-${rand}`;
}

// Find or create a guest user so guest orders satisfy the customerId FK
async function resolveGuestUser(phone: string, name: string, email?: string) {
  const guestEmail = email?.trim() || `guest_${phone.replace(/\D/g, "")}@guest.zainstore.pk`;

  const existing = await db.user.findFirst({
    where: { OR: [{ email: guestEmail }, { phone: phone.trim() }] },
    select: { id: true },
  });
  if (existing) return existing.id;

  const hashed = await bcrypt.hash(Math.random().toString(36), 8);
  const created = await db.user.create({
    data: {
      name: name.trim(),
      email: guestEmail,
      phone: phone.trim(),
      passwordHash: hashed,
      role: "CUSTOMER",
    },
    select: { id: true },
  });
  return created.id;
}

// ── POST /api/mobile/orders — place a new order (auth optional for guests) ───

export async function POST(req: Request) {
  const authedUser = await getMobileUser(req);

  try {
    const body = await req.json();
    const { shippingName, shippingPhone, shippingEmail, shippingAddress, shippingCity, notes, items } = body;

    if (!shippingName || !shippingPhone || !shippingAddress || !shippingCity) {
      return NextResponse.json({ error: "Delivery information is required." }, { status: 400 });
    }
    if (!items || items.length === 0) {
      return NextResponse.json({ error: "Order must have at least one item." }, { status: 400 });
    }

    // Use logged-in user or resolve/create a guest user
    const customerId = authedUser
      ? authedUser.id
      : await resolveGuestUser(shippingPhone, shippingName, shippingEmail);

    // Verify all products exist and are in stock
    const productIds: string[] = items.map((i: any) => i.productId);
    const products = await db.product.findMany({
      where: { id: { in: productIds }, status: "ACTIVE" },
      select: { id: true, name: true, price: true, salePrice: true, stock: true, stockStatus: true, vendorId: true, sku: true },
    });

    if (products.length !== items.length) {
      return NextResponse.json({ error: "One or more products are unavailable." }, { status: 400 });
    }

    // Create shipping address record
    const address = await db.address.create({
      data: {
        userId: customerId,
        label: "Mobile Order",
        line1: `${shippingName} — ${shippingPhone} — ${shippingAddress}`,
        city: shippingCity,
        country: "Pakistan",
      },
    });

    const SHIPPING_FLAT = 200;
    const subtotal = items.reduce((sum: number, i: any) => sum + i.price * i.quantity, 0);
    const grandTotal = subtotal + SHIPPING_FLAT;

    const order = await db.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        customerId,
        shippingAddressId: address.id,
        status: "PENDING",
        paymentStatus: "PENDING",
        subtotal,
        shippingTotal: SHIPPING_FLAT,
        grandTotal,
        discountTotal: 0,
        taxTotal: 0,
        notes: notes || null,
        orderSource: OrderSource.OTHER,
        sourceReference: "app",
        items: {
          create: items.map((i: any) => {
            const product = products.find((p) => p.id === i.productId)!;
            const lineTotal = i.price * i.quantity;
            return {
              productId: i.productId,
              vendorId: product.vendorId,
              name: product.name,
              sku: product.sku ?? null,
              quantity: i.quantity,
              unitPrice: i.price,
              lineTotal,
              discountTotal: 0,
              taxTotal: 0,
              shippingTotal: 0,
              commissionTotal: 0,
            };
          }),
        },
      },
      select: { id: true, orderNumber: true },
    });

    for (const item of items) {
      await db.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
    }

    return NextResponse.json({ orderId: order.id, orderNumber: order.orderNumber }, { status: 201 });
  } catch (e: any) {
    console.error("[mobile/orders POST]", e);
    return NextResponse.json({ error: e?.message ?? "Failed to place order." }, { status: 500 });
  }
}

// ── GET /api/mobile/orders — customer's order history ────────────────────────

export async function GET(req: Request) {
  const user = await getMobileUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  try {
    const orders = await db.order.findMany({
      where: { customerId: user.id },
      orderBy: { createdAt: "desc" },
      take: 30,
      include: {
        items: {
          select: {
            id: true, name: true, quantity: true, unitPrice: true,
            product: { select: { images: { take: 1, select: { url: true }, orderBy: { sortOrder: "asc" } } } },
          },
        },
      },
    });

    return NextResponse.json({
      orders: orders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        paymentStatus: o.paymentStatus,
        grandTotal: Number(o.grandTotal),
        createdAt: o.createdAt.toISOString(),
        itemCount: o.items.length,
        firstImage: o.items[0]?.product?.images[0]?.url ?? null,
        items: o.items.map((i) => ({
          id: i.id,
          name: i.name,
          quantity: i.quantity,
          price: Number(i.unitPrice),
          imageUrl: i.product?.images[0]?.url ?? null,
        })),
      })),
    });
  } catch (e) {
    console.error("[mobile/orders GET]", e);
    return NextResponse.json({ error: "Failed to fetch orders." }, { status: 500 });
  }
}
