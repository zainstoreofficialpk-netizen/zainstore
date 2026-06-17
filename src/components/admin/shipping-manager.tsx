"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2, Save, Package, Truck } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/format";
import { saveShippingRatesAction } from "@/lib/admin/shipping-actions";
import type { ShippingSettings, ShippingTier } from "@/lib/shipping";

function newTier(): ShippingTier {
  return {
    id: `t${Date.now()}`,
    label: "",
    minWeight: 0,
    maxWeight: 0,
    price: 0,
  };
}

export function ShippingManager({ settings }: { settings: ShippingSettings }) {
  const [tiers, setTiers] = useState<ShippingTier[]>(settings.tiers);
  const [isPending, startTransition] = useTransition();
  const [hasChanges, setHasChanges] = useState(false);

  function updateTier(id: string, field: keyof ShippingTier, value: string | number) {
    setTiers((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const updated = { ...t, [field]: value };
        if (field === "minWeight" || field === "maxWeight") {
          const min = field === "minWeight" ? Number(value) : t.minWeight;
          const max = field === "maxWeight" ? Number(value) : t.maxWeight;
          updated.label = `${min}g – ${max}g`;
        }
        return updated;
      }),
    );
    setHasChanges(true);
  }

  function addTier() {
    setTiers((prev) => [...prev, newTier()]);
    setHasChanges(true);
  }

  function removeTier(id: string) {
    setTiers((prev) => prev.filter((t) => t.id !== id));
    setHasChanges(true);
  }

  function handleSave() {
    startTransition(async () => {
      const r = await saveShippingRatesAction(tiers);
      if (r.success) {
        toast.success(r.message);
        setHasChanges(false);
      } else {
        toast.error(r.error);
      }
    });
  }

  const sorted = [...tiers].sort((a, b) => a.minWeight - b.minWeight);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-zinc-950">Shipping Management</h2>
          <p className="mt-0.5 text-sm text-zinc-400">
            Pakistan Cash on Delivery (COD) — weight-based shipping rates.
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={isPending || !hasChanges}
          className="gap-2 shrink-0"
        >
          {isPending ? "Saving…" : <><Save size={15} /> Save Rates</>}
        </Button>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 rounded-xl border border-brand-200 bg-brand-50 p-4">
        <Truck size={18} className="mt-0.5 shrink-0 text-brand-600" />
        <div>
          <p className="text-sm font-semibold text-brand-800">Pakistan COD Only</p>
          <p className="text-sm text-brand-700 mt-0.5">
            Shipping is calculated automatically based on product weight. Charges are added to the order total at checkout. All deliveries are within Pakistan via Cash on Delivery.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* Rate editor */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Weight-Based Rate Tiers</CardTitle>
              <Button size="sm" variant="outline" onClick={addTier} className="gap-1.5">
                <Plus size={14} /> Add Tier
              </Button>
            </div>
            <p className="mt-0.5 text-xs text-zinc-400">
              Weight in grams. Ranges must not overlap. Rates in PKR.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {tiers.length === 0 ? (
              <div className="rounded-lg border-2 border-dashed border-zinc-200 py-10 text-center">
                <Package size={28} className="mx-auto mb-2 text-zinc-300" />
                <p className="text-sm text-zinc-400">No tiers yet.</p>
                <Button size="sm" variant="outline" onClick={addTier} className="mt-3 gap-1.5">
                  <Plus size={14} /> Add first tier
                </Button>
              </div>
            ) : (
              tiers.map((tier, i) => (
                <div key={tier.id} className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                      Tier {i + 1}
                    </span>
                    <button
                      onClick={() => removeTier(tier.id)}
                      className="grid size-7 place-items-center rounded-md text-zinc-300 hover:bg-rose-50 hover:text-rose-500"
                      title="Remove tier"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-zinc-600">
                        Min Weight (g) *
                      </label>
                      <Input
                        type="number"
                        min={1}
                        value={tier.minWeight || ""}
                        onChange={(e) => updateTier(tier.id, "minWeight", parseInt(e.target.value) || 0)}
                        placeholder="e.g. 500"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-zinc-600">
                        Max Weight (g) *
                      </label>
                      <Input
                        type="number"
                        min={1}
                        value={tier.maxWeight || ""}
                        onChange={(e) => updateTier(tier.id, "maxWeight", parseInt(e.target.value) || 0)}
                        placeholder="e.g. 1000"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-zinc-600">
                        Shipping Rate (PKR) *
                      </label>
                      <Input
                        type="number"
                        min={0}
                        value={tier.price || ""}
                        onChange={(e) => updateTier(tier.id, "price", parseInt(e.target.value) || 0)}
                        placeholder="e.g. 400"
                      />
                    </div>
                  </div>

                  {tier.minWeight > 0 && tier.maxWeight > 0 && tier.price > 0 && (
                    <div className="mt-3 flex items-center gap-2 text-xs text-zinc-500">
                      <Package size={12} />
                      <span>
                        Products {tier.minWeight}g – {tier.maxWeight}g → <strong className="text-zinc-700">PKR {tier.price.toLocaleString()}</strong> shipping
                      </span>
                    </div>
                  )}
                </div>
              ))
            )}

            {hasChanges && (
              <div className="flex justify-end pt-2">
                <Button onClick={handleSave} disabled={isPending} className="gap-2">
                  {isPending ? "Saving…" : <><Save size={14} /> Save Changes</>}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Live preview + policy + calculator */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Current Rate Table</CardTitle>
              <p className="mt-0.5 text-xs text-zinc-400">As shown to vendors and customers</p>
            </CardHeader>
            <CardContent className="p-0">
              {sorted.filter((t) => t.minWeight > 0 && t.maxWeight > 0 && t.price >= 0).length === 0 ? (
                <p className="px-5 py-4 text-sm text-zinc-400">No rates configured yet.</p>
              ) : (
                <div className="divide-y divide-zinc-50">
                  {sorted
                    .filter((t) => t.minWeight > 0 && t.maxWeight > 0)
                    .map((tier) => (
                      <div key={tier.id} className="flex items-center justify-between px-5 py-3">
                        <div className="flex items-center gap-2">
                          <Package size={14} className="text-zinc-400" />
                          <span className="text-sm text-zinc-700">
                            {tier.minWeight}g – {tier.maxWeight}g
                          </span>
                        </div>
                        <span className="text-sm font-semibold text-zinc-900">
                          {formatCurrency(tier.price)}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Shipping Policy</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm text-zinc-600">
              <div className="flex items-start gap-2">
                <Badge tone="success" className="shrink-0 mt-0.5">Active</Badge>
                <span>Cash on Delivery (COD)</span>
              </div>
              <div className="flex items-start gap-2">
                <Badge tone="default" className="shrink-0 mt-0.5">Region</Badge>
                <span>Pakistan only</span>
              </div>
              <div className="flex items-start gap-2">
                <Badge tone="accent" className="shrink-0 mt-0.5">Basis</Badge>
                <span>Product weight (grams)</span>
              </div>
              <div className="flex items-start gap-2">
                <Badge tone="warning" className="shrink-0 mt-0.5">Note</Badge>
                <span>Weight field is required for all vendor products.</span>
              </div>
            </CardContent>
          </Card>

          <ShippingCalculator tiers={sorted.filter((t) => t.minWeight > 0 && t.maxWeight > 0)} />
        </div>
      </div>
    </div>
  );
}

function ShippingCalculator({ tiers }: { tiers: ShippingTier[] }) {
  const [weight, setWeight] = useState("");

  const weightG = parseInt(weight);
  const tier = tiers.find((t) => weightG >= t.minWeight && weightG <= t.maxWeight);
  const sorted = [...tiers].sort((a, b) => a.minWeight - b.minWeight);
  const fallback = weightG > 0 && !tier
    ? weightG < (sorted[0]?.minWeight ?? 0)
      ? sorted[0]
      : sorted[sorted.length - 1]
    : null;
  const applicable = tier ?? fallback;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Calculator</CardTitle>
        <p className="mt-0.5 text-xs text-zinc-400">Test what shipping costs for a given weight</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600">Enter weight (grams)</label>
          <Input
            type="number"
            min={1}
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="e.g. 750"
          />
        </div>
        {weightG > 0 && (
          <div className={`rounded-lg p-3 ${applicable ? "bg-emerald-50 border border-emerald-200" : "bg-zinc-50 border border-zinc-200"}`}>
            {applicable ? (
              <div>
                <p className="text-xs text-zinc-500 mb-1">Shipping charge for {weightG}g product:</p>
                <p className="text-xl font-bold text-zinc-950">{formatCurrency(applicable.price)}</p>
                <p className="text-xs text-zinc-400 mt-0.5">Tier: {applicable.minWeight}g – {applicable.maxWeight}g</p>
              </div>
            ) : (
              <p className="text-sm text-zinc-500">No rate configured for {weightG}g. Add a matching tier.</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
