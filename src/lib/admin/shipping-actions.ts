"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import type { ShippingSettings, ShippingTier } from "@/lib/shipping";

type ActionResult = { success: true; message: string } | { success: false; error: string };

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");
  if (session.user.role !== "SUPER_ADMIN") throw new Error("Forbidden");
  return session.user;
}

const SETTINGS_KEY = "shipping.cod_rates";

const tierSchema = z.object({
  id: z.string(),
  label: z.string().min(1),
  minWeight: z.coerce.number().int().min(1),
  maxWeight: z.coerce.number().int().min(1),
  price: z.coerce.number().int().min(0),
});

export async function saveShippingRatesAction(tiers: ShippingTier[]): Promise<ActionResult> {
  try {
    await requireAdmin();

    if (!tiers.length) return { success: false, error: "At least one rate tier is required." };

    // Validate each tier
    for (const tier of tiers) {
      const parsed = tierSchema.safeParse(tier);
      if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };
      if (tier.minWeight >= tier.maxWeight)
        return { success: false, error: `Tier "${tier.label}": min weight must be less than max weight.` };
    }

    // Check for overlaps
    const sorted = [...tiers].sort((a, b) => a.minWeight - b.minWeight);
    for (let i = 0; i < sorted.length - 1; i++) {
      if (sorted[i].maxWeight >= sorted[i + 1].minWeight) {
        return { success: false, error: `Weight ranges overlap between "${sorted[i].label}" and "${sorted[i + 1].label}".` };
      }
    }

    const settings: ShippingSettings = {
      tiers: sorted,
      currency: "PKR",
      region: "Pakistan",
      method: "Cash on Delivery (COD)",
    };

    await db.settings.upsert({
      where: { key: SETTINGS_KEY },
      create: {
        key: SETTINGS_KEY,
        value: settings as any,
        group: "shipping",
        description: "Pakistan COD weight-based shipping rates",
      },
      update: { value: settings as any },
    });

    revalidatePath("/admin/shipping");
    return { success: true, message: `${tiers.length} shipping rate${tiers.length !== 1 ? "s" : ""} saved.` };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to save rates." };
  }
}
