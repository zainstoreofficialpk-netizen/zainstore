"use client";

import { useTransition, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Pencil, Trash2, ToggleLeft, ToggleRight, Plus, TicketPercent } from "lucide-react";
import type { Coupon } from "@prisma/client";

import { deleteCouponAction, toggleCouponStatusAction } from "@/lib/vendor/coupon-actions";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

type CouponWithCount = Coupon & { _count: { usages: number } };

type Props = {
  coupons: CouponWithCount[];
  stats: { total: number; active: number; expired: number };
  storeName: string;
};

function formatValue(coupon: Coupon) {
  if (coupon.type === "PERCENTAGE") return `${coupon.value}%`;
  return formatCurrency(Number(coupon.value));
}

function isExpired(coupon: Coupon) {
  return coupon.expiresAt ? new Date(coupon.expiresAt) < new Date() : false;
}

export function CouponTable({ coupons, stats, storeName }: Props) {
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function handleToggle(id: string) {
    startTransition(async () => {
      const result = await toggleCouponStatusAction(id);
      if (result.success) toast.success(result.message);
      else toast.error(result.error);
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this coupon? This cannot be undone.")) return;
    setDeletingId(id);
    startTransition(async () => {
      const result = await deleteCouponAction(id);
      if (result.success) toast.success(result.message);
      else toast.error(result.error);
      setDeletingId(null);
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-zinc-950">My Coupons</h2>
          <p className="mt-0.5 text-sm text-zinc-400">
            {stats.total} total · {stats.active} active · {stats.expired} expired
          </p>
        </div>
        <Button asChild>
          <Link href="/vendor/coupons/new">
            <Plus className="size-4" />
            New Coupon
          </Link>
        </Button>
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        {coupons.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <TicketPercent className="size-10 text-zinc-300" />
            <p className="text-sm font-medium text-zinc-500">No coupons yet</p>
            <p className="text-xs text-zinc-400">Create your first coupon to offer discounts on your products.</p>
            <Button asChild size="sm" className="mt-1">
              <Link href="/vendor/coupons/new">Create Coupon</Link>
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-zinc-100 bg-zinc-50/50">
                <tr>
                  {["Code", "Name", "Discount", "Created By", "Used / Limit", "Min Order", "Expiry", "Status", "Actions"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-zinc-500">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {coupons.map((c) => {
                  const expired = isExpired(c);
                  return (
                    <tr key={c.id} className="hover:bg-zinc-50/60">
                      <td className="px-4 py-3 font-mono text-xs font-bold text-brand-600">{c.code}</td>
                      <td className="px-4 py-3 text-sm font-medium text-zinc-800">{c.name}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className="inline-flex items-center gap-1">
                          <span>{formatValue(c)}</span>
                          <span className="text-xs text-zinc-400">{c.type === "PERCENTAGE" ? "off" : "flat"}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs font-medium text-zinc-800">{storeName}</p>
                        <p className="text-[10px] text-zinc-400">Your store · vendor coupon</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-zinc-600">
                        {c._count.usages}
                        {c.usageLimit ? ` / ${c.usageLimit}` : " / ∞"}
                      </td>
                      <td className="px-4 py-3 text-xs text-zinc-500">
                        {c.minOrderAmount ? formatCurrency(Number(c.minOrderAmount)) : "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-zinc-400">
                        {c.expiresAt ? (
                          <span className={expired ? "text-rose-500" : ""}>
                            {new Date(c.expiresAt).toLocaleDateString("en-PK")}
                            {expired && " (Expired)"}
                          </span>
                        ) : (
                          "No expiry"
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={c.active && !expired ? "success" : "muted"}>
                          {expired ? "Expired" : c.active ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleToggle(c.id)}
                            disabled={isPending}
                            title={c.active ? "Deactivate" : "Activate"}
                            className="rounded p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 disabled:opacity-40"
                          >
                            {c.active ? <ToggleRight className="size-4 text-brand-500" /> : <ToggleLeft className="size-4" />}
                          </button>
                          <Link
                            href={`/vendor/coupons/${c.id}/edit`}
                            className="rounded p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
                          >
                            <Pencil className="size-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(c.id)}
                            disabled={isPending && deletingId === c.id}
                            className="rounded p-1.5 text-zinc-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
