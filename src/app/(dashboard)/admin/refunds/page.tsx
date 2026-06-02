import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency } from "@/lib/format";
import { approveRefund, rejectRefund } from "@/lib/admin/actions";

const TONE: Record<string, "success"|"warning"|"danger"|"muted"> = {
  REQUESTED: "warning", UNDER_REVIEW: "warning", APPROVED: "success", REJECTED: "danger", PROCESSED: "muted",
};

export default async function AdminRefundsPage({ searchParams }: { searchParams: { status?: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "SUPER_ADMIN") redirect("/login");

  const status = searchParams.status;
  const where = status ? { status: status as any } : {};

  const [refunds, counts] = await Promise.all([
    db.refundRequest.findMany({
      where, take: 30, orderBy: { createdAt: "desc" },
      include: {
        customer: { select: { name: true } },
        order: { select: { orderNumber: true } },
        vendor: { include: { store: { select: { name: true } } } },
      },
    }),
    Promise.all([
      db.refundRequest.count({ where: { status: "REQUESTED" } }),
      db.refundRequest.count({ where: { status: "APPROVED" } }),
      db.refundRequest.count({ where: { status: "REJECTED" } }),
      db.refundRequest.count(),
    ]),
  ]);

  return (
    <div className="space-y-6">
      <div><h2 className="text-lg font-bold text-zinc-950">Refund Requests</h2>
        <p className="mt-0.5 text-sm text-zinc-400">Review and process customer refund requests.</p></div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[["Pending", counts[0]], ["Approved", counts[1]], ["Rejected", counts[2]], ["Total", counts[3]]].map(([l, v]) => (
          <Card key={String(l)}><CardContent className="py-4 text-center">
            <p className="text-xl font-bold text-zinc-950">{Number(v)}</p>
            <p className="mt-0.5 text-xs text-zinc-500">{l}</p>
          </CardContent></Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {["ALL","REQUESTED","UNDER_REVIEW","APPROVED","REJECTED","PROCESSED"].map((s) => (
          <a key={s} href={s==="ALL"?"/admin/refunds":`/admin/refunds?status=${s}`}
            className={`rounded-full px-3 py-1 text-xs font-medium ${(s==="ALL"&&!status)||s===status?"bg-brand-500 text-white":"bg-zinc-100 text-zinc-600 hover:bg-zinc-200"}`}>
            {s==="ALL"?"All":s.replace("_"," ")}
          </a>
        ))}
      </div>

      <Card className="overflow-hidden">
        {refunds.length === 0
          ? <EmptyState icon="↩️" title="No refund requests" description="Refund requests will appear here when customers submit them." />
          : <div className="overflow-x-auto"><table className="w-full text-sm">
              <thead className="border-b border-zinc-100 bg-zinc-50/50"><tr>
                {["Order","Customer","Vendor","Amount","Reason","Status","Date"].map((h) =>
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-zinc-500">{h}</th>)}
              </tr></thead>
              <tbody className="divide-y divide-zinc-50">
                {refunds.map((r) => (
                  <tr key={r.id} className="hover:bg-zinc-50/60">
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-brand-600">{r.order.orderNumber}</td>
                    <td className="px-4 py-3 text-sm">{r.customer.name}</td>
                    <td className="px-4 py-3 text-xs text-zinc-500">{r.vendor?.store?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-sm font-medium">{formatCurrency(Number(r.amount))}</td>
                    <td className="px-4 py-3 text-xs text-zinc-600 max-w-[160px] truncate">{r.reason}</td>
                    <td className="px-4 py-3"><Badge tone={TONE[r.status]??'muted'}>{r.status.replace("_"," ")}</Badge></td>
                    <td className="px-4 py-3 text-xs text-zinc-400">{new Date(r.createdAt).toLocaleDateString("en-PK",{day:"numeric",month:"short"})}</td>
                  </tr>
                ))}
              </tbody>
            </table></div>}
      </Card>
    </div>
  );
}
