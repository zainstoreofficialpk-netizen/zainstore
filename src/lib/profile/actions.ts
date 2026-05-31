"use server";

import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";

import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { sendEmail, verificationEmailHtml } from "@/lib/email";
import { generateToken } from "@/lib/auth/tokens";

type ActionResult = { success: true; message: string } | { success: false; error: string };

async function requireUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user;
}

// ─── Update Personal Info ──────────────────────────────────────────────────────

export async function updatePersonalInfo(data: {
  name: string;
  phone?: string;
  image?: string;
}): Promise<ActionResult> {
  const user = await requireUser();

  if (!data.name?.trim() || data.name.length < 2) {
    return { success: false, error: "Name must be at least 2 characters." };
  }

  await db.user.update({
    where: { id: user.id },
    data: {
      name: data.name.trim(),
      phone: data.phone?.trim() || null,
      image: data.image?.trim() || null,
    },
  });

  // Revalidate all portal layouts so the topbar reflects the new name/avatar immediately
  revalidatePath("/admin", "layout");
  revalidatePath("/vendor", "layout");
  revalidatePath("/customer", "layout");

  return { success: true, message: "Profile updated successfully." };
}

// ─── Request Email Change ──────────────────────────────────────────────────────

export async function requestEmailChange(newEmail: string): Promise<ActionResult> {
  const user = await requireUser();

  if (!newEmail?.includes("@")) {
    return { success: false, error: "Enter a valid email address." };
  }

  const existing = await db.user.findUnique({ where: { email: newEmail } });
  if (existing && existing.id !== user.id) {
    return { success: false, error: "This email is already in use by another account." };
  }

  const token = generateToken();
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await db.verificationToken.deleteMany({
    where: { identifier: { startsWith: `email-change:${user.id}:` } },
  });

  await db.verificationToken.create({
    data: { identifier: `email-change:${user.id}:${newEmail}`, token, expires },
  });

  const url = `${process.env.NEXT_PUBLIC_APP_URL}/confirm-email?token=${token}`;

  await sendEmail({
    to: newEmail,
    subject: "Confirm your new email — ZainStore.pk",
    html: verificationEmailHtml(url),
  });

  return {
    success: true,
    message: `A confirmation link has been sent to ${newEmail}. Click it to update your email.`,
  };
}

// ─── Change Password ───────────────────────────────────────────────────────────

export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<ActionResult> {
  const user = await requireUser();

  if (newPassword.length < 8) {
    return { success: false, error: "New password must be at least 8 characters." };
  }

  const dbUser = await db.user.findUnique({ where: { id: user.id } });
  if (!dbUser?.passwordHash) {
    return { success: false, error: "Cannot change password for this account type." };
  }

  const valid = await bcrypt.compare(currentPassword, dbUser.passwordHash);
  if (!valid) {
    return { success: false, error: "Current password is incorrect." };
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await db.user.update({ where: { id: user.id }, data: { passwordHash } });

  return { success: true, message: "Password changed successfully." };
}

// ─── Update Vendor Bank Details ────────────────────────────────────────────────

export async function updateVendorBank(data: {
  bankName?: string;
  accountTitle?: string;
  accountNumber?: string;
  iban?: string;
}): Promise<ActionResult> {
  const user = await requireUser();

  await db.vendorProfile.update({
    where: { userId: user.id },
    data: {
      bankName: data.bankName?.trim() || null,
      accountTitle: data.accountTitle?.trim() || null,
      accountNumber: data.accountNumber?.trim() || null,
      iban: data.iban?.trim() || null,
    },
  });

  return { success: true, message: "Bank details updated." };
}

// ─── Update Vendor Store Info ──────────────────────────────────────────────────

export async function updateVendorStore(data: {
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  logoUrl?: string;
  bannerUrl?: string;
}): Promise<ActionResult> {
  const user = await requireUser();

  const vendor = await db.vendorProfile.findUnique({
    where: { userId: user.id },
    include: { store: true },
  });

  if (!vendor?.store) {
    return { success: false, error: "Store not found." };
  }

  await db.store.update({
    where: { id: vendor.store.id },
    data: {
      description: data.description?.trim() || null,
      address: data.address?.trim() || null,
      phone: data.phone?.trim() || null,
      email: data.email?.trim() || null,
      logoUrl: data.logoUrl?.trim() || null,
      bannerUrl: data.bannerUrl?.trim() || null,
    },
  });

  return { success: true, message: "Store information updated." };
}

// ─── Update Customer Address ───────────────────────────────────────────────────

export async function updateCustomerAddress(
  addressId: string | null,
  data: {
    label?: string;
    line1: string;
    line2?: string;
    city: string;
    region?: string;
    postalCode?: string;
  },
): Promise<ActionResult> {
  const user = await requireUser();

  if (!data.line1?.trim() || !data.city?.trim()) {
    return { success: false, error: "Address line 1 and city are required." };
  }

  if (addressId) {
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
  } else {
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
  }

  return { success: true, message: "Address updated." };
}
