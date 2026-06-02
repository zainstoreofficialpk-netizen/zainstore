import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency } from "@/lib/format";

const TONE: Record<string, "success"|"warning"|"danger"|"muted"|"accent"> = {
  REQUESTED: "warning", APPROVED: "accent", REJECTED: "danger",
  PROCESSING: "accent", PAID: "success", REVERSED: "muted",
};

export default async function AdminWithdrawalsPage({ searchParams }: { searchParams: { status?: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "SUPER_ADMIN") redirect("/login");

  const status = searchParams.status;
  const where = status ? { status: status as any } : {};

  const [withdrawals, counts] = await Promise.all([
    db.withdrawal.findMany({
      where, take: 30, orderBy: { requestedAt: "desc" },
      include: {
        vendor: { include: { user: { select: { name: true } }, store: { select: { name: true } } } },
      },
    }),
    Promise.all([
      db.withdrawal.count({ where: { status: "REQUESTED" } }),
      db.withdrawal.count({ where: { status: "PAID" } }),
      db.withdrawal.count({ where: { status: "REJECTED" } }),
      db.withdrawal.aggregate({ _sum: { amount: true }, where: { status: "REQUESTED" } }),
    ]),
  ]);

  return (
    <div className="space-y-6">
      <div><h2 className="text-lg font-bold text-zinc-950">Withdrawal Requests</h2>
        <p className="mt-0.5 text-sm text-zinc-400">Manage vendor payout requests.</p></div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Pending", value: counts[0].toLocaleString() },
          { label: "Paid", value: counts[1].toLocaleString() },
          { label: "Rejected", value: counts[2].toLocaleString() },
          { label: "Pending Amount", value: formatCurrency(Number(counts[3]._sum.amount ?? 0)) },
        ].map((s) => (
          <Card key={s.label}><CardContent className="py-4 text-center">
            <p className="text-xl font-bold text-zinc-950">{s.value}</p>
            <p className="mt-0.5 text-xs text-zinc-500">{s.label}</p>
          </CardContent></Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {["ALL","REQUESTED","APPROVED","PROCESSING","PAID","REJECTED","REVERSED"].map((s) => (
          <a key={s} href={s==="ALL"?"/admin/withdrawals":`/admin/withdrawals?status=${s}`}
            className={`rounded-full px-3 py-1 text-xs font-medium ${(s==="ALL"&&!status)||s===status?"bg-brand-500 text-white":"bg-zinc-100 text-zinc-600 hover:bg-zinc-200"}`}>
            {s==="ALL"?"All":s.charAt(0)+s.slice(1).toLowerCase()}
          </a>
        ))}
      </div>

      <Card className="overflow-hidden">
        {withdrawals.length === 0
          ? <EmptyState icon="💸" title="No withdrawal requests" description="Vendor withdrawal requests will appear here." />
          : <div className="overflow-x-auto"><table className="w-full text-sm">
              <thead className="border-b border-zinc-100 bg-zinc-50/50"><tr>
                {["Vendor","Store","Amount","Method","Status","Requested","Reference"].map((h) =>
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-zinc-500">{h}</th>)}
              </tr></thead>
              <tbody className="divide-y divide-zinc-50">
                {withdrawals.map((w) => (
                  <tr key={w.id} className="hover:bg-zinc-50/60">
                    <td className="px-4 py-3 text-sm font-medium">{w.vendor?.user?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-xs text-zinc-500">{w.vendor?.store?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-zinc-900">{formatCurrency(Number(w.amount))}</td>
                    <td className="px-4 py-3 text-xs text-zinc-500">{w.method.replace("_"," ")}</td>
                    <td className="px-4 py-3"><Badge tone={TONE[w.status]??'muted'}>{w.status}</Badge></td>
                    <td className="px-4 py-3 text-xs text-zinc-400">{new Date(w.requestedAt).toLocaleDateString("en-PK",{day:"numeric",month:"short",year:"numeric"})}</td>
                    <td className="px-4 py-3 text-xs text-zinc-400 font-mono">{w.reference ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table></div>}
      </Card>
    </div>
  );
}
