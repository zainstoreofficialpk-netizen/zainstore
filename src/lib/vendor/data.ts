import { db } from "@/lib/db";
import { UserRole } from "@prisma/client";

// ── Admin user (for messaging) ────────────────────────────────────────────────

export async function getAdminUserForVendor() {
  return db.user.findFirst({
    where: { role: UserRole.SUPER_ADMIN },
    select: { id: true, name: true, image: true, role: true },
  });
}

// ── Vendor → Admin message thread ─────────────────────────────────────────────

export async function getVendorAdminMessages(vendorUserId: string, adminUserId: string) {
  const messages = await db.message.findMany({
    where: {
      OR: [
        { senderId: vendorUserId, receiverId: adminUserId },
        { senderId: adminUserId, receiverId: vendorUserId },
      ],
      ticketId: null,
    },
    orderBy: { createdAt: "asc" },
    include: {
      sender: { select: { id: true, name: true, image: true, role: true } },
    },
  });

  // Mark admin→vendor messages as read
  await db.message.updateMany({
    where: { senderId: adminUserId, receiverId: vendorUserId, readAt: null },
    data: { readAt: new Date() },
  });

  return messages;
}

export async function getVendorUnreadMessageCount(vendorUserId: string, adminUserId: string) {
  return db.message.count({
    where: { senderId: adminUserId, receiverId: vendorUserId, readAt: null },
  });
}

// ── Vendor notifications ──────────────────────────────────────────────────────

export async function getVendorNotifications(userId: string, limit = 30) {
  return db.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getVendorUnreadNotificationCount(userId: string) {
  return db.notification.count({ where: { userId, readAt: null } });
}
