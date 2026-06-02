import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { OrderStatus } from "@prisma/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency } from "@/lib/format";

const ORDER_TONE: Record<string, "success"|"warning"|"danger"|"accent"|"muted"> = {
  PENDING: "warning", PROCESSING: "accent", SHIPPED: "accent",
  DELIVERED: "success", CANCELLED: "danger", REFUNDED: "muted",
};
const PAY_TONE: Record<string, "success"|"warning"|"danger"|"muted"> = {
  PAID: "success", PENDING: "warning", FAILED: "danger", REFUNDED: "muted", AUTHORIZED: "warning",
};

export default async function AdminOrdersPage({ searchParams }: { searchParams: { status?: string; page?: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "SUPER_ADMIN") redirect("/login");

  const status = searchParams.status as OrderStatus | undefined;
  const page = Number(searchParams.page ?? "1");
  const LIMIT = 20;
  const where = status ? { status } : {};

  const [orders, total, aggStats] = await Promise.all([
    db.order.findMany({
      where, skip: (page - 1) * LIMIT, take: LIMIT, orderBy: { createdAt: "desc" },
      include: {
        customer: { select: { name: true, email: true } },
        items: { take: 1, include: { vendor: { include: { store: { select: { name: true } } } } } },
      },
    }),
    db.order.count({ where }),
    db.order.aggregate({ _sum: { grandTotal: true }, where: { paymentStatus: "PAID" } }),
  ]);

  const [totalOrders, pending, processing] = await Promise.all([
    db.order.count(), db.order.count({ where: { status: "PENDING" } }), db.order.count({ where: { status: "PROCESSING" } }),
  ]);

  const statCards = [
    { label: "Total Orders", value: totalOrders.toLocaleString() },
    { label: "Pending", value: pending.toLocaleString() },
    { label: "Processing", value: processing.toLocaleString() },
    { label: "Paid Revenue", value: formatCurrency(Number(aggStats._sum.grandTotal ?? 0)) },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-zinc-950">Orders</h2>
        <p className="mt-0.5 text-sm text-zinc-400">All marketplace orders across all vendors.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {statCards.map((s) => (
          <Card key={s.label}><CardContent className="py-4 text-center">
            <p className="text-xl font-bold text-zinc-950">{s.value}</p>
            <p className="mt-0.5 text-xs text-zinc-500">{s.label}</p>
          </CardContent></Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {["ALL","PENDING","PROCESSING","SHIPPED","DELIVERED","CANCELLED","REFUNDED"].map((s) => (
          <a key={s} href={s === "ALL" ? "/admin/orders" : `/admin/orders?status=${s}`}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${(s === "ALL" && !status) || s === status ? "bg-brand-500 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"}`}>
            {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
          </a>
        ))}
      </div>

      <Card className="overflow-hidden">
        {orders.length === 0
          ? <EmptyState icon="🛒" title="No orders found" description="Orders will appear here once customers start placing them." />
          : <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-zinc-100 bg-zinc-50/50">
                  <tr>{["Order #","Customer","Vendor","Total","Payment","Status","Date"].map((h) =>
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-zinc-500">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-zinc-50/60">
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-brand-600">{order.orderNumber}</td>
                      <td className="px-4 py-3"><p className="text-sm font-medium">{order.customer.name}</p><p className="text-xs text-zinc-400">{order.customer.email}</p></td>
                      <td className="px-4 py-3 text-xs text-zinc-500">{order.items[0]?.vendor?.store?.name ?? "—"}</td>
                      <td className="px-4 py-3 text-sm font-medium">{formatCurrency(Number(order.grandTotal))}</td>
                      <td className="px-4 py-3"><Badge tone={PAY_TONE[order.paymentStatus] ?? "muted"}>{order.paymentStatus}</Badge></td>
                      <td className="px-4 py-3"><Badge tone={ORDER_TONE[order.status] ?? "muted"}>{order.status}</Badge></td>
                      <td className="px-4 py-3 text-xs text-zinc-400">{new Date(order.createdAt).toLocaleDateString("en-PK",{day:"numeric",month:"short",year:"numeric"})}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>}
      </Card>

      {total > LIMIT && (
        <div className="flex items-center justify-between text-xs text-zinc-500">
          <span>Page {page} of {Math.ceil(total/LIMIT)} · {total} orders</span>
          <div className="flex gap-2">
            {page > 1 && <a href={`/admin/orders?page=${page-1}${status?`&status=${status}`:""}`} className="rounded border border-zinc-200 px-3 py-1 hover:bg-zinc-50">← Prev</a>}
            {page < Math.ceil(total/LIMIT) && <a href={`/admin/orders?page=${page+1}${status?`&status=${status}`:""}`} className="rounded border border-zinc-200 px-3 py-1 hover:bg-zinc-50">Next →</a>}
          </div>
        </div>
      )}
    </div>
  );
}
