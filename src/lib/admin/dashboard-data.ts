import { OrderStatus, PaymentStatus, ProductStatus, VendorStatus, WithdrawalStatus, RefundStatus, UserRole } from "@prisma/client";
import { db } from "@/lib/db";

// ── Summary Stats ────────────────────────────────────────────────────────────

export async function getAdminDashboardStats() {
  const [
    totalOrders,
    totalVendors,
    totalCustomers,
    totalProducts,
    pendingVendorApprovals,
    pendingWithdrawals,
    pendingRefunds,
    revenueResult,
    thisMonthRevenueResult,
    lastMonthRevenueResult,
  ] = await Promise.all([
    db.order.count(),
    db.vendorProfile.count({ where: { status: VendorStatus.ACTIVE } }),
    db.user.count({ where: { role: UserRole.CUSTOMER } }),
    db.product.count({ where: { status: ProductStatus.ACTIVE } }),
    db.vendorProfile.count({ where: { status: VendorStatus.PENDING_APPROVAL } }),
    db.withdrawal.count({ where: { status: WithdrawalStatus.REQUESTED } }),
    db.refundRequest.count({ where: { status: RefundStatus.REQUESTED } }),
    db.order.aggregate({
      _sum: { grandTotal: true },
      where: { paymentStatus: PaymentStatus.PAID },
    }),
    db.order.aggregate({
      _sum: { grandTotal: true },
      where: {
        paymentStatus: PaymentStatus.PAID,
        createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
      },
    }),
    db.order.aggregate({
      _sum: { grandTotal: true },
      where: {
        paymentStatus: PaymentStatus.PAID,
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1),
          lt: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
    }),
  ]);

  const totalRevenue = Number(revenueResult._sum.grandTotal ?? 0);
  const thisMonthRevenue = Number(thisMonthRevenueResult._sum.grandTotal ?? 0);
  const lastMonthRevenue = Number(lastMonthRevenueResult._sum.grandTotal ?? 0);
  const revenueGrowth =
    lastMonthRevenue > 0
      ? (((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100).toFixed(1)
      : null;

  return {
    totalRevenue,
    thisMonthRevenue,
    revenueGrowth,
    totalOrders,
    totalVendors,
    totalCustomers,
    totalProducts,
    pendingVendorApprovals,
    pendingWithdrawals,
    pendingRefunds,
  };
}

// ── Revenue Chart ────────────────────────────────────────────────────────────

export type RevenuePeriod = "daily" | "weekly" | "monthly" | "yearly";

export async function getRevenueChartData(period: RevenuePeriod = "monthly") {
  const now = new Date();
  let points: { label: string; from: Date; to: Date }[] = [];

  if (period === "daily") {
    // Last 14 days
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const from = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const to = new Date(from);
      to.setDate(to.getDate() + 1);
      points.push({ label: `${d.getDate()} ${d.toLocaleString("en-PK", { month: "short" })}`, from, to });
    }
  } else if (period === "weekly") {
    // Last 12 weeks
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i * 7);
      const from = new Date(d.getFullYear(), d.getMonth(), d.getDate() - d.getDay());
      const to = new Date(from);
      to.setDate(to.getDate() + 7);
      points.push({ label: `W${getWeekNumber(from)}`, from, to });
    }
  } else if (period === "monthly") {
    // Last 12 months
    for (let i = 11; i >= 0; i--) {
      const from = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const to = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      points.push({ label: from.toLocaleString("en-PK", { month: "short", year: "2-digit" }), from, to });
    }
  } else {
    // Last 5 years
    for (let i = 4; i >= 0; i--) {
      const year = now.getFullYear() - i;
      const from = new Date(year, 0, 1);
      const to = new Date(year + 1, 0, 1);
      points.push({ label: String(year), from, to });
    }
  }

  const series = await Promise.all(
    points.map(async ({ label, from, to }) => {
      const result = await db.order.aggregate({
        _sum: { grandTotal: true },
        _count: { id: true },
        where: { paymentStatus: PaymentStatus.PAID, createdAt: { gte: from, lt: to } },
      });
      return {
        label,
        revenue: Number(result._sum.grandTotal ?? 0),
        orders: result._count.id,
      };
    }),
  );

  return series;
}

function getWeekNumber(d: Date) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

// ── Recent Orders ────────────────────────────────────────────────────────────

export async function getRecentOrders(limit = 8) {
  return db.order.findMany({
    take: limit,
    orderBy: { createdAt: "desc" },
    include: {
      customer: { select: { id: true, name: true, email: true } },
      items: {
        take: 1,
        include: { vendor: { include: { store: { select: { name: true } } } } },
      },
    },
  });
}

// ── Recent Vendor Registrations ───────────────────────────────────────────────

export async function getRecentVendors(limit = 6) {
  return db.vendorProfile.findMany({
    take: limit,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, name: true, email: true } },
      store: { select: { id: true, name: true, logoUrl: true } },
      _count: { select: { products: true } },
    },
  });
}

// ── Top Selling Products ──────────────────────────────────────────────────────

export async function getTopSellingProducts(limit = 5) {
  const items = await db.orderItem.groupBy({
    by: ["productId"],
    _sum: { lineTotal: true, quantity: true },
    _count: { id: true },
    orderBy: { _sum: { lineTotal: "desc" } },
    take: limit,
  });

  const products = await db.product.findMany({
    where: { id: { in: items.map((i) => i.productId) } },
    include: {
      images: { take: 1, orderBy: { sortOrder: "asc" } },
      store: { select: { name: true } },
    },
  });

  return items.map((item) => ({
    ...item,
    product: products.find((p) => p.id === item.productId)!,
  }));
}

// ── Top Performing Vendors ────────────────────────────────────────────────────

export async function getTopVendors(limit = 5) {
  const items = await db.orderItem.groupBy({
    by: ["vendorId"],
    _sum: { lineTotal: true, commissionTotal: true },
    _count: { id: true },
    orderBy: { _sum: { lineTotal: "desc" } },
    take: limit,
  });

  const vendors = await db.vendorProfile.findMany({
    where: { id: { in: items.map((i) => i.vendorId) } },
    include: {
      user: { select: { name: true } },
      store: { select: { name: true, logoUrl: true } },
      _count: { select: { products: true } },
    },
  });

  return items.map((item) => ({
    ...item,
    vendor: vendors.find((v) => v.id === item.vendorId)!,
  }));
}

// ── Low Stock Alerts ──────────────────────────────────────────────────────────

export async function getLowStockProducts(limit = 6) {
  // Prisma doesn't support field-to-field comparisons in `where`, so use $queryRaw
  const rows = await db.$queryRaw<
    Array<{ id: string; name: string; stock: number; lowStockThreshold: number; storeId: string }>
  >`
    SELECT p.id, p.name, p.stock, p."lowStockThreshold", p."storeId"
    FROM "Product" p
    WHERE p.status = 'ACTIVE'
      AND p.stock <= p."lowStockThreshold"
    ORDER BY p.stock ASC
    LIMIT ${limit}
  `;

  if (rows.length === 0) return [];

  const products = await db.product.findMany({
    where: { id: { in: rows.map((r) => r.id) } },
    include: {
      images: { take: 1, orderBy: { sortOrder: "asc" } },
      store: { select: { name: true } },
    },
  });

  return rows
    .map((r) => products.find((p) => p.id === r.id)!)
    .filter(Boolean);
}

// ── Pending Actions Queue ─────────────────────────────────────────────────────

export async function getPendingActionCounts() {
  const [vendorApprovals, withdrawalRequests, refundRequests, pendingProducts, openTickets] =
    await Promise.all([
      db.vendorProfile.count({ where: { status: VendorStatus.PENDING_APPROVAL } }),
      db.withdrawal.count({ where: { status: WithdrawalStatus.REQUESTED } }),
      db.refundRequest.count({ where: { status: RefundStatus.REQUESTED } }),
      db.product.count({ where: { status: ProductStatus.PENDING_REVIEW } }),
      db.supportTicket.count({ where: { status: { in: ["OPEN", "PENDING_VENDOR", "PENDING_CUSTOMER"] } } }),
    ]);

  return { vendorApprovals, withdrawalRequests, refundRequests, pendingProducts, openTickets };
}

// ── Pending Vendors (for queue) ───────────────────────────────────────────────

export async function getPendingVendors(limit = 5) {
  return db.vendorProfile.findMany({
    where: { status: VendorStatus.PENDING_APPROVAL },
    take: limit,
    orderBy: { createdAt: "asc" },
    include: {
      user: { select: { id: true, name: true, email: true, createdAt: true } },
      store: { select: { name: true } },
    },
  });
}

// ── Pending Withdrawals ───────────────────────────────────────────────────────

export async function getPendingWithdrawals(limit = 5) {
  return db.withdrawal.findMany({
    where: { status: WithdrawalStatus.REQUESTED },
    take: limit,
    orderBy: { requestedAt: "asc" },
    include: {
      vendor: {
        include: {
          user: { select: { name: true } },
          store: { select: { name: true } },
        },
      },
    },
  });
}

// ── Pending Refunds ───────────────────────────────────────────────────────────

export async function getPendingRefunds(limit = 5) {
  return db.refundRequest.findMany({
    where: { status: RefundStatus.REQUESTED },
    take: limit,
    orderBy: { createdAt: "asc" },
    include: {
      customer: { select: { name: true } },
      order: { select: { orderNumber: true } },
      vendor: { include: { store: { select: { name: true } } } },
    },
  });
}
