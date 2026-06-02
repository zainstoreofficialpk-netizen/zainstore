import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";

const TONE: Record<string, "success"|"warning"|"danger"|"muted"|"accent"> = {
  OPEN: "warning", PENDING_VENDOR: "accent", PENDING_CUSTOMER: "accent", RESOLVED: "success", CLOSED: "muted",
};

export default async function AdminSupportPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "SUPER_ADMIN") redirect("/login");

  const tickets = await db.supportTicket.findMany({
    orderBy: { createdAt: "desc" },
    take: 30,
    include: {
      user: { select: { name: true, role: true } },
      _count: { select: { messages: true } },
    },
  });

  const counts = await Promise.all([
    db.supportTicket.count({ where: { status: "OPEN" } }),
    db.supportTicket.count({ where: { status: "RESOLVED" } }),
    db.supportTicket.count(),
  ]);

  return (
    <div className="space-y-6">
      <div><h2 className="text-lg font-bold text-zinc-950">Support Tickets</h2>
        <p className="mt-0.5 text-sm text-zinc-400">{counts[0]} open · {counts[1]} resolved · {counts[2]} total</p></div>

      <Card className="overflow-hidden">
        {tickets.length === 0
          ? <EmptyState icon="🎫" title="No support tickets" description="Support tickets from vendors and customers will appear here." />
          : <div className="overflow-x-auto"><table className="w-full text-sm">
              <thead className="border-b border-zinc-100 bg-zinc-50/50"><tr>
                {["Ticket","Submitted by","Subject","Priority","Messages","Status","Date"].map((h) =>
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-zinc-500">{h}</th>)}
              </tr></thead>
              <tbody className="divide-y divide-zinc-50">
                {tickets.map((t) => (
                  <tr key={t.id} className="hover:bg-zinc-50/60">
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-brand-600">{t.id.slice(0,8).toUpperCase()}</td>
                    <td className="px-4 py-3"><p className="text-sm font-medium">{t.user.name}</p><p className="text-xs text-zinc-400">{t.user.role}</p></td>
                    <td className="px-4 py-3 text-sm max-w-[200px] truncate">{t.subject}</td>
                    <td className="px-4 py-3"><Badge tone={t.priority === "high" ? "danger" : t.priority === "normal" ? "warning" : "muted"}>{t.priority}</Badge></td>
                    <td className="px-4 py-3 text-xs text-zinc-500">{t._count.messages}</td>
                    <td className="px-4 py-3"><Badge tone={TONE[t.status]??'muted'}>{t.status.replace("_"," ")}</Badge></td>
                    <td className="px-4 py-3 text-xs text-zinc-400">{new Date(t.createdAt).toLocaleDateString("en-PK",{day:"numeric",month:"short"})}</td>
                  </tr>
                ))}
              </tbody>
            </table></div>}
      </Card>
    </div>
  );
}
