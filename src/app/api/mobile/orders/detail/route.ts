import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getMobileUser } from "@/lib/mobile/jwt";

export async function GET(req: Request) {
  const user = await getMobileUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get("orderId");
  if (!orderId) return NextResponse.json({ error: "orderId required." }, { status: 400 });

  try {
    const order = await db.order.findFirst({
      where: { id: orderId, customerId: user.id },
      include: {
        shippingAddress: { select: { line1: true, city: true, country: true } },
        items: {
          select: {
            id: true, name: true, quantity: true, unitPrice: true, lineTotal: true,
            product: { select: { images: { take: 1, select: { url: true }, orderBy: { sortOrder: "asc" } } } },
          },
        },
      },
    });

    if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });

    return NextResponse.json({
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.paymentStatus,
        subtotal: Number(order.subtotal),
        shippingTotal: Number(order.shippingTotal),
        grandTotal: Number(order.grandTotal),
        notes: order.notes,
        trackingNumber: order.trackingNumber,
        createdAt: order.createdAt.toISOString(),
        shippingAddress: order.shippingAddress,
        items: order.items.map((i) => ({
          id: i.id,
          name: i.name,
          quantity: i.quantity,
          unitPrice: Number(i.unitPrice),
          lineTotal: Number(i.lineTotal),
          imageUrl: i.product?.images[0]?.url ?? null,
        })),
      },
    });
  } catch (e) {
    console.error("[mobile/orders/detail]", e);
    return NextResponse.json({ error: "Failed to fetch order." }, { status: 500 });
  }
}
