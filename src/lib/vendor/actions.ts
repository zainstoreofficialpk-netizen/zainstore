"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { NotificationType, UserRole } from "@prisma/client";

import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";

type ActionResult = { success: true; message: string } | { success: false; error: string };

async function requireVendor() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");
  if (session.user.role !== "VENDOR") throw new Error("Forbidden");
  return session.user;
}

// ── Send message to admin ─────────────────────────────────────────────────────

export async function sendMessageToAdminAction(body: string): Promise<ActionResult> {
  try {
    const vendor = await requireVendor();
    if (!body.trim()) return { success: false, error: "Message cannot be empty." };

    const admin = await db.user.findFirst({
      where: { role: UserRole.SUPER_ADMIN },
      select: { id: true },
    });
    if (!admin) return { success: false, error: "Admin not found." };

    await db.message.create({
      data: { senderId: vendor.id, receiverId: admin.id, body: body.trim() },
    });

    // Notify admin
    await db.notification.create({
      data: {
        userId: admin.id,
        type: NotificationType.SYSTEM,
        title: "New message from a vendor",
        body: body.length > 80 ? body.slice(0, 80) + "…" : body,
      },
    });

    revalidatePath("/vendor/messages");
    return { success: true, message: "Message sent." };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to send message." };
  }
}

// ── Mark vendor notifications read ───────────────────────────────────────────

export async function markVendorNotificationRead(notificationId: string): Promise<ActionResult> {
  try {
    const vendor = await requireVendor();
    await db.notification.updateMany({
      where: { id: notificationId, userId: vendor.id },
      data: { readAt: new Date() },
    });
    revalidatePath("/vendor/notifications");
    return { success: true, message: "Marked as read." };
  } catch {
    return { success: false, error: "Failed." };
  }
}

export async function markAllVendorNotificationsRead(): Promise<ActionResult> {
  try {
    const vendor = await requireVendor();
    await db.notification.updateMany({
      where: { userId: vendor.id, readAt: null },
      data: { readAt: new Date() },
    });
    revalidatePath("/vendor/notifications");
    return { success: true, message: "All notifications marked as read." };
  } catch {
    return { success: false, error: "Failed." };
  }
}
