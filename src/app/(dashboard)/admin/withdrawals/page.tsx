import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth/config";
import { getAllVendorBalances, getAdminWithdrawals } from "@/lib/admin/withdrawal-data";
import { WithdrawalManager } from "@/components/admin/withdrawal-manager";

export default async function AdminWithdrawalsPage({
  searchParams,
}: {
  searchParams: { status?: string; page?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "SUPER_ADMIN") redirect("/login");

  const filter = (searchParams.status ?? "ALL") as any;
  const page = Number(searchParams.page ?? "1");

  const [vendors, { withdrawals, stats }] = await Promise.all([
    getAllVendorBalances(),
    getAdminWithdrawals(filter, page),
  ]);

  return (
    <WithdrawalManager
      vendors={vendors}
      withdrawals={withdrawals as any}
      stats={stats}
    />
  );
}
