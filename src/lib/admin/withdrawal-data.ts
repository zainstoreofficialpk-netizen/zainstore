import { db } from "@/lib/db";
import { OrderStatus, PaymentStatus, WithdrawalStatus, RefundStatus } from "@prisma/client";

// Days after delivery before earnings unlock for withdrawal
export const EARNINGS_HOLD_DAYS = 7;

// Statuses that reserve a portion of vendor balance
const IN_FLIGHT_STATUSES: WithdrawalStatus[] = [
  WithdrawalStatus.REQUESTED,
  WithdrawalStatus.APPROVED,
  WithdrawalStatus.PROCESSING,
];

// ── Shared eligibility filter ─────────────────────────────────────────────────
// An order item counts toward vendor earnings ONLY when ALL of these hold:
//   1. order.status = DELIVERED   (order reached end state)
//   2. order.paymentStatus = PAID (marketplace received money)
//   3. order.deliveredAt is set   (admin explicitly confirmed delivery)
//   4. deliveredAt + HOLD_DAYS < now  (holding period elapsed)
//   5. customer ≠ vendor's own user  (no self-purchases)
//   6. no approved/processed refund on the order

function holdCutoff(): Date {
  const d = new Date();
  d.setDate(d.getDate() - EARNINGS_HOLD_DAYS);
  return d;
}

function eligibleOrderWhere(vendorUserId: string) {
  return {
    status: OrderStatus.DELIVERED,
    paymentStatus: PaymentStatus.PAID,
    deliveredAt: { not: null, lte: holdCutoff() },
    customerId: { not: vendorUserId },
    refundRequests: {
      none: {
        status: { in: [RefundStatus.APPROVED, RefundStatus.PROCESSED] as RefundStatus[] },
      },
    },
  };
}

// ── Per-vendor balance calculation ────────────────────────────────────────────

export async function calcVendorBalance(vendorId: string) {
  const vendor = await db.vendorProfile.findUnique({
    where: { id: vendorId },
    select: { userId: true },
  });
  if (!vendor) return { grossEarnings: 0, totalCommission: 0, vendorEarnings: 0, heldEarnings: 0, committed: 0, available: 0 };

  const [earningsAgg, heldAgg, paidOutAgg, inProgressAgg] = await Promise.all([
    // Eligible earnings (past hold period, no fraud signals)
    db.orderItem.aggregate({
      _sum: { lineTotal: true, commissionTotal: true },
      where: { vendorId, order: eligibleOrderWhere(vendor.userId) },
    }),
    // Earnings still inside holding period
    db.orderItem.aggregate({
      _sum: { lineTotal: true, commissionTotal: true },
      where: {
        vendorId,
        order: {
          status: OrderStatus.DELIVERED,
          paymentStatus: PaymentStatus.PAID,
          deliveredAt: { not: null, gt: holdCutoff() },
          customerId: { not: vendor.userId },
          refundRequests: {
            none: { status: { in: [RefundStatus.APPROVED, RefundStatus.PROCESSED] as RefundStatus[] } },
          },
        },
      },
    }),
    // Already paid out (terminal)
    db.withdrawal.aggregate({
      _sum: { amount: true },
      where: { vendorId, status: WithdrawalStatus.PAID },
    }),
    // In-flight requests (REQUESTED | APPROVED | PROCESSING) — reserves balance
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

// ── All active vendors with their balances (admin overview) ───────────────────

export async function getAllVendorBalances() {
  const vendors = await db.vendorProfile.findMany({
    where: { status: "ACTIVE" },
    include: {
      user: { select: { name: true, email: true } },
      store: { select: { name: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const balances = await Promise.all(
    vendors.map(async (v) => {
      const bal = await calcVendorBalance(v.id);
      const [pending, lastPaid] = await Promise.all([
        db.withdrawal.count({
          where: { vendorId: v.id, status: { in: ["REQUESTED", "APPROVED"] } },
        }),
        db.withdrawal.findFirst({
          where: { vendorId: v.id, status: "PAID" },
          orderBy: { processedAt: "desc" },
          select: { paidAt: true, amount: true },
        }),
      ]);
      return {
        vendorId: v.id,
        storeName: v.store?.name ?? v.user.name ?? "—",
        ownerName: v.user.name ?? "—",
        email: v.user.email,
        bankName: v.bankName,
        accountTitle: v.accountTitle,
        accountNumber: v.accountNumber,
        iban: v.iban,
        ...bal,
        pendingRequestCount: pending,
        lastPaidAt: lastPaid?.paidAt ?? null,
        lastPaidAmount: lastPaid ? Number(lastPaid.amount) : null,
      };
    }),
  );

  return balances.sort((a, b) => b.available - a.available);
}

// ── Withdrawal list for admin (paginated, with filter) ────────────────────────

export type WithdrawalFilter =
  | "ALL" | "REQUESTED" | "APPROVED" | "PROCESSING" | "PAID" | "REJECTED" | "CANCELLED" | "REVERSED";

export async function getAdminWithdrawals(filter: WithdrawalFilter = "ALL", page = 1) {
  const LIMIT = 25;
  const where = filter === "ALL" ? {} : { status: filter as WithdrawalStatus };

  const [withdrawals, total, stats] = await Promise.all([
    db.withdrawal.findMany({
      where,
      take: LIMIT,
      skip: (page - 1) * LIMIT,
      orderBy: { requestedAt: "desc" },
      include: {
        vendor: {
          include: {
            user: { select: { name: true, email: true } },
            store: { select: { name: true } },
          },
        },
      },
    }),
    db.withdrawal.count({ where }),
    Promise.all([
      db.withdrawal.count({ where: { status: "REQUESTED" } }),
      db.withdrawal.count({ where: { status: "PROCESSING" } }),
      db.withdrawal.count({ where: { status: "PAID" } }),
      db.withdrawal.count({ where: { status: "REJECTED" } }),
      db.withdrawal.count({ where: { status: "CANCELLED" } }),
      db.withdrawal.aggregate({ _sum: { amount: true }, where: { status: "REQUESTED" } }),
      db.withdrawal.aggregate({ _sum: { amount: true }, where: { status: "PAID" } }),
    ]),
  ]);

  return {
    withdrawals: withdrawals.map((w) => ({ ...w, amount: Number(w.amount) })),
    total,
    pages: Math.ceil(total / LIMIT),
    stats: {
      requested: stats[0],
      processing: stats[1],
      paid: stats[2],
      rejected: stats[3],
      cancelled: stats[4],
      pendingAmount: Number(stats[5]._sum.amount ?? 0),
      paidAmount: Number(stats[6]._sum.amount ?? 0),
    },
  };
}

// ── Single vendor payout history (for admin vendor detail page) ───────────────

export async function getVendorPayoutHistoryAdmin(vendorId: string) {
  const [withdrawals, balance] = await Promise.all([
    db.withdrawal.findMany({
      where: { vendorId },
      orderBy: { requestedAt: "desc" },
    }),
    calcVendorBalance(vendorId),
  ]);
  return {
    withdrawals: withdrawals.map((w) => ({ ...w, amount: Number(w.amount) })),
    balance,
  };
}
