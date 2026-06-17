import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth/config";
import { getProductsForApproval, getAdminProductStats } from "@/lib/admin/product-approval-data";
import { ProductApprovalTable } from "@/components/admin/product-approval-table";

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: { status?: string; search?: string; page?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "SUPER_ADMIN") redirect("/login");

  const [data, stats] = await Promise.all([
    getProductsForApproval({
      status: searchParams.status ?? "ALL",
      search: searchParams.search,
      page: Number(searchParams.page ?? "1"),
    }),
    getAdminProductStats(),
  ]);

  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-zinc-100" />}>
      <ProductApprovalTable data={data} stats={stats} />
    </Suspense>
  );
}
