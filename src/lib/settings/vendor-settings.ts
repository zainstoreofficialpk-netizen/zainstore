"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";

type ActionResult = { success: true; message: string } | { success: false; error: string };

async function requireVendor() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "VENDOR") throw new Error("Unauthorized");
  return session.user;
}

async function getVendorStore(userId: string) {
  const vendor = await db.vendorProfile.findUnique({
    where: { userId },
    include: { store: true },
  });
  if (!vendor?.store) throw new Error("Store not found.");
  return { vendor, store: vendor.store };
}

export async function saveVendorNotificationPreferences(
  prefs: Record<string, boolean>,
): Promise<ActionResult> {
  const user = await requireVendor();
  await db.user.update({ where: { id: user.id }, data: { notificationPreferences: prefs } });
  revalidatePath("/vendor/settings");
  return { success: true, message: "Notification preferences saved." };
}

export async function updateVendorStoreInfo(data: {
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
}): Promise<ActionResult> {
  const user = await requireVendor();
  const { store } = await getVendorStore(user.id);
  await db.store.update({
    where: { id: store.id },
    data: {
      description: data.description?.trim() || null,
      address: data.address?.trim() || null,
      phone: data.phone?.trim() || null,
      email: data.email?.trim() || null,
    },
  });
  revalidatePath("/vendor/settings");
  return { success: true, message: "Store information updated." };
}

export async function updateVendorBranding(data: {
  logoUrl?: string;
  bannerUrl?: string;
}): Promise<ActionResult> {
  const user = await requireVendor();
  const { store } = await getVendorStore(user.id);
  await db.store.update({
    where: { id: store.id },
    data: {
      logoUrl: data.logoUrl?.trim() || null,
      bannerUrl: data.bannerUrl?.trim() || null,
    },
  });
  revalidatePath("/vendor/settings");
  return { success: true, message: "Branding updated." };
}

export async function saveVendorShippingSettings(settings: {
  processingTime?: string;
  freeShippingThreshold?: number;
  defaultShippingCost?: number;
  shippingPolicy?: string;
  returnPolicy?: string;
}): Promise<ActionResult> {
  const user = await requireVendor();
  const { vendor, store } = await getVendorStore(user.id);
  await db.vendorProfile.update({
    where: { id: vendor.id },
    data: { shippingSettings: settings },
  });
  if (settings.shippingPolicy !== undefined || settings.returnPolicy !== undefined) {
    await db.store.update({
      where: { id: store.id },
      data: {
        shippingPolicy: settings.shippingPolicy ?? undefined,
        returnPolicy: settings.returnPolicy ?? undefined,
      },
    });
  }
  revalidatePath("/vendor/settings");
  return { success: true, message: "Shipping settings saved." };
}

export async function saveVendorTaxSettings(settings: {
  taxEnabled?: boolean;
  taxRate?: number;
  taxIncluded?: boolean;
}): Promise<ActionResult> {
  const user = await requireVendor();
  const { vendor } = await getVendorStore(user.id);
  await db.vendorProfile.update({
    where: { id: vendor.id },
    data: { taxSettings: settings },
  });
  revalidatePath("/vendor/settings");
  return { success: true, message: "Tax settings saved." };
}
