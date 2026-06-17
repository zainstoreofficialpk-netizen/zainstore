import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { getVisitorStats } from "@/lib/admin/visitor-data";
import { VisitorStats } from "@/components/admin/visitor-stats";
import { Users } from "lucide-react";

export default async function AdminVisitorsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "SUPER_ADMIN") redirect("/login");

  const stats = await getVisitorStats();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
          <Users className="w-5 h-5 text-brand-500" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-zinc-950">Visitor Analytics</h2>
          <p className="text-sm text-zinc-400 mt-0.5">Real-time and historical visitor traffic across the platform</p>
        </div>
      </div>

      <VisitorStats stats={stats} />
    </div>
  );
}
