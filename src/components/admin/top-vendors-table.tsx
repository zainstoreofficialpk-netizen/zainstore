import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { formatCurrency } from "@/lib/format";
import type { getTopVendors } from "@/lib/admin/dashboard-data";

type TopVendors = Awaited<ReturnType<typeof getTopVendors>>;

export function TopVendorsTable({ vendors }: { vendors: TopVendors }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Top Performing Vendors</CardTitle>
            <p className="mt-0.5 text-xs text-zinc-400">By total revenue generated</p>
          </div>
          <Link
            href="/admin/vendors"
            className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-500"
          >
            View all <ArrowRight size={13} />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {vendors.length === 0 ? (
          <p className="px-6 py-8 text-center text-sm text-zinc-400">No vendor sales data yet.</p>
        ) : (
          <div className="divide-y divide-zinc-50">
            {vendors.map((item, i) => (
              <div key={item.vendorId} className="flex items-center gap-4 px-6 py-3 hover:bg-zinc-50/60">
                <span className="w-5 shrink-0 text-center text-xs font-bold text-zinc-300">
                  #{i + 1}
                </span>
                <Avatar
                  name={item.vendor?.store?.name ?? item.vendor?.user?.name ?? "?"}
                  size="sm"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-zinc-800">
                    {item.vendor?.store?.name ?? "Unknown Store"}
                  </p>
                  <p className="text-xs text-zinc-400">
                    {item.vendor?._count?.products ?? 0} products · {item._count.id} orders
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-zinc-800">
                    {formatCurrency(Number(item._sum.lineTotal ?? 0))}
                  </p>
                  <p className="text-xs text-zinc-400">
                    Commission: {formatCurrency(Number(item._sum.commissionTotal ?? 0))}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
