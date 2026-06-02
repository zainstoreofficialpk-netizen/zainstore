"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { BadgePercent, CircleDollarSign, ShoppingCart, TrendingUp, Edit2, Check, X } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/format";
import { setGlobalCommissionRate, setVendorCommissionOverride } from "@/lib/admin/commission-actions";

type Stats = {
  totalCommission: number;
  totalRevenue: number;
  thisMonth: number;
  lastMonth: number;
  growth: string | null;
  totalOrders: number;
};

type VendorRow = {
  vendorId: string;
  storeName: string;
  ownerName: string;
  overrideRate: number | null;
  revenue: number;
  commission: number;
  effectiveRate: string;
  orders: number;
};

// ── Inline rate editor for a vendor row ──────────────────────────────────────

function VendorRateCell({ row, globalRate }: { row: VendorRow; globalRate: number }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(row.overrideRate !== null ? String(row.overrideRate) : "");
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    const parsed = value === "" ? null : parseFloat(value);
    if (parsed !== null && (isNaN(parsed) || parsed < 0 || parsed > 100)) {
      toast.error("Rate must be between 0 and 100.");
      return;
    }
    startTransition(async () => {
      const r = await setVendorCommissionOverride(row.vendorId, parsed);
      if (r.success) { toast.success(r.message); setEditing(false); }
      else toast.error(r.error);
    });
  }

  if (!editing) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-zinc-800">
          {row.overrideRate !== null ? (
            <Badge tone="accent">{row.overrideRate}% override</Badge>
          ) : (
            <span className="text-zinc-400">{globalRate}% (global)</span>
          )}
        </span>
        <button onClick={() => setEditing(true)} className="text-zinc-300 hover:text-zinc-600">
          <Edit2 size={13} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <Input
        type="number"
        min={0}
        max={100}
        step={0.1}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={`${globalRate} (global)`}
        className="h-7 w-24 text-xs"
      />
      <button
        onClick={handleSave}
        disabled={isPending}
        className="grid size-7 place-items-center rounded text-emerald-600 hover:bg-emerald-50"
      >
        <Check size={13} />
      </button>
      <button
        onClick={() => { setEditing(false); setValue(row.overrideRate !== null ? String(row.overrideRate) : ""); }}
        className="grid size-7 place-items-center rounded text-zinc-400 hover:bg-zinc-100"
      >
        <X size={13} />
      </button>
    </div>
  );
}

// ── Global rate editor ────────────────────────────────────────────────────────

function GlobalRateCard({ globalRate }: { globalRate: number }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(globalRate));
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    const rate = parseFloat(value);
    if (isNaN(rate) || rate < 0 || rate > 100) { toast.error("Rate must be 0–100."); return; }
    startTransition(async () => {
      const r = await setGlobalCommissionRate(rate);
      if (r.success) { toast.success(r.message); setEditing(false); }
      else toast.error(r.error);
    });
  }

  return (
    <Card className="border-brand-200 bg-brand-50/30">
      <CardContent className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="flex size-12 items-center justify-center rounded-xl bg-brand-100 text-brand-600">
            <BadgePercent size={22} />
          </span>
          <div>
            <p className="text-sm font-medium text-zinc-500">Global Commission Rate</p>
            <p className="text-2xl font-bold text-zinc-950">{globalRate}%</p>
            <p className="text-xs text-zinc-400 mt-0.5">
              Applied to all vendors without a custom override
            </p>
          </div>
        </div>
        {!editing ? (
          <Button size="sm" variant="outline" onClick={() => setEditing(true)} className="gap-1.5 shrink-0">
            <Edit2 size={14} /> Edit rate
          </Button>
        ) : (
          <div className="flex items-center gap-2 shrink-0">
            <Input
              type="number"
              min={0}
              max={100}
              step={0.1}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="h-9 w-28"
              autoFocus
            />
            <span className="text-sm text-zinc-500">%</span>
            <Button size="sm" onClick={handleSave} disabled={isPending}>
              {isPending ? "Saving…" : "Save"}
            </Button>
            <Button size="sm" variant="outline" onClick={() => { setEditing(false); setValue(String(globalRate)); }}>
              Cancel
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Main dashboard ────────────────────────────────────────────────────────────

export function CommissionDashboard({
  globalRate,
  stats,
  vendorBreakdown,
}: {
  globalRate: number;
  stats: Stats;
  vendorBreakdown: VendorRow[];
}) {
  const vendorEarnings = stats.totalRevenue - stats.totalCommission;

  const statCards = [
    {
      label: "Platform Earnings",
      value: formatCurrency(stats.totalCommission),
      sub: stats.growth ? `${Number(stats.growth) >= 0 ? "+" : ""}${stats.growth}% vs last month` : "All time",
      icon: CircleDollarSign,
      tone: "brand",
    },
    {
      label: "Gross Marketplace Revenue",
      value: formatCurrency(stats.totalRevenue),
      sub: "Total order value (paid)",
      icon: TrendingUp,
      tone: "zinc",
    },
    {
      label: "Vendor Earnings",
      value: formatCurrency(vendorEarnings),
      sub: `After ${globalRate}% platform commission`,
      icon: BadgePercent,
      tone: "zinc",
    },
    {
      label: "Paid Orders",
      value: stats.totalOrders.toLocaleString(),
      sub: "Orders with commission",
      icon: ShoppingCart,
      tone: "zinc",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-bold text-zinc-950">Commission Management</h2>
        <p className="mt-0.5 text-sm text-zinc-400">
          Commission-based marketplace model — set rates, track earnings, manage vendor overrides.
        </p>
      </div>

      {/* Global rate */}
      <GlobalRateCard globalRate={globalRate} />

      {/* How it works */}
      <div className="rounded-xl border border-zinc-200 bg-white p-5">
        <h3 className="mb-4 text-sm font-semibold text-zinc-800">How Commission Works</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: "Order Total", value: "PKR 100", color: "bg-zinc-100 text-zinc-700" },
            { label: `Commission (${globalRate}%)`, value: `PKR ${globalRate}`, color: "bg-brand-50 text-brand-700" },
            { label: "Vendor Receives", value: `PKR ${100 - globalRate}`, color: "bg-emerald-50 text-emerald-700" },
          ].map((item) => (
            <div key={item.label} className={`rounded-lg p-4 text-center ${item.color}`}>
              <p className="text-xs font-medium">{item.label}</p>
              <p className="mt-1 text-xl font-bold">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <Card key={card.label}>
            <CardContent className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-zinc-500">{card.label}</p>
                <p className="mt-2 text-2xl font-bold text-zinc-950">{card.value}</p>
                <p className="mt-1 text-xs text-zinc-400">{card.sub}</p>
              </div>
              <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600">
                <card.icon size={20} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Vendor breakdown table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Vendor Commission Breakdown</CardTitle>
              <p className="mt-0.5 text-xs text-zinc-400">
                Click the edit icon to set a custom rate per vendor. Leave blank to use global rate.
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {vendorBreakdown.length === 0 ? (
            <div className="py-16 text-center text-sm text-zinc-400">
              No sales data yet. Commission breakdown will appear here once orders are placed.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-zinc-100 bg-zinc-50/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500">Store</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-zinc-500">Commission Rate</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-zinc-500">Orders</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-zinc-500">Gross Revenue</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-zinc-500">Platform Earned</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500">Vendor Earned</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  {vendorBreakdown.map((row) => (
                    <tr key={row.vendorId} className="hover:bg-zinc-50/60">
                      <td className="px-6 py-3">
                        <Link
                          href={`/admin/vendors/${row.vendorId}`}
                          className="font-medium text-zinc-800 hover:text-brand-600"
                        >
                          {row.storeName}
                        </Link>
                        <p className="text-xs text-zinc-400">{row.ownerName}</p>
                      </td>
                      <td className="px-3 py-3">
                        <VendorRateCell row={row} globalRate={globalRate} />
                      </td>
                      <td className="px-3 py-3 text-xs text-zinc-700">{row.orders}</td>
                      <td className="px-3 py-3 text-sm font-medium text-zinc-800">
                        {formatCurrency(row.revenue)}
                      </td>
                      <td className="px-3 py-3 text-sm font-semibold text-brand-600">
                        {formatCurrency(row.commission)}
                      </td>
                      <td className="px-6 py-3 text-sm font-medium text-emerald-600">
                        {formatCurrency(row.revenue - row.commission)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
