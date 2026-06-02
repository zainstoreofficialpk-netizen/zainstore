import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency } from "@/lib/format";

export default async function AdminCouponsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "SUPER_ADMIN") redirect("/login");

  const coupons = await db.coupon.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { usages: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-lg font-bold text-zinc-950">Coupons</h2>
          <p className="mt-0.5 text-sm text-zinc-400">{coupons.length} coupons in the system.</p></div>
      </div>

      <Card className="overflow-hidden">
        {coupons.length === 0
          ? <EmptyState icon="🎟️" title="No coupons yet" description="Create discount coupons for your marketplace customers." />
          : <div className="overflow-x-auto"><table className="w-full text-sm">
              <thead className="border-b border-zinc-100 bg-zinc-50/50"><tr>
                {["Code","Name","Type","Value","Used","Limit","Expires","Status"].map((h) =>
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-zinc-500">{h}</th>)}
              </tr></thead>
              <tbody className="divide-y divide-zinc-50">
                {coupons.map((c) => (
                  <tr key={c.id} className="hover:bg-zinc-50/60">
                    <td className="px-4 py-3 font-mono text-xs font-bold text-brand-600">{c.code}</td>
                    <td className="px-4 py-3 text-sm font-medium">{c.name}</td>
                    <td className="px-4 py-3 text-xs text-zinc-500">{c.type}</td>
                    <td className="px-4 py-3 text-sm">{c.type === "PERCENTAGE" ? `${c.value}%` : c.type === "FIXED" ? formatCurrency(Number(c.value)) : "Free shipping"}</td>
                    <td className="px-4 py-3 text-xs text-zinc-700">{c._count.usages}{c.usageLimit ? ` / ${c.usageLimit}` : ""}</td>
                    <td className="px-4 py-3 text-xs text-zinc-500">{c.usageLimit ?? "Unlimited"}</td>
                    <td className="px-4 py-3 text-xs text-zinc-400">{c.expiresAt ? new Date(c.expiresAt).toLocaleDateString("en-PK") : "No expiry"}</td>
                    <td className="px-4 py-3"><Badge tone={c.active ? "success" : "muted"}>{c.active ? "Active" : "Inactive"}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table></div>}
      </Card>
    </div>
  );
}
