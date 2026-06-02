import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";

export default async function AdminCustomersPage({ searchParams }: { searchParams: { search?: string; page?: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "SUPER_ADMIN") redirect("/login");

  const search = searchParams.search ?? "";
  const page = Number(searchParams.page ?? "1");
  const LIMIT = 25;

  const where = {
    role: "CUSTOMER" as const,
    ...(search.trim() ? { OR: [
      { name: { contains: search, mode: "insensitive" as const } },
      { email: { contains: search, mode: "insensitive" as const } },
    ]} : {}),
  };

  const [customers, total] = await Promise.all([
    db.user.findMany({
      where, skip: (page - 1) * LIMIT, take: LIMIT, orderBy: { createdAt: "desc" },
      include: { _count: { select: { orders: true } } },
    }),
    db.user.count({ where }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-lg font-bold text-zinc-950">Customers</h2>
          <p className="mt-0.5 text-sm text-zinc-400">{total.toLocaleString()} registered customers</p></div>
        <form method="get" className="flex gap-2">
          <input name="search" defaultValue={search} placeholder="Search name or email…"
            className="h-9 w-56 rounded-md border border-zinc-200 px-3 text-sm focus:border-brand-400 focus:outline-none" />
          <button type="submit" className="h-9 rounded-md border border-zinc-200 bg-white px-3 text-sm hover:bg-zinc-50">Search</button>
          {search && <a href="/admin/customers" className="flex h-9 items-center px-2 text-xs text-zinc-400 hover:text-zinc-600">Clear</a>}
        </form>
      </div>

      <Card className="overflow-hidden">
        {customers.length === 0
          ? <EmptyState icon="👤" title="No customers found" description="Customer accounts will appear here after registration." />
          : <div className="overflow-x-auto"><table className="w-full text-sm">
              <thead className="border-b border-zinc-100 bg-zinc-50/50"><tr>
                {["Customer","Email","Phone","Orders","Status","Joined"].map((h) =>
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-zinc-500">{h}</th>)}
              </tr></thead>
              <tbody className="divide-y divide-zinc-50">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-zinc-50/60">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={c.name} image={c.image} size="sm" />
                        <span className="font-medium text-zinc-800">{c.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-500">{c.email}</td>
                    <td className="px-4 py-3 text-xs text-zinc-500">{c.phone ?? "—"}</td>
                    <td className="px-4 py-3 text-xs font-medium text-zinc-700">{c._count.orders}</td>
                    <td className="px-4 py-3">
                      <Badge tone={c.status === "ACTIVE" ? "success" : c.status === "SUSPENDED" ? "muted" : "warning"}>
                        {c.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-400">{new Date(c.createdAt).toLocaleDateString("en-PK",{day:"numeric",month:"short",year:"numeric"})}</td>
                  </tr>
                ))}
              </tbody>
            </table></div>}
      </Card>

      {total > LIMIT && (
        <div className="flex items-center justify-between text-xs text-zinc-500">
          <span>Page {page} of {Math.ceil(total/LIMIT)} · {total} customers</span>
          <div className="flex gap-2">
            {page > 1 && <a href={`/admin/customers?page=${page-1}${search?`&search=${search}`:""}`} className="rounded border border-zinc-200 px-3 py-1 hover:bg-zinc-50">← Prev</a>}
            {page < Math.ceil(total/LIMIT) && <a href={`/admin/customers?page=${page+1}${search?`&search=${search}`:""}`} className="rounded border border-zinc-200 px-3 py-1 hover:bg-zinc-50">Next →</a>}
          </div>
        </div>
      )}
    </div>
  );
}
