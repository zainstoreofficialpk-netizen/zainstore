"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2, Save, Package, Truck, MapPin, ChevronDown, ChevronRight, Zap } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/format";
import { saveShippingRatesAction } from "@/lib/admin/shipping-actions";
import type { ShippingSettings, ShippingTier } from "@/lib/shipping";
import { CITIES_BY_PROVINCE, PROVINCES } from "@/lib/checkout/pakistan-data";

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
        // Auto-generate label from weights
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

  // Sort for preview display
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

        {/* Live preview */}
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

          {/* Shipping calculator */}
          <ShippingCalculator tiers={sorted.filter((t) => t.minWeight > 0 && t.maxWeight > 0)} />
        </div>
      </div>

      {/* ── City-Based Delivery Charges ─────────────────────────────── */}
      <CityRatesSection />
    </div>
  );
}

// ── Quick calculator widget ───────────────────────────────────────────────────

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

// ── City-based delivery charges section ──────────────────────────────────────

const MAJOR_CITIES = new Set([
  "Islamabad","Karachi","Lahore","Rawalpindi","Faisalabad",
  "Multan","Peshawar","Quetta","Sialkot","Gujranwala","Hyderabad","Bahawalpur",
]);
const REMOTE_PROVINCES = new Set([
  "Balochistan","Gilgit-Baltistan","Azad Kashmir",
]);

const DELIVERY_TIERS = [
  {
    id: "major",
    label: "Major Cities",
    badge: "bg-blue-100 text-blue-700",
    dot: "bg-blue-500",
    standard: 150,
    express: 300,
    standardDays: "2–4 days",
    expressDays: "1–2 days",
    description: "Islamabad, Karachi, Lahore, Rawalpindi, Faisalabad, Multan, Peshawar, Quetta, Sialkot, Gujranwala, Hyderabad, Bahawalpur",
  },
  {
    id: "standard",
    label: "Standard Cities",
    badge: "bg-amber-100 text-amber-700",
    dot: "bg-amber-500",
    standard: 200,
    express: 400,
    standardDays: "3–5 days",
    expressDays: "2–3 days",
    description: "All other cities in Punjab, Sindh & KPK not listed as major cities",
  },
  {
    id: "remote",
    label: "Remote Areas",
    badge: "bg-rose-100 text-rose-700",
    dot: "bg-rose-500",
    standard: 350,
    express: 600,
    standardDays: "7–10 days",
    expressDays: "3–5 days",
    description: "Balochistan, Gilgit-Baltistan, Azad Kashmir and surrounding areas",
  },
];

function CityRatesSection() {
  const [openProvince, setOpenProvince] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  function getTier(city: string, province: string) {
    if (REMOTE_PROVINCES.has(province)) return DELIVERY_TIERS[2];
    if (MAJOR_CITIES.has(city)) return DELIVERY_TIERS[0];
    return DELIVERY_TIERS[1];
  }

  const filteredProvinces = PROVINCES.filter((p) => {
    if (!search) return true;
    const cities = CITIES_BY_PROVINCE[p] ?? [];
    return (
      p.toLowerCase().includes(search.toLowerCase()) ||
      cities.some((c) => c.toLowerCase().includes(search.toLowerCase()))
    );
  });

  return (
    <div className="space-y-5 pt-2">
      {/* Section header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-zinc-950 flex items-center gap-2">
            <MapPin size={16} className="text-brand-500" />
            City-Based Delivery Charges
          </h2>
          <p className="mt-0.5 text-sm text-zinc-400">
            Checkout automatically applies these rates based on the customer&apos;s city.
          </p>
        </div>
        <span className="text-xs bg-zinc-100 text-zinc-500 px-2.5 py-1 rounded-full font-medium shrink-0">
          Sample / Reference
        </span>
      </div>

      {/* Tier summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {DELIVERY_TIERS.map((tier) => (
          <div key={tier.id} className="rounded-xl border border-zinc-200 bg-white p-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full shrink-0 ${tier.dot}`} />
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${tier.badge}`}>
                {tier.label}
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                  <Truck size={12} />
                  <span>Standard</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-zinc-900">{formatCurrency(tier.standard)}</p>
                  <p className="text-[10px] text-zinc-400">{tier.standardDays}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                  <Zap size={12} />
                  <span>Express</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-zinc-900">{formatCurrency(tier.express)}</p>
                  <p className="text-[10px] text-zinc-400">{tier.expressDays}</p>
                </div>
              </div>
            </div>
            <p className="text-[10px] text-zinc-400 leading-relaxed border-t border-zinc-100 pt-2">
              {tier.description}
            </p>
          </div>
        ))}
      </div>

      {/* City lookup table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <CardTitle>All Cities &amp; Rates</CardTitle>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search city or province..."
              className="h-8 w-56 px-3 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            {PROVINCES.reduce((s, p) => s + (CITIES_BY_PROVINCE[p]?.length ?? 0), 0)} cities across{" "}
            {PROVINCES.length} provinces
          </p>
        </CardHeader>
        <CardContent className="p-0 divide-y divide-zinc-50">
          {filteredProvinces.map((province) => {
            const cities = (CITIES_BY_PROVINCE[province] ?? []).filter(
              (c) => !search || c.toLowerCase().includes(search.toLowerCase()) || province.toLowerCase().includes(search.toLowerCase())
            );
            if (cities.length === 0) return null;
            const isOpen = openProvince === province || !!search;
            const isRemote = REMOTE_PROVINCES.has(province);

            return (
              <div key={province}>
                {/* Province row */}
                <button
                  type="button"
                  onClick={() => setOpenProvince(isOpen && !search ? null : province)}
                  className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-zinc-50 transition-colors text-left"
                >
                  <span className={`h-2 w-2 rounded-full shrink-0 ${isRemote ? "bg-rose-400" : "bg-brand-400"}`} />
                  <span className="flex-1 text-sm font-semibold text-zinc-800">{province}</span>
                  <span className="text-xs text-zinc-400 mr-2">{cities.length} cities</span>
                  {isRemote && (
                    <span className="text-[9px] font-bold bg-rose-100 text-rose-600 px-1.5 py-0.5 rounded mr-2">REMOTE</span>
                  )}
                  {!search && (isOpen
                    ? <ChevronDown size={14} className="text-zinc-400 shrink-0" />
                    : <ChevronRight size={14} className="text-zinc-400 shrink-0" />
                  )}
                </button>

                {/* Cities table */}
                {isOpen && (
                  <div className="bg-zinc-50/50 border-t border-zinc-100">
                    {/* Header row */}
                    <div className="grid grid-cols-4 gap-2 px-5 py-2 text-[10px] font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-100">
                      <span className="col-span-1">City</span>
                      <span>Tier</span>
                      <span className="text-right">Standard</span>
                      <span className="text-right">Express</span>
                    </div>
                    {cities.map((city) => {
                      const tier = getTier(city, province);
                      return (
                        <div
                          key={city}
                          className="grid grid-cols-4 gap-2 px-5 py-2.5 text-sm border-b border-zinc-100/70 last:border-0 hover:bg-white transition-colors"
                        >
                          <span className="col-span-1 font-medium text-zinc-700 truncate">{city}</span>
                          <span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${tier.badge}`}>
                              {tier.id === "major" ? "Major" : tier.id === "remote" ? "Remote" : "Standard"}
                            </span>
                          </span>
                          <span className="text-right font-semibold text-zinc-800">
                            {formatCurrency(tier.standard)}
                          </span>
                          <span className="text-right font-semibold text-zinc-800">
                            {formatCurrency(tier.express)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
