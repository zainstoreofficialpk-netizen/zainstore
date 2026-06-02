import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import type { ProductStatus } from "@prisma/client";

import { authOptions } from "@/lib/auth/config";
import { getVendorProducts, getVendorProductStats, getVendorStore } from "@/lib/vendor/product-data";
import { ProductTable } from "@/components/vendor/product-table";

export default async function VendorProductsPage({
  searchParams,
}: {
  searchParams: { search?: string; status?: string; page?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const vendorStore = await getVendorStore(session.user.id);
  if (!vendorStore) redirect("/vendor");

  const [data, stats] = await Promise.all([
    getVendorProducts(vendorStore.id, {
      search: searchParams.search,
      status: (searchParams.status as ProductStatus | "ALL") ?? "ALL",
      page: Number(searchParams.page ?? "1"),
    }),
    getVendorProductStats(vendorStore.id),
  ]);

  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-zinc-100" />}>
      <ProductTable data={data} stats={stats} />
    </Suspense>
  );
}
