import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import Link from "next/link";
import {
  Boxes, ShoppingCart, Star, WalletCards,
  ArrowUpRight, TrendingUp, Clock,
} from "lucide-react";

import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format";
import { getVendorBalance } from "@/lib/vendor/withdrawal-data";

export default async function VendorDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "VENDOR") redirect("/login");

  const vendor = await db.vendorProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  const [balance, productCount, orderCount, pendingWithdrawals] = await Promise.all([
    vendor ? getVendorBalance(vendor.id) : Promise.resolve({ available: 0, committed: 0, vendorEarnings: 0, totalCommission: 0, grossEarnings: 0, heldEarnings: 0, paidOut: 0, inProgress: 0 }),
    vendor ? db.product.count({ where: { vendorId: vendor.id } }) : Promise.resolve(0),
    vendor ? db.orderItem.count({ where: { vendorId: vendor.id } }) : Promise.resolve(0),
    vendor ? db.withdrawal.count({ where: { vendorId: vendor.id, status: { in: ["REQUESTED", "APPROVED", "PROCESSING"] } } }) : Promise.resolve(0),
  ]);

  return (
    <div className="space-y-6">
      {/* Balance + withdrawal CTA — top of page, always visible */}
      <div className="rounded-2xl border border-brand-200 bg-gradient-to-r from-brand-50 to-white p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-500">Available Balance</p>
            <p className="mt-0.5 text-4xl font-bold text-zinc-950">{formatCurrency(balance.available)}</p>
            <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-zinc-500">
              <span className="flex items-center gap-1">
                <TrendingUp size={12} className="text-emerald-500" />
                Net earnings: {formatCurrency(balance.vendorEarnings)}
              </span>
              {balance.heldEarnings > 0 && (
                <span className="flex items-center gap-1">
                  <Clock size={12} className="text-amber-400" />
                  Held (7-day): {formatCurrency(balance.heldEarnings)}
                </span>
              )}
              {balance.committed > 0 && (
                <span className="flex items-center gap-1">
                  <Clock size={12} className="text-amber-500" />
                  In progress: {formatCurrency(balance.committed)}
                </span>
              )}
            </div>
          </div>
          <div className="flex shrink-0 flex-col gap-2 sm:items-end">
            <Button asChild className="gap-2">
              <Link href="/vendor/withdrawals">
                <ArrowUpRight size={16} />
                Request Withdrawal
              </Link>
            </Button>
            {pendingWithdrawals > 0 && (
              <p className="text-xs text-amber-600">
                {pendingWithdrawals} request{pendingWithdrawals > 1 ? "s" : ""} pending review
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            title: "Gross Sales",
            value: formatCurrency(balance.grossEarnings),
            helper: "From delivered orders",
            icon: TrendingUp,
            color: "bg-emerald-50 text-emerald-600",
          },
          {
            title: "Products",
            value: productCount.toString(),
            helper: "Listed in your store",
            icon: Boxes,
            color: "bg-brand-50 text-brand-600",
          },
          {
            title: "Order Items",
            value: orderCount.toString(),
            helper: "Across all orders",
            icon: ShoppingCart,
            color: "bg-blue-50 text-blue-600",
          },
          {
            title: "Withdrawals",
            value: formatCurrency(balance.committed),
            helper: pendingWithdrawals > 0 ? `${pendingWithdrawals} pending` : "In progress",
            icon: WalletCards,
            color: "bg-amber-50 text-amber-600",
          },
        ].map((stat) => (
          <Card key={stat.title}>
            <CardContent className="flex items-start justify-between gap-3 pt-5">
              <div>
                <p className="text-sm text-zinc-500">{stat.title}</p>
                <p className="mt-1 text-2xl font-bold text-zinc-950">{stat.value}</p>
                <p className="mt-1 text-xs text-zinc-400">{stat.helper}</p>
              </div>
              <div className={`grid size-10 shrink-0 place-items-center rounded-lg ${stat.color}`}>
                <stat.icon size={18} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Balance breakdown */}
      <Card>
        <CardContent className="pt-5">
          <p className="mb-4 text-sm font-semibold text-zinc-800">Balance Breakdown</p>
          <div className="space-y-3">
            {[
              { label: "Gross sales (delivered + paid orders)", value: balance.grossEarnings, color: "bg-emerald-400" },
              { label: "Platform commission deducted", value: -balance.totalCommission, color: "bg-accent-400" },
              { label: "Already paid out to you", value: -balance.paidOut, color: "bg-blue-400" },
              { label: "Held (7-day protection period, unlocks automatically)", value: -balance.heldEarnings, color: "bg-amber-300" },
              { label: "Pending / processing requests", value: -balance.inProgress, color: "bg-amber-500" },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`h-2 w-2 shrink-0 rounded-full ${row.color}`} />
                  <span className="text-xs text-zinc-600 truncate">{row.label}</span>
                </div>
                <span className={`shrink-0 text-sm font-medium ${row.value < 0 ? "text-rose-600" : "text-zinc-900"}`}>
                  {row.value < 0 ? `−${formatCurrency(Math.abs(row.value))}` : formatCurrency(row.value)}
                </span>
              </div>
            ))}
            <div className="border-t border-zinc-200 pt-3 flex items-center justify-between">
              <span className="text-sm font-semibold text-zinc-800">Available for withdrawal</span>
              <span className="text-lg font-bold text-emerald-700">{formatCurrency(balance.available)}</span>
            </div>
          </div>
          <div className="mt-4">
            <Link
              href="/vendor/withdrawals"
              className="text-xs text-brand-600 hover:underline"
            >
              View full payout history & request withdrawal →
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
