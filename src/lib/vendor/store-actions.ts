"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";

type ActionResult = { success: true; message: string } | { success: false; error: string };

export interface StoreSettingsInput {
  name: string;
  description?: string;
  logoUrl?: string;
  bannerUrl?: string;
  address?: string;
  phone?: string;
  email?: string;
  seoTitle?: string;
  seoDescription?: string;
  returnPolicy?: string;
  shippingPolicy?: string;
  vacationMode?: boolean;
}

export async function updateStoreSettingsAction(input: StoreSettingsInput): Promise<ActionResult> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "VENDOR") return { success: false, error: "Unauthorized" };

    if (!input.name?.trim()) return { success: false, error: "Store name is required." };

    const vendor = await db.vendorProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true, store: { select: { id: true } } },
    });
    if (!vendor?.store) return { success: false, error: "Store not found." };

    await db.store.update({
      where: { id: vendor.store.id },
      data: {
        name: input.name.trim(),
        description: input.description?.trim() || null,
        logoUrl: input.logoUrl?.trim() || null,
        bannerUrl: input.bannerUrl?.trim() || null,
        address: input.address?.trim() || null,
        phone: input.phone?.trim() || null,
        email: input.email?.trim() || null,
        seoTitle: input.seoTitle?.trim() || null,
        seoDescription: input.seoDescription?.trim() || null,
        returnPolicy: input.returnPolicy?.trim() || null,
        shippingPolicy: input.shippingPolicy?.trim() || null,
        vacationMode: input.vacationMode ?? false,
      },
    });

    revalidatePath("/vendor/store");
    revalidatePath("/shop");
    return { success: true, message: "Store settings saved." };
  } catch {
    return { success: false, error: "Failed to save store settings." };
  }
}
