import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/format";
import { EmptyState } from "@/components/ui/empty-state";

export default async function AdminFinancePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "SUPER_ADMIN") redirect("/login");

  const [revenue, commission, pendingWithdrawals, recentWithdrawals] = await Promise.all([
    db.order.aggregate({ _sum: { grandTotal: true }, where: { paymentStatus: "PAID" } }),
    db.orderItem.aggregate({ _sum: { commissionTotal: true } }),
    db.withdrawal.aggregate({ _sum: { amount: true }, where: { status: "REQUESTED" } }),
    db.withdrawal.findMany({ take: 15, orderBy: { requestedAt: "desc" },
      include: { vendor: { include: { store: { select: { name: true } } } } } }),
  ]);

  const totalRevenue = Number(revenue._sum.grandTotal ?? 0);
  const totalCommission = Number(commission._sum.commissionTotal ?? 0);
  const vendorEarnings = totalRevenue - totalCommission;

  return (
    <div className="space-y-8">
      <div><h2 className="text-lg font-bold text-zinc-950">Finance Overview</h2>
        <p className="mt-0.5 text-sm text-zinc-400">Real-time financial summary from the marketplace.</p></div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Gross Revenue", value: formatCurrency(totalRevenue), sub: "Total paid orders" },
          { label: "Platform Earnings", value: formatCurrency(totalCommission), sub: "Commission collected" },
          { label: "Vendor Earnings", value: formatCurrency(vendorEarnings), sub: "After platform commission" },
          { label: "Pending Payouts", value: formatCurrency(Number(pendingWithdrawals._sum.amount ?? 0)), sub: "Withdrawal requests" },
        ].map((s) => (
          <Card key={s.label}><CardContent className="pt-5">
            <p className="text-sm text-zinc-500">{s.label}</p>
            <p className="mt-1 text-2xl font-bold text-zinc-950">{s.value}</p>
            <p className="mt-1 text-xs text-zinc-400">{s.sub}</p>
          </CardContent></Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle>Recent Withdrawals</CardTitle></CardHeader>
        <CardContent className="p-0">
          {recentWithdrawals.length === 0
            ? <EmptyState icon="💳" title="No withdrawals yet" description="Vendor withdrawal history will appear here." />
            : <div className="overflow-x-auto"><table className="w-full text-sm">
                <thead className="border-b border-zinc-100 bg-zinc-50/50"><tr>
                  {["Vendor","Amount","Method","Status","Date"].map((h) =>
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-zinc-500">{h}</th>)}
                </tr></thead>
                <tbody className="divide-y divide-zinc-50">
                  {recentWithdrawals.map((w) => (
                    <tr key={w.id} className="hover:bg-zinc-50/60">
                      <td className="px-4 py-3 text-sm font-medium">{w.vendor?.store?.name ?? "—"}</td>
                      <td className="px-4 py-3 text-sm font-semibold">{formatCurrency(Number(w.amount))}</td>
                      <td className="px-4 py-3 text-xs text-zinc-500">{w.method.replace("_"," ")}</td>
                      <td className="px-4 py-3"><Badge tone={w.status==="PAID"?"success":w.status==="REQUESTED"?"warning":w.status==="REJECTED"?"danger":"muted"}>{w.status}</Badge></td>
                      <td className="px-4 py-3 text-xs text-zinc-400">{new Date(w.requestedAt).toLocaleDateString("en-PK",{day:"numeric",month:"short",year:"numeric"})}</td>
                    </tr>
                  ))}
                </tbody>
              </table></div>}
        </CardContent>
      </Card>
    </div>
  );
}
