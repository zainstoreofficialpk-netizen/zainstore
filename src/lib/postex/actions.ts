"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { createPostExOrder, cancelPostExOrder, getPostExAirwaybill } from "./client";

type ActionResult = { success: true; message: string } | { success: false; error: string };

export interface PostExBookingInput {
  orderId: string;
  customerName: string;
  customerPhone: string;
  orderDate: string;
  invoicePayment: number;
  deliveryAddress: string;
  districtName: string; // maps to cityName in PostEx API
  pickupAddressCode: string;
  returnAddressCode: string;
  orderWeight: number;
  orderDetail: string;
}

export async function bookPostExShipment(
  input: PostExBookingInput,
): Promise<ActionResult & { trackingNumber?: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { success: false, error: "Unauthorized" };

  const order = await db.order.findUnique({
    where: { id: input.orderId },
    include: { items: { include: { vendor: true } } },
  });

  if (!order) return { success: false, error: "Order not found" };

  if (session.user.role === "VENDOR") {
    const vendorProfile = await db.vendorProfile.findUnique({
      where: { userId: session.user.id },
    });
    const hasItems = order.items.some((i) => i.vendorId === vendorProfile?.id);
    if (!hasItems) return { success: false, error: "Unauthorized" };
  } else if (session.user.role !== "SUPER_ADMIN") {
    return { success: false, error: "Unauthorized" };
  }

  if (order.postexAwbNumber) {
    return { success: false, error: "Shipment already booked for this order" };
  }

  try {
    const response = await createPostExOrder({
      orderRefNumber: order.orderNumber,
      orderDate: input.orderDate,
      orderType: "Normal",
      paymentMode: "COD",
      invoicePayment: input.invoicePayment,
      orderWeight: input.orderWeight,
      orderDetail: input.orderDetail,
      customerName: input.customerName,
      customerPhone: input.customerPhone,
      deliveryAddress: input.deliveryAddress,
      cityName: input.districtName,
      pickupAddressCode: input.pickupAddressCode,
      returnAddressCode: input.returnAddressCode,
    });

    if (response.statusCode !== "200") {
      return { success: false, error: response.statusMessage ?? "PostEx booking failed" };
    }

    const trackingNumber = response.dist.trackingNumber;

    await db.order.update({
      where: { id: order.id },
      data: {
        trackingNumber,
        postexAwbNumber: trackingNumber,
        postexBookedAt: new Date(),
        trackingUrl: `https://postex.pk/tracking?trackingNumber=${trackingNumber}`,
      },
    });

    return { success: true, message: "Shipment booked successfully", trackingNumber };
  } catch (err) {
    const message = err instanceof Error ? err.message : "PostEx booking failed";
    return { success: false, error: message };
  }
}

export async function cancelPostExShipmentAction(
  orderId: string,
): Promise<ActionResult> {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    return { success: false, error: "Unauthorized" };
  }

  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order) return { success: false, error: "Order not found" };
  if (!order.postexAwbNumber) return { success: false, error: "No PostEx booking found" };

  try {
    const response = await cancelPostExOrder(order.postexAwbNumber);

    if (response.statusCode !== "200") {
      return { success: false, error: response.statusMessage ?? "Cancellation failed" };
    }

    await db.order.update({
      where: { id: order.id },
      data: { postexAwbNumber: null, postexBookedAt: null, trackingNumber: null, trackingUrl: null },
    });

    return { success: true, message: "PostEx shipment cancelled" };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Cancellation failed";
    return { success: false, error: message };
  }
}

export async function fetchAirwaybillAction(
  trackingNumber: string,
): Promise<{ success: true; base64: string } | { success: false; error: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { success: false, error: "Unauthorized" };

  try {
    const response = await getPostExAirwaybill(trackingNumber);
    if (response.statusCode !== "200") {
      return { success: false, error: response.statusMessage ?? "Failed to fetch airway bill" };
    }
    return { success: true, base64: response.dist.base64 };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch airway bill";
    return { success: false, error: message };
  }
}

export async function getVendorPostExCodes(vendorProfileId: string) {
  const vendor = await db.vendorProfile.findUnique({
    where: { id: vendorProfileId },
    select: {
      postexPickupCode: true,
      postexReturnCode: true,
      store: { select: { address: true, phone: true, name: true } },
    },
  });
  return vendor;
}
