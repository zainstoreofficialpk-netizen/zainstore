import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import type { getTopSellingProducts } from "@/lib/admin/dashboard-data";

type TopProducts = Awaited<ReturnType<typeof getTopSellingProducts>>;

export function TopProductsTable({ products }: { products: TopProducts }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Top Selling Products</CardTitle>
            <p className="mt-0.5 text-xs text-zinc-400">By revenue across all orders</p>
          </div>
          <Link
            href="/admin/products"
            className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-500"
          >
            View all <ArrowRight size={13} />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {products.length === 0 ? (
          <p className="px-6 py-8 text-center text-sm text-zinc-400">No sales data yet.</p>
        ) : (
          <div className="divide-y divide-zinc-50">
            {products.map((item, i) => (
              <div key={item.productId} className="flex items-center gap-4 px-6 py-3 hover:bg-zinc-50/60">
                <span className="w-5 shrink-0 text-center text-xs font-bold text-zinc-300">
                  #{i + 1}
                </span>
                {item.product?.images?.[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.product.images[0].url}
                    alt={item.product.name}
                    className="size-9 rounded-md object-cover"
                  />
                ) : (
                  <div className="size-9 rounded-md bg-zinc-100" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-zinc-800">
                    {item.product?.name ?? "Unknown Product"}
                  </p>
                  <p className="text-xs text-zinc-400">{item.product?.store?.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-zinc-800">
                    {formatCurrency(Number(item._sum.lineTotal ?? 0))}
                  </p>
                  <p className="text-xs text-zinc-400">{item._sum.quantity ?? 0} sold</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
