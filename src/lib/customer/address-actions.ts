"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";

type ActionResult = { success: true; message: string } | { success: false; error: string };

export interface AddressInput {
  label?: string;
  line1: string;
  line2?: string;
  city: string;
  region?: string;
  postalCode?: string;
  country?: string;
}

async function requireCustomer() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "CUSTOMER") throw new Error("Unauthorized");
  return session.user.id;
}

export async function createAddressAction(input: AddressInput): Promise<ActionResult> {
  try {
    const userId = await requireCustomer();
    if (!input.line1.trim()) return { success: false, error: "Address line 1 is required." };
    if (!input.city.trim()) return { success: false, error: "City is required." };

    await db.address.create({
      data: {
        userId,
        label: input.label?.trim() || null,
        line1: input.line1.trim(),
        line2: input.line2?.trim() || null,
        city: input.city.trim(),
        region: input.region?.trim() || null,
        postalCode: input.postalCode?.trim() || null,
        country: input.country?.trim() || "Pakistan",
      },
    });

    revalidatePath("/customer/addresses");
    return { success: true, message: "Address saved." };
  } catch {
    return { success: false, error: "Failed to save address." };
  }
}

export async function updateAddressAction(id: string, input: AddressInput): Promise<ActionResult> {
  try {
    const userId = await requireCustomer();
    if (!input.line1.trim()) return { success: false, error: "Address line 1 is required." };
    if (!input.city.trim()) return { success: false, error: "City is required." };

    const existing = await db.address.findFirst({ where: { id, userId } });
    if (!existing) return { success: false, error: "Address not found." };

    await db.address.update({
      where: { id },
      data: {
        label: input.label?.trim() || null,
        line1: input.line1.trim(),
        line2: input.line2?.trim() || null,
        city: input.city.trim(),
        region: input.region?.trim() || null,
        postalCode: input.postalCode?.trim() || null,
        country: input.country?.trim() || "Pakistan",
      },
    });

    revalidatePath("/customer/addresses");
    return { success: true, message: "Address updated." };
  } catch {
    return { success: false, error: "Failed to update address." };
  }
}

export async function deleteAddressAction(id: string): Promise<ActionResult> {
  try {
    const userId = await requireCustomer();
    const existing = await db.address.findFirst({ where: { id, userId } });
    if (!existing) return { success: false, error: "Address not found." };

    await db.address.delete({ where: { id } });

    revalidatePath("/customer/addresses");
    return { success: true, message: "Address deleted." };
  } catch {
    return { success: false, error: "Failed to delete address." };
  }
}
