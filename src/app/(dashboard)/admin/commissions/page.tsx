import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth/config";
import { getGlobalCommissionRate, getCommissionStats, getVendorCommissionBreakdown } from "@/lib/admin/commission-data";
import { CommissionDashboard } from "@/components/admin/commission-dashboard";

export default async function CommissionsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "SUPER_ADMIN") redirect("/login");

  const [globalRate, stats, vendorBreakdown] = await Promise.all([
    getGlobalCommissionRate(),
    getCommissionStats(),
    getVendorCommissionBreakdown(),
  ]);

  return (
    <CommissionDashboard
      globalRate={globalRate}
      stats={stats}
      vendorBreakdown={vendorBreakdown}
    />
  );
}
