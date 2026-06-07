"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";

type ActionResult = { success: true; message: string } | { success: false; error: string };

async function requireCustomer() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user;
}

export async function saveNotificationPreferences(
  prefs: Record<string, boolean>,
): Promise<ActionResult> {
  const user = await requireCustomer();
  await db.user.update({ where: { id: user.id }, data: { notificationPreferences: prefs } });
  revalidatePath("/customer/settings");
  return { success: true, message: "Notification preferences saved." };
}

export async function savePrivacySettings(
  settings: Record<string, boolean>,
): Promise<ActionResult> {
  const user = await requireCustomer();
  await db.user.update({ where: { id: user.id }, data: { privacySettings: settings } });
  revalidatePath("/customer/settings");
  return { success: true, message: "Privacy settings saved." };
}

export async function createCustomerAddress(data: {
  label?: string;
  line1: string;
  line2?: string;
  city: string;
  region?: string;
  postalCode?: string;
}): Promise<ActionResult> {
  const user = await requireCustomer();
  if (!data.line1?.trim() || !data.city?.trim()) {
    return { success: false, error: "Address line 1 and city are required." };
  }
  await db.address.create({
    data: {
      userId: user.id,
      label: data.label?.trim() || "Home",
      line1: data.line1.trim(),
      line2: data.line2?.trim() || null,
      city: data.city.trim(),
      region: data.region?.trim() || null,
      postalCode: data.postalCode?.trim() || null,
    },
  });
  revalidatePath("/customer/settings");
  revalidatePath("/customer/addresses");
  return { success: true, message: "Address added." };
}

export async function updateCustomerAddressById(
  addressId: string,
  data: {
    label?: string;
    line1: string;
    line2?: string;
    city: string;
    region?: string;
    postalCode?: string;
  },
): Promise<ActionResult> {
  const user = await requireCustomer();
  if (!data.line1?.trim() || !data.city?.trim()) {
    return { success: false, error: "Address line 1 and city are required." };
  }
  await db.address.update({
    where: { id: addressId, userId: user.id },
    data: {
      label: data.label?.trim() || "Home",
      line1: data.line1.trim(),
      line2: data.line2?.trim() || null,
      city: data.city.trim(),
      region: data.region?.trim() || null,
      postalCode: data.postalCode?.trim() || null,
    },
  });
  revalidatePath("/customer/settings");
  revalidatePath("/customer/addresses");
  return { success: true, message: "Address updated." };
}

export async function deleteCustomerAddress(addressId: string): Promise<ActionResult> {
  const user = await requireCustomer();
  await db.address.delete({ where: { id: addressId, userId: user.id } });
  revalidatePath("/customer/settings");
  revalidatePath("/customer/addresses");
  return { success: true, message: "Address deleted." };
}
