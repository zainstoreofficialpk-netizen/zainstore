import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { getVendorBalance, getVendorEarningsBreakdown } from "@/lib/vendor/withdrawal-data";
import { formatCurrency } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, DollarSign, Clock, CheckCircle2, ArrowRight, Lock } from "lucide-react";
import Link from "next/link";

export default async function VendorEarningsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "VENDOR") redirect("/login");

  const vendor = await db.vendorProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true, commissionType: true, commissionValue: true },
  });
  if (!vendor) redirect("/vendor");

  const [balance, breakdown] = await Promise.all([
    getVendorBalance(vendor.id),
    getVendorEarningsBreakdown(vendor.id, 30),
  ]);

  const commissionRate = vendor.commissionValue ? Number(vendor.commissionValue) : 10;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-zinc-950">Earnings</h2>
        <p className="text-sm text-zinc-400 mt-0.5">Revenue from delivered orders after platform commission</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Earned", value: balance.vendorEarnings, icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Available", value: balance.available, icon: DollarSign, color: "text-brand-600", bg: "bg-brand-50" },
          { label: "On Hold", value: balance.heldEarnings, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Paid Out", value: balance.paidOut, icon: CheckCircle2, color: "text-zinc-600", bg: "bg-zinc-100" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <div>
                <p className="text-xs text-zinc-500">{label}</p>
                <p className="text-base font-black text-zinc-900">{formatCurrency(value)}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Info + Withdraw CTA */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardContent className="p-4 space-y-3">
            <p className="text-sm font-semibold text-zinc-800">Earnings Breakdown</p>
            {[
              { label: "Gross Revenue", value: balance.grossEarnings },
              { label: `Platform Commission (${commissionRate}%)`, value: -balance.totalCommission, neg: true },
              { label: "Your Net Earnings", value: balance.vendorEarnings, bold: true },
              { label: "Held (pending clearance)", value: -balance.heldEarnings, neg: true },
              { label: "Already Paid Out", value: -balance.paidOut, neg: true },
              { label: "Available to Withdraw", value: balance.available, bold: true, highlight: true },
            ].map(({ label, value, neg, bold, highlight }) => (
              <div key={label} className={`flex justify-between text-sm ${bold ? "font-bold border-t border-zinc-100 pt-2 mt-1" : ""}`}>
                <span className={highlight ? "text-brand-700" : "text-zinc-600"}>{label}</span>
                <span className={highlight ? "text-brand-700" : neg ? "text-rose-500" : "text-zinc-900"}>
                  {neg && value !== 0 ? "-" : ""}{formatCurrency(Math.abs(value))}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-4">
            <p className="text-sm font-semibold text-zinc-800">Withdraw Your Earnings</p>
            <div className="text-center py-4">
              <p className="text-3xl font-black text-brand-600">{formatCurrency(balance.available)}</p>
              <p className="text-xs text-zinc-400 mt-1">Available to withdraw</p>
            </div>
            {balance.heldEarnings > 0 && (
              <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                <Lock className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{formatCurrency(balance.heldEarnings)} is held for 7 days after delivery for dispute protection.</span>
              </div>
            )}
            <Link href="/vendor/withdrawals" className="flex items-center justify-center gap-2 w-full py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-sm font-bold rounded-xl">
              Request Withdrawal <ArrowRight className="w-4 h-4" />
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Earnings ledger */}
      <Card>
        <CardHeader>
          <CardTitle>Earnings Ledger</CardTitle>
          <p className="text-xs text-zinc-400 mt-0.5">Recent delivered orders that generated earnings</p>
        </CardHeader>
        <CardContent className="p-0">
          {breakdown.length === 0 ? (
            <div className="py-16 text-center">
              <TrendingUp className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
              <p className="text-sm text-zinc-400">No earnings yet — earnings appear after orders are delivered.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-zinc-50 border-b border-zinc-100">
                  <tr>
                    {["Order", "Product", "Delivered", "Revenue", "Commission", "Your Earning", "Status"].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  {breakdown.map((row, i) => (
                    <tr key={i} className="hover:bg-zinc-50/50">
                      <td className="px-4 py-3 font-mono text-xs text-zinc-600">{row.orderNumber}</td>
                      <td className="px-4 py-3 text-zinc-800 max-w-[180px] truncate">{row.productName}</td>
                      <td className="px-4 py-3 text-zinc-500 whitespace-nowrap text-xs">
                        {new Date(row.deliveredAt).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-4 py-3 text-zinc-800">{formatCurrency(row.lineTotal)}</td>
                      <td className="px-4 py-3 text-rose-500">-{formatCurrency(row.commissionTotal)}</td>
                      <td className="px-4 py-3 font-semibold text-emerald-700">{formatCurrency(row.vendorEarning)}</td>
                      <td className="px-4 py-3">
                        {row.isHeld
                          ? <Badge tone="warning">Held · unlocks {new Date(row.unlockDate).toLocaleDateString("en-PK", { day: "numeric", month: "short" })}</Badge>
                          : <Badge tone="success">Available</Badge>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
