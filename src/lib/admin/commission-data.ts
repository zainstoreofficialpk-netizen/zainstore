import { db } from "@/lib/db";
import { PaymentStatus } from "@prisma/client";

const GLOBAL_RATE_KEY = "commission.global_rate";
const DEFAULT_RATE = 10; // 10%

// ── Global commission rate ────────────────────────────────────────────────────

export async function getGlobalCommissionRate(): Promise<number> {
  const setting = await db.settings.findUnique({ where: { key: GLOBAL_RATE_KEY } });
  if (!setting) return DEFAULT_RATE;
  const val = setting.value as { rate?: number };
  return typeof val?.rate === "number" ? val.rate : DEFAULT_RATE;
}

// ── Commission stats ──────────────────────────────────────────────────────────

export async function getCommissionStats() {
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [totalResult, thisMonthResult, lastMonthResult, totalOrders] = await Promise.all([
    db.orderItem.aggregate({ _sum: { commissionTotal: true, lineTotal: true } }),
    db.orderItem.aggregate({
      _sum: { commissionTotal: true },
      where: { order: { createdAt: { gte: thisMonthStart }, paymentStatus: PaymentStatus.PAID } },
    }),
    db.orderItem.aggregate({
      _sum: { commissionTotal: true },
      where: {
        order: {
          createdAt: { gte: lastMonthStart, lt: thisMonthStart },
          paymentStatus: PaymentStatus.PAID,
        },
      },
    }),
    db.order.count({ where: { paymentStatus: PaymentStatus.PAID } }),
  ]);

  const totalCommission = Number(totalResult._sum.commissionTotal ?? 0);
  const totalRevenue = Number(totalResult._sum.lineTotal ?? 0);
  const thisMonth = Number(thisMonthResult._sum.commissionTotal ?? 0);
  const lastMonth = Number(lastMonthResult._sum.commissionTotal ?? 0);
  const growth = lastMonth > 0 ? (((thisMonth - lastMonth) / lastMonth) * 100).toFixed(1) : null;

  return { totalCommission, totalRevenue, thisMonth, lastMonth, growth, totalOrders };
}

// ── Per-vendor commission breakdown ──────────────────────────────────────────

export async function getVendorCommissionBreakdown() {
  const items = await db.orderItem.groupBy({
    by: ["vendorId"],
    _sum: { lineTotal: true, commissionTotal: true },
    _count: { id: true },
    orderBy: { _sum: { commissionTotal: "desc" } },
    take: 50,
  });

  if (items.length === 0) return [];

  const vendors = await db.vendorProfile.findMany({
    where: { id: { in: items.map((i) => i.vendorId) } },
    include: {
      user: { select: { name: true } },
      store: { select: { name: true } },
    },
  });

  return items.map((item) => {
    const vendor = vendors.find((v) => v.id === item.vendorId);
    const revenue = Number(item._sum.lineTotal ?? 0);
    const commission = Number(item._sum.commissionTotal ?? 0);
    const effectiveRate = revenue > 0 ? ((commission / revenue) * 100).toFixed(1) : "—";

    return {
      vendorId: item.vendorId,
      storeName: vendor?.store?.name ?? "Unknown",
      ownerName: vendor?.user?.name ?? "Unknown",
      overrideRate: vendor?.commissionValue ? Number(vendor.commissionValue) : null,
      revenue,
      commission,
      effectiveRate,
      orders: item._count.id,
    };
  });
}
