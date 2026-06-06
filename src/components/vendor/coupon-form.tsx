"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Coupon } from "@prisma/client";

import { createCouponAction, updateCouponAction } from "@/lib/vendor/coupon-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  coupon?: Coupon;
};

export function CouponForm({ coupon }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const toDateInput = (d: Date | null | undefined) =>
    d ? new Date(d).toISOString().slice(0, 10) : "";

  const [form, setForm] = useState({
    code: coupon?.code ?? "",
    name: coupon?.name ?? "",
    type: (coupon?.type ?? "PERCENTAGE") as "PERCENTAGE" | "FIXED",
    value: coupon?.value?.toString() ?? "",
    startsAt: toDateInput(coupon?.startsAt),
    expiresAt: toDateInput(coupon?.expiresAt),
    usageLimit: coupon?.usageLimit?.toString() ?? "",
    minOrderAmount: coupon?.minOrderAmount?.toString() ?? "",
    active: coupon?.active ?? true,
  });

  function set(field: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const payload = { ...form, code: form.code.toUpperCase() };
      const result = coupon
        ? await updateCouponAction(coupon.id, payload as never)
        : await createCouponAction(payload as never);

      if (result.success) {
        toast.success(result.message);
        router.push("/vendor/coupons");
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Coupon Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-700">Coupon Code *</label>
              <Input
                value={form.code}
                onChange={(e) => set("code", e.target.value.toUpperCase())}
                placeholder="e.g. SAVE20"
                className="font-mono uppercase"
                required
                maxLength={32}
              />
              <p className="text-xs text-zinc-400">3–32 characters, automatically uppercased</p>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-700">Display Name *</label>
              <Input
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="e.g. Summer Sale 20% Off"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-700">Discount Type *</label>
              <select
                value={form.type}
                onChange={(e) => set("type", e.target.value)}
                className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              >
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FIXED">Fixed Amount (PKR)</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-700">
                Discount Value * {form.type === "PERCENTAGE" ? "(%)" : "(PKR)"}
              </label>
              <Input
                type="number"
                value={form.value}
                onChange={(e) => set("value", e.target.value)}
                placeholder={form.type === "PERCENTAGE" ? "e.g. 20" : "e.g. 500"}
                min="0.01"
                max={form.type === "PERCENTAGE" ? "100" : undefined}
                step="0.01"
                required
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Restrictions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-700">Minimum Order Amount (PKR)</label>
              <Input
                type="number"
                value={form.minOrderAmount}
                onChange={(e) => set("minOrderAmount", e.target.value)}
                placeholder="e.g. 1000 (leave blank for none)"
                min="0"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-700">Usage Limit</label>
              <Input
                type="number"
                value={form.usageLimit}
                onChange={(e) => set("usageLimit", e.target.value)}
                placeholder="e.g. 100 (leave blank for unlimited)"
                min="1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-700">Start Date</label>
              <Input
                type="date"
                value={form.startsAt}
                onChange={(e) => set("startsAt", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-700">Expiry Date</label>
              <Input
                type="date"
                value={form.expiresAt}
                onChange={(e) => set("expiresAt", e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-5">
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => set("active", e.target.checked)}
              className="size-4 rounded border-zinc-300 text-brand-500 accent-brand-500"
            />
            <span className="text-sm font-medium text-zinc-700">Active</span>
            <span className="text-xs text-zinc-400">Inactive coupons cannot be applied at checkout</span>
          </label>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving…" : coupon ? "Update Coupon" : "Create Coupon"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
