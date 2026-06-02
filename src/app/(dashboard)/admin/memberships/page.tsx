import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { Card, CardContent } from "@/components/ui/card";

export default async function AdminMembershipsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "SUPER_ADMIN") redirect("/login");

  return (
    <div className="space-y-6">
      <div><h2 className="text-lg font-bold text-zinc-950">Memberships</h2>
        <p className="mt-0.5 text-sm text-zinc-400">This marketplace operates on a commission-based model. Membership plans have been removed.</p></div>
      <Card><CardContent className="py-12 text-center">
        <p className="text-4xl mb-3">💰</p>
        <p className="font-semibold text-zinc-700">Commission-Based Model Active</p>
        <p className="mt-2 text-sm text-zinc-400">Manage commission rates from the <a href="/admin/commissions" className="text-brand-600 hover:underline">Commissions</a> page.</p>
      </CardContent></Card>
    </div>
  );
}
