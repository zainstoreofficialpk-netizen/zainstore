import { VendorStatus, UserRole } from "@prisma/client";
import { db } from "@/lib/db";

export const VENDORS_PER_PAGE = 20;

export type VendorFilter = {
  search?: string;
  status?: VendorStatus | "ALL";
  page?: number;
};

// ── Paginated vendor list ────────────────────────────────────────────────────

export async function getVendorList(filter: VendorFilter = {}) {
  const { search = "", status = "ALL", page = 1 } = filter;
  const skip = (page - 1) * VENDORS_PER_PAGE;

  const where = {
    ...(status !== "ALL" ? { status: status as VendorStatus } : {}),
    ...(search.trim()
      ? {
          OR: [
            { user: { name: { contains: search, mode: "insensitive" as const } } },
            { user: { email: { contains: search, mode: "insensitive" as const } } },
            { store: { name: { contains: search, mode: "insensitive" as const } } },
          ],
        }
      : {}),
  };

  const [vendors, total] = await Promise.all([
    db.vendorProfile.findMany({
      where,
      skip,
      take: VENDORS_PER_PAGE,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, status: true, image: true, createdAt: true } },
        store: { select: { id: true, name: true, slug: true, logoUrl: true } },
        _count: { select: { products: true, orders: true, withdrawals: true } },
      },
    }),
    db.vendorProfile.count({ where }),
  ]);

  return {
    vendors,
    total,
    page,
    totalPages: Math.ceil(total / VENDORS_PER_PAGE),
  };
}

// ── Single vendor full detail ─────────────────────────────────────────────────

export async function getVendorDetail(vendorId: string) {
  return db.vendorProfile.findUnique({
    where: { id: vendorId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          image: true,
          status: true,
          createdAt: true,
        },
      },
      store: true,
      _count: { select: { products: true, orders: true, withdrawals: true } },
    },
  });
}

// ── Revenue for a single vendor ───────────────────────────────────────────────

export async function getVendorRevenue(vendorId: string) {
  const result = await db.orderItem.aggregate({
    where: { vendorId },
    _sum: { lineTotal: true, commissionTotal: true },
    _count: { id: true },
  });
  return {
    totalRevenue: Number(result._sum.lineTotal ?? 0),
    totalCommission: Number(result._sum.commissionTotal ?? 0),
    totalOrders: result._count.id,
  };
}

// ── Vendor → Admin message thread ─────────────────────────────────────────────

export async function getVendorMessages(vendorUserId: string, adminUserId: string) {
  return db.message.findMany({
    where: {
      OR: [
        { senderId: vendorUserId, receiverId: adminUserId },
        { senderId: adminUserId, receiverId: vendorUserId },
      ],
      ticketId: null, // direct messages only
    },
    orderBy: { createdAt: "asc" },
    include: {
      sender: { select: { id: true, name: true, image: true, role: true } },
    },
  });
}

// Mark all vendor→admin messages as read

export async function markVendorMessagesRead(vendorUserId: string, adminUserId: string) {
  await db.message.updateMany({
    where: {
      senderId: vendorUserId,
      receiverId: adminUserId,
      readAt: null,
    },
    data: { readAt: new Date() },
  });
}

// ── Activity log for vendor ───────────────────────────────────────────────────

export async function getVendorActivityLog(vendorId: string, limit = 30) {
  return db.activityLog.findMany({
    where: { entityId: vendorId, entity: "vendor" },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      actor: { select: { name: true, role: true } },
    },
  });
}

// ── Admin user (for messaging) ────────────────────────────────────────────────

export async function getAdminUser() {
  return db.user.findFirst({
    where: { role: UserRole.SUPER_ADMIN },
    select: { id: true, name: true, image: true },
  });
}

// ── Unread notification count ─────────────────────────────────────────────────

export async function getUnreadNotificationCount(userId: string) {
  return db.notification.count({ where: { userId, readAt: null } });
}

// ── Admin notifications ───────────────────────────────────────────────────────

export async function getAdminNotifications(adminUserId: string, limit = 20) {
  return db.notification.findMany({
    where: { userId: adminUserId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
