"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";

type ActionResult = { success: boolean; message?: string; error?: string };

async function requireCustomer() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user;
}

export async function markCustomerNotificationRead(notificationId: string): Promise<ActionResult> {
  try {
    const user = await requireCustomer();
    await db.notification.updateMany({
      where: { id: notificationId, userId: user.id },
      data: { readAt: new Date() },
    });
    revalidatePath("/customer/notifications");
    return { success: true, message: "Marked as read." };
  } catch {
    return { success: false, error: "Failed to mark notification." };
  }
}

export async function markAllCustomerNotificationsRead(): Promise<ActionResult> {
  try {
    const user = await requireCustomer();
    await db.notification.updateMany({
      where: { userId: user.id, readAt: null },
      data: { readAt: new Date() },
    });
    revalidatePath("/customer/notifications");
    return { success: true, message: "All notifications marked as read." };
  } catch {
    return { success: false, error: "Failed to mark notifications." };
  }
}

export async function getCustomerNotifications(userId: string, limit = 30) {
  return db.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getCustomerUnreadCount(userId: string) {
  return db.notification.count({ where: { userId, readAt: null } });
}
