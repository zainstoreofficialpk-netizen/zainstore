import { db } from "@/lib/db";

const SETTINGS_KEY = "shipping.cod_rates";

export type ShippingTier = {
  id: string;
  label: string;         // e.g. "500g – 1000g"
  minWeight: number;     // grams
  maxWeight: number;     // grams
  price: number;         // PKR
};

export type ShippingSettings = {
  tiers: ShippingTier[];
  currency: string;
  region: string;
  method: string;
};

// ── Default rates (used when no settings row exists yet) ──────────────────────

export const DEFAULT_SHIPPING_SETTINGS: ShippingSettings = {
  tiers: [
    { id: "t1", label: "500g – 1000g",  minWeight: 500,  maxWeight: 1000, price: 400 },
    { id: "t2", label: "1001g – 1500g", minWeight: 1001, maxWeight: 1500, price: 800 },
    { id: "t3", label: "1501g – 2000g", minWeight: 1501, maxWeight: 2000, price: 999 },
  ],
  currency: "PKR",
  region: "Pakistan",
  method: "Cash on Delivery (COD)",
};

// ── Read rates from DB (falls back to defaults) ───────────────────────────────

export async function getShippingSettings(): Promise<ShippingSettings> {
  try {
    const setting = await db.settings.findUnique({ where: { key: SETTINGS_KEY } });
    if (!setting) return DEFAULT_SHIPPING_SETTINGS;
    const val = setting.value as ShippingSettings;
    if (!val?.tiers?.length) return DEFAULT_SHIPPING_SETTINGS;
    return val;
  } catch {
    return DEFAULT_SHIPPING_SETTINGS;
  }
}

// ── Calculate shipping charge for a given weight in grams ────────────────────
// Returns null if weight is outside all configured tiers (no charge applicable)

export function calculateShipping(
  weightGrams: number,
  settings: ShippingSettings,
): { price: number; tier: ShippingTier | null; outOfRange: boolean } {
  if (!weightGrams || weightGrams <= 0) {
    return { price: 0, tier: null, outOfRange: false };
  }

  const tier = settings.tiers.find(
    (t) => weightGrams >= t.minWeight && weightGrams <= t.maxWeight,
  );

  if (!tier) {
    // Weight below smallest tier → use cheapest rate
    // Weight above largest tier → use most expensive rate
    const sorted = [...settings.tiers].sort((a, b) => a.minWeight - b.minWeight);
    if (weightGrams < sorted[0].minWeight) {
      return { price: sorted[0].price, tier: sorted[0], outOfRange: false };
    }
    const heaviest = sorted[sorted.length - 1];
    return { price: heaviest.price, tier: heaviest, outOfRange: true };
  }

  return { price: tier.price, tier, outOfRange: false };
}

// ── Helper: weight in kg → grams ──────────────────────────────────────────────

export function kgToGrams(kg: number | string): number {
  return Math.round(parseFloat(String(kg)) * 1000);
}

// ── Helper: format weight display ─────────────────────────────────────────────

export function formatWeight(grams: number): string {
  if (grams >= 1000) return `${(grams / 1000).toFixed(2).replace(/\.?0+$/, "")}kg`;
  return `${grams}g`;
}
