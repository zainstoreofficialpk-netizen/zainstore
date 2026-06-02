import { Suspense } from "react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import type { VendorStatus } from "@prisma/client";

import { authOptions } from "@/lib/auth/config";
import { getVendorList } from "@/lib/admin/vendor-data";
import { VendorTable } from "@/components/vendors/vendor-table";

type SearchParams = {
  search?: string;
  status?: string;
  page?: string;
};

export default async function VendorsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "SUPER_ADMIN") redirect("/login");

  const status = searchParams.status as VendorStatus | "ALL" | undefined;
  const page = Number(searchParams.page ?? "1");
  const search = searchParams.search ?? "";

  const data = await getVendorList({ search, status: status ?? "ALL", page });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-zinc-950">Vendor Management</h2>
        <p className="mt-0.5 text-sm text-zinc-400">
          Approve, reject, suspend, communicate with, and manage all marketplace vendors.
        </p>
      </div>

      <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-zinc-100" />}>
        <VendorTable data={data} />
      </Suspense>
    </div>
  );
}
