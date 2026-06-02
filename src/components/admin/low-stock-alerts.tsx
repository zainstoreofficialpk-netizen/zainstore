import Link from "next/link";
import { AlertTriangle, ArrowRight } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { getLowStockProducts } from "@/lib/admin/dashboard-data";

type LowStockProducts = Awaited<ReturnType<typeof getLowStockProducts>>;

export function LowStockAlerts({ products }: { products: LowStockProducts }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-500" />
            <CardTitle>Low Stock Alerts</CardTitle>
          </div>
          <Link
            href="/admin/products?stock=low"
            className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-500"
          >
            View all <ArrowRight size={13} />
          </Link>
        </div>
        <p className="mt-0.5 text-xs text-zinc-400">Products at or below their low-stock threshold</p>
      </CardHeader>
      <CardContent className="p-0">
        {products.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-8 text-center">
            <span className="text-2xl">✅</span>
            <p className="text-sm text-zinc-400">All products have sufficient stock.</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-50">
            {products.map((product) => (
              <div key={product.id} className="flex items-center gap-4 px-6 py-3 hover:bg-zinc-50/60">
                {product.images?.[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={product.images[0].url}
                    alt={product.name}
                    className="size-9 rounded-md object-cover"
                  />
                ) : (
                  <div className="size-9 rounded-md bg-zinc-100" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-zinc-800">{product.name}</p>
                  <p className="text-xs text-zinc-400">{product.store?.name}</p>
                </div>
                <div className="text-right">
                  <Badge tone={product.stock === 0 ? "danger" : "warning"}>
                    {product.stock === 0 ? "Out of stock" : `${product.stock} left`}
                  </Badge>
                  <p className="mt-0.5 text-xs text-zinc-400">
                    Threshold: {product.lowStockThreshold}
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
