"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Plus, Pencil, Trash2, ToggleLeft, ToggleRight, X, TicketPercent,
} from "lucide-react";
import type { Coupon } from "@prisma/client";

import {
  adminCreateCouponAction,
  adminUpdateCouponAction,
  adminDeleteCouponAction,
  adminToggleCouponAction,
  type AdminCouponFormData,
} from "@/lib/admin/coupon-actions";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type CouponWithCount = Coupon & { _count: { usages: number }; vendor: { store: { name: string } | null } | null };

// ── Inline form (used in both create & edit modal) ────────────────────────────

const EMPTY: AdminCouponFormData = {
  code: "", name: "", type: "PERCENTAGE", value: 0,
  startsAt: "", expiresAt: "", usageLimit: "", minOrderAmount: "", active: true,
};

function toDateStr(d: Date | null | undefined) {
  return d ? new Date(d).toISOString().slice(0, 10) : "";
}

function CouponFormFields({
  form,
  set,
}: {
  form: AdminCouponFormData;
  set: (k: keyof AdminCouponFormData, v: string | boolean | number) => void;
}) {
  const inputCls =
    "w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-zinc-700">Code *</label>
          <Input
            value={form.code as string}
            onChange={(e) => set("code", e.target.value.toUpperCase())}
            placeholder="e.g. SAVE20"
            className="font-mono uppercase"
            required maxLength={32}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-zinc-700">Display Name *</label>
          <Input
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="e.g. Summer Sale"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-zinc-700">Type *</label>
          <select
            value={form.type}
            onChange={(e) => set("type", e.target.value)}
            className={inputCls}
          >
            <option value="PERCENTAGE">Percentage (%)</option>
            <option value="FIXED">Fixed Amount (PKR)</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-zinc-700">
            Value * {form.type === "PERCENTAGE" ? "(%)" : "(PKR)"}
          </label>
          <Input
            type="number" min="0.01"
            max={form.type === "PERCENTAGE" ? "100" : undefined}
            step="0.01"
            value={form.value as number}
            onChange={(e) => set("value", e.target.value)}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-zinc-700">Min Order (PKR)</label>
          <Input
            type="number" min="0"
            value={form.minOrderAmount as string}
            onChange={(e) => set("minOrderAmount", e.target.value)}
            placeholder="No minimum"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-zinc-700">Usage Limit</label>
          <Input
            type="number" min="1"
            value={form.usageLimit as string}
            onChange={(e) => set("usageLimit", e.target.value)}
            placeholder="Unlimited"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-zinc-700">Start Date</label>
          <Input type="date" value={form.startsAt as string} onChange={(e) => set("startsAt", e.target.value)} />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-zinc-700">Expiry Date</label>
          <Input type="date" value={form.expiresAt as string} onChange={(e) => set("expiresAt", e.target.value)} />
        </div>
      </div>

      <label className="flex cursor-pointer items-center gap-2">
        <input
          type="checkbox" checked={form.active as boolean}
          onChange={(e) => set("active", e.target.checked)}
          className="size-4 rounded border-zinc-300 accent-brand-500"
        />
        <span className="text-sm font-medium text-zinc-700">Active</span>
        <span className="text-xs text-zinc-400">Inactive coupons can&apos;t be applied at checkout</span>
      </label>
    </div>
  );
}

// ── Create / Edit modal ───────────────────────────────────────────────────────

function CouponModal({
  coupon,
  onClose,
}: {
  coupon?: CouponWithCount;
  onClose: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState<AdminCouponFormData>(
    coupon
      ? ({
          code: coupon.code,
          name: coupon.name,
          type: coupon.type as "PERCENTAGE" | "FIXED",
          value: Number(coupon.value),
          startsAt: toDateStr(coupon.startsAt),
          expiresAt: toDateStr(coupon.expiresAt),
          usageLimit: coupon.usageLimit?.toString() ?? "",
          minOrderAmount: coupon.minOrderAmount?.toString() ?? "",
          active: coupon.active,
        } as unknown as AdminCouponFormData)
      : { ...EMPTY },
  );

  function set(k: keyof AdminCouponFormData, v: string | boolean | number) {
    setForm((prev) => ({ ...prev, [k]: v }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = coupon
        ? await adminUpdateCouponAction(coupon.id, form)
        : await adminCreateCouponAction(form);
      if (result.success) { toast.success(result.message); onClose(); }
      else toast.error(result.error);
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4 sticky top-0 bg-white z-10">
          <h3 className="font-semibold text-zinc-900">
            {coupon ? "Edit Coupon" : "New Platform Coupon"}
          </h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {!coupon && (
            <p className="text-xs text-zinc-500 bg-brand-50 border border-brand-100 rounded-lg px-3 py-2">
              Platform coupons apply to all vendors and are not tied to a specific store.
            </p>
          )}
          <CouponFormFields form={form} set={set} />
          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={isPending} className="flex-1">
              {isPending ? "Saving…" : coupon ? "Update Coupon" : "Create Coupon"}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Delete confirm modal ──────────────────────────────────────────────────────

function DeleteModal({ coupon, onClose }: { coupon: CouponWithCount; onClose: () => void }) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      const result = await adminDeleteCouponAction(coupon.id);
      if (result.success) { toast.success(result.message); onClose(); }
      else toast.error(result.error);
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
          <h3 className="font-semibold text-zinc-900">Delete Coupon</h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600"><X size={18} /></button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-zinc-600">
            Delete coupon <span className="font-mono font-bold text-brand-600">{coupon.code}</span>?
            {coupon._count.usages > 0 && (
              <span className="block mt-1 text-amber-600 text-xs">
                This coupon has been used {coupon._count.usages} time{coupon._count.usages !== 1 ? "s" : ""}.
              </span>
            )}
            This action cannot be undone.
          </p>
          <div className="flex gap-2">
            <Button
              onClick={handleDelete}
              disabled={isPending}
              className="flex-1 bg-rose-500 hover:bg-rose-600 text-white"
            >
              <Trash2 size={14} className="mr-1.5" />
              {isPending ? "Deleting…" : "Delete"}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

function formatValue(c: Coupon) {
  if (c.type === "PERCENTAGE") return `${c.value}%`;
  return formatCurrency(Number(c.value));
}

function isExpired(c: Coupon) {
  return c.expiresAt ? new Date(c.expiresAt) < new Date() : false;
}

export function AdminCouponManager({ coupons }: { coupons: CouponWithCount[] }) {
  const [isPending, startTransition] = useTransition();
  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<CouponWithCount | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CouponWithCount | null>(null);

  function handleToggle(id: string) {
    startTransition(async () => {
      const result = await adminToggleCouponAction(id);
      if (result.success) toast.success(result.message);
      else toast.error(result.error);
    });
  }

  const platform = coupons.filter((c) => !c.vendorId);
  const vendor = coupons.filter((c) => c.vendorId);
  const active = coupons.filter((c) => c.active && !isExpired(c)).length;
  const expired = coupons.filter(isExpired).length;

  return (
    <>
      {showCreate && <CouponModal onClose={() => setShowCreate(false)} />}
      {editTarget && <CouponModal coupon={editTarget} onClose={() => setEditTarget(null)} />}
      {deleteTarget && <DeleteModal coupon={deleteTarget} onClose={() => setDeleteTarget(null)} />}

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-zinc-950">Coupons</h2>
            <p className="mt-0.5 text-sm text-zinc-400">
              {coupons.length} total · {active} active · {expired} expired ·{" "}
              {platform.length} platform · {vendor.length} vendor-created
            </p>
          </div>
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="size-4 mr-1.5" />
            New Coupon
          </Button>
        </div>

        {/* Table */}
        <Card className="overflow-hidden">
          {coupons.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <TicketPercent className="size-10 text-zinc-300" />
              <p className="text-sm font-medium text-zinc-500">No coupons yet</p>
              <p className="text-xs text-zinc-400">Create platform-wide discount coupons for all customers.</p>
              <Button size="sm" onClick={() => setShowCreate(true)} className="mt-1">
                Create Coupon
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-zinc-100 bg-zinc-50/50">
                  <tr>
                    {["Code", "Name", "Discount", "Created By", "Used / Limit", "Min Order", "Expiry", "Status", "Actions"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium text-zinc-500">{h}</th>
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
                          <span>{formatValue(c)}</span>
                          <span className="ml-1 text-xs text-zinc-400">{c.type === "PERCENTAGE" ? "off" : "flat"}</span>
                        </td>
                        <td className="px-4 py-3">
                          {c.vendorId ? (
                            <div>
                              <p className="text-xs font-medium text-zinc-800">{c.vendor?.store?.name ?? "Unknown Store"}</p>
                              <Badge tone="muted" className="text-[10px] mt-0.5">Vendor Coupon</Badge>
                            </div>
                          ) : (
                            <div>
                              <p className="text-xs font-medium text-zinc-800">ZainStore Admin</p>
                              <Badge tone="accent" className="text-[10px] mt-0.5">Platform-wide</Badge>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-zinc-600">
                          {c._count.usages}{c.usageLimit ? ` / ${c.usageLimit}` : " / ∞"}
                        </td>
                        <td className="px-4 py-3 text-xs text-zinc-500">
                          {c.minOrderAmount ? formatCurrency(Number(c.minOrderAmount)) : "—"}
                        </td>
                        <td className="px-4 py-3 text-xs text-zinc-400">
                          {c.expiresAt ? (
                            <span className={expired ? "text-rose-500" : ""}>
                              {new Date(c.expiresAt).toLocaleDateString("en-PK")}
                              {expired && " (Exp)"}
                            </span>
                          ) : "No expiry"}
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
                              {c.active
                                ? <ToggleRight className="size-4 text-brand-500" />
                                : <ToggleLeft className="size-4" />}
                            </button>
                            <button
                              onClick={() => setEditTarget(c)}
                              title="Edit"
                              className="rounded p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
                            >
                              <Pencil className="size-4" />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(c)}
                              title="Delete"
                              className="rounded p-1.5 text-zinc-400 hover:bg-rose-50 hover:text-rose-600"
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
    </>
  );
}
