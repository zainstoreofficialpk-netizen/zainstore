import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency } from "@/lib/format";

const TONE: Record<string, "success"|"warning"|"danger"|"accent"|"muted"> = {
  PENDING: "warning", PROCESSING: "accent", SHIPPED: "accent", DELIVERED: "success", CANCELLED: "danger", REFUNDED: "muted",
};

export default async function VendorOrdersPage({ searchParams }: { searchParams: { status?: string; page?: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const vendor = await db.vendorProfile.findUnique({ where: { userId: session.user.id }, select: { id: true } });
  if (!vendor) redirect("/vendor");

  const status = searchParams.status;
  const page = Number(searchParams.page ?? "1");
  const LIMIT = 20;

  const where = { vendorId: vendor.id, ...(status ? { order: { status: status as any } } : {}) };
  const [items, total] = await Promise.all([
    db.orderItem.findMany({
      where, skip: (page - 1) * LIMIT, take: LIMIT, orderBy: { order: { createdAt: "desc" } },
      include: { order: { include: { customer: { select: { name: true } } } }, product: { select: { name: true } } },
      distinct: ["orderId"],
    }),
    db.orderItem.groupBy({ by: ["orderId"], where }).then((r) => r.length),
  ]);

  const counts = await Promise.all([
    db.orderItem.groupBy({ by: ["orderId"], where: { vendorId: vendor.id } }).then((r) => r.length),
    db.orderItem.groupBy({ by: ["orderId"], where: { vendorId: vendor.id, order: { status: "PENDING" } } }).then((r) => r.length),
    db.orderItem.aggregate({ _sum: { lineTotal: true }, where: { vendorId: vendor.id, order: { paymentStatus: "PAID" } } }),
  ]);

  return (
    <div className="space-y-6">
      <div><h2 className="text-lg font-bold text-zinc-950">My Orders</h2>
        <p className="mt-0.5 text-sm text-zinc-400">Orders placed with your store.</p></div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Orders", value: counts[0].toLocaleString() },
          { label: "Pending", value: counts[1].toLocaleString() },
          { label: "Revenue", value: formatCurrency(Number(counts[2]._sum.lineTotal ?? 0)) },
        ].map((s) => (
          <Card key={s.label}><CardContent className="py-4 text-center">
            <p className="text-xl font-bold text-zinc-950">{s.value}</p>
            <p className="mt-0.5 text-xs text-zinc-500">{s.label}</p>
          </CardContent></Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {["ALL","PENDING","PROCESSING","SHIPPED","DELIVERED","CANCELLED"].map((s) => (
          <a key={s} href={s==="ALL"?"/vendor/orders":`/vendor/orders?status=${s}`}
            className={`rounded-full px-3 py-1 text-xs font-medium ${(s==="ALL"&&!status)||s===status?"bg-brand-500 text-white":"bg-zinc-100 text-zinc-600 hover:bg-zinc-200"}`}>
            {s==="ALL"?"All":s.charAt(0)+s.slice(1).toLowerCase()}
          </a>
        ))}
      </div>

      <Card className="overflow-hidden">
        {items.length === 0
          ? <EmptyState icon="📦" title="No orders yet" description="Orders from customers will appear here once your products go live." />
          : <div className="overflow-x-auto"><table className="w-full text-sm">
              <thead className="border-b border-zinc-100 bg-zinc-50/50"><tr>
                {["Order #","Customer","Product","Amount","Status","Date"].map((h) =>
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-zinc-500">{h}</th>)}
              </tr></thead>
              <tbody className="divide-y divide-zinc-50">
                {items.map((item) => (
                  <tr key={item.orderId} className="hover:bg-zinc-50/60">
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-brand-600">{item.order.orderNumber}</td>
                    <td className="px-4 py-3 text-sm">{item.order.customer.name}</td>
                    <td className="px-4 py-3 text-xs text-zinc-600 max-w-[160px] truncate">{item.product.name}</td>
                    <td className="px-4 py-3 text-sm font-medium">{formatCurrency(Number(item.lineTotal))}</td>
                    <td className="px-4 py-3"><Badge tone={TONE[item.order.status]??'muted'}>{item.order.status}</Badge></td>
                    <td className="px-4 py-3 text-xs text-zinc-400">{new Date(item.order.createdAt).toLocaleDateString("en-PK",{day:"numeric",month:"short"})}</td>
                  </tr>
                ))}
              </tbody>
            </table></div>}
      </Card>
    </div>
  );
}
