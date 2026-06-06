import { db } from "@/lib/db";
import { OrderStatus, PaymentStatus, WithdrawalStatus, RefundStatus } from "@prisma/client";
import { EARNINGS_HOLD_DAYS } from "@/lib/admin/withdrawal-data";

function holdCutoff(): Date {
  const d = new Date();
  d.setDate(d.getDate() - EARNINGS_HOLD_DAYS);
  return d;
}

// Statuses that reserve a portion of the vendor's balance (prevent double-requesting)
const IN_FLIGHT_STATUSES: WithdrawalStatus[] = [
  WithdrawalStatus.REQUESTED,
  WithdrawalStatus.APPROVED,
  WithdrawalStatus.PROCESSING,
];

// ── Vendor balance (vendor-scoped) ────────────────────────────────────────────

export async function getVendorBalance(vendorId: string) {
  const vendor = await db.vendorProfile.findUnique({
    where: { id: vendorId },
    select: { userId: true },
  });
  if (!vendor) return { grossEarnings: 0, totalCommission: 0, vendorEarnings: 0, heldEarnings: 0, paidOut: 0, inProgress: 0, committed: 0, available: 0 };

  const refundExclusion = {
    refundRequests: {
      none: { status: { in: [RefundStatus.APPROVED, RefundStatus.PROCESSED] as RefundStatus[] } },
    },
  };

  const [earningsAgg, heldAgg, paidOutAgg, inProgressAgg] = await Promise.all([
    // Eligible (delivered, paid, past hold period, no approved refunds)
    db.orderItem.aggregate({
      _sum: { lineTotal: true, commissionTotal: true },
      where: {
        vendorId,
        order: {
          status: OrderStatus.DELIVERED,
          paymentStatus: PaymentStatus.PAID,
          deliveredAt: { not: null, lte: holdCutoff() },
          customerId: { not: vendor.userId },
          ...refundExclusion,
        },
      },
    }),
    // Held (delivered, paid, still within hold window)
    db.orderItem.aggregate({
      _sum: { lineTotal: true, commissionTotal: true },
      where: {
        vendorId,
        order: {
          status: OrderStatus.DELIVERED,
          paymentStatus: PaymentStatus.PAID,
          deliveredAt: { not: null, gt: holdCutoff() },
          customerId: { not: vendor.userId },
          ...refundExclusion,
        },
      },
    }),
    // Already paid out (terminal — permanently reduces pool)
    db.withdrawal.aggregate({
      _sum: { amount: true },
      where: { vendorId, status: WithdrawalStatus.PAID },
    }),
    // In-flight (REQUESTED | APPROVED | PROCESSING) — reserves balance
    // CANCELLED, REJECTED, REVERSED are excluded so balance is automatically restored
    db.withdrawal.aggregate({
      _sum: { amount: true },
      where: { vendorId, status: { in: IN_FLIGHT_STATUSES } },
    }),
  ]);

  const grossEarnings = Number(earningsAgg._sum?.lineTotal ?? 0);
  const totalCommission = Number(earningsAgg._sum?.commissionTotal ?? 0);
  const vendorEarnings = grossEarnings - totalCommission;

  const heldGross = Number(heldAgg._sum?.lineTotal ?? 0);
  const heldCommission = Number(heldAgg._sum?.commissionTotal ?? 0);
  const heldEarnings = heldGross - heldCommission;

  const paidOut = Number(paidOutAgg._sum?.amount ?? 0);
  const inProgress = Number(inProgressAgg._sum?.amount ?? 0);
  const committed = paidOut + inProgress;
  const available = Math.max(0, vendorEarnings - committed);

  return { grossEarnings, totalCommission, vendorEarnings, heldEarnings, paidOut, inProgress, committed, available };
}

// ── Check if vendor already has an open (in-flight) request ──────────────────
// Includes PROCESSING so admin cannot move a request to processing while vendor
// thinks their request disappeared and submits another one.

export async function getOpenWithdrawalRequest(vendorId: string) {
  return db.withdrawal.findFirst({
    where: {
      vendorId,
      status: { in: IN_FLIGHT_STATUSES },
    },
    orderBy: { requestedAt: "desc" },
  });
}

// ── Vendor's full payout history ──────────────────────────────────────────────

export async function getVendorPayoutHistory(vendorId: string) {
  const withdrawals = await db.withdrawal.findMany({
    where: { vendorId },
    orderBy: { requestedAt: "desc" },
  });
  return withdrawals.map((w) => ({ ...w, amount: Number(w.amount) }));
}

// ── Per-order earnings breakdown ──────────────────────────────────────────────

export async function getVendorEarningsBreakdown(vendorId: string, limit = 20) {
  const vendor = await db.vendorProfile.findUnique({
    where: { id: vendorId },
    select: { userId: true },
  });
  if (!vendor) return [];

  const items = await db.orderItem.findMany({
    where: {
      vendorId,
      order: {
        status: OrderStatus.DELIVERED,
        paymentStatus: PaymentStatus.PAID,
        deliveredAt: { not: null },
        customerId: { not: vendor.userId },
        // Exclude orders where a refund was approved/processed
        refundRequests: {
          none: {
            status: { in: [RefundStatus.APPROVED, RefundStatus.PROCESSED] as RefundStatus[] },
          },
        },
      },
    },
    include: {
      order: { select: { orderNumber: true, createdAt: true, deliveredAt: true } },
      product: { select: { name: true } },
    },
    orderBy: { order: { createdAt: "desc" } },
    take: limit,
  });

  const cutoff = holdCutoff();

  return items.map((item) => {
    const delivered = item.order.deliveredAt!;
    const unlockDate = new Date(delivered);
    unlockDate.setDate(unlockDate.getDate() + EARNINGS_HOLD_DAYS);
    const isHeld = delivered > cutoff;

    return {
      orderNumber: item.order.orderNumber,
      orderDate: item.order.createdAt,
      deliveredAt: delivered,
      unlockDate,
      isHeld,
      productName: item.product.name,
      quantity: item.quantity,
      lineTotal: Number(item.lineTotal),
      commissionTotal: Number(item.commissionTotal),
      vendorEarning: Number(item.lineTotal) - Number(item.commissionTotal),
    };
  });
}
