import { db } from "@/lib/db";
import { OrderStatus } from "@prisma/client";

// ── Shared order include (used across list + detail) ─────────────────────────

const ORDER_INCLUDE = {
  items: {
    include: {
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          images: { take: 1, orderBy: { sortOrder: "asc" as const }, select: { url: true, alt: true } },
        },
      },
      variant: { select: { id: true, name: true } },
      vendor: { select: { id: true, store: { select: { name: true } } } },
    },
  },
  shippingAddress: true,
  timeline: { orderBy: { createdAt: "asc" as const } },
  payments: { select: { method: true, status: true, amount: true, createdAt: true } },
} as const;

// ── Order list (paginated, with optional filter) ──────────────────────────────

export async function getCustomerOrders(
  userId: string,
  opts: { status?: OrderStatus; search?: string; page?: number } = {},
) {
  const { status, search, page = 1 } = opts;
  const LIMIT = 10;

  const where: Record<string, unknown> = { customerId: userId };
  if (status) where.status = status;
  if (search) where.orderNumber = { contains: search, mode: "insensitive" };

  const [orders, total] = await Promise.all([
    db.order.findMany({
      where,
      skip: (page - 1) * LIMIT,
      take: LIMIT,
      orderBy: { createdAt: "desc" },
      include: ORDER_INCLUDE,
    }),
    db.order.count({ where }),
  ]);

  return { orders, total, pages: Math.ceil(total / LIMIT) };
}

// ── Single order detail ───────────────────────────────────────────────────────

export async function getCustomerOrder(orderId: string, userId: string) {
  return db.order.findFirst({
    where: { id: orderId, customerId: userId },
    include: ORDER_INCLUDE,
  });
}

// ── Customer dashboard stats ──────────────────────────────────────────────────

export async function getCustomerOrderStats(userId: string) {
  const [total, active, delivered, cancelled] = await Promise.all([
    db.order.count({ where: { customerId: userId } }),
    db.order.count({
      where: {
        customerId: userId,
        status: {
          in: [
            OrderStatus.PENDING,
            OrderStatus.PROCESSING,
            OrderStatus.READY_FOR_DISPATCH,
            OrderStatus.SHIPPED,
            OrderStatus.OUT_FOR_DELIVERY,
          ],
        },
      },
    }),
    db.order.count({ where: { customerId: userId, status: OrderStatus.DELIVERED } }),
    db.order.count({ where: { customerId: userId, status: OrderStatus.CANCELLED } }),
  ]);
  return { total, active, delivered, cancelled };
}

// ── Recent orders for overview page ──────────────────────────────────────────

export async function getCustomerRecentOrders(userId: string, limit = 5) {
  return db.order.findMany({
    where: { customerId: userId },
    take: limit,
    orderBy: { createdAt: "desc" },
    include: {
      items: {
        take: 2,
        include: {
          product: { select: { name: true, images: { take: 1, select: { url: true } } } },
          vendor: { select: { store: { select: { name: true } } } },
        },
      },
    },
  });
}
