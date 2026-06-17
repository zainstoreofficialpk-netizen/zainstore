"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { UserRole, VendorStatus } from "@prisma/client";

import { db } from "@/lib/db";
import { sendEmail, verificationEmailHtml, resetPasswordEmailHtml } from "@/lib/email";
import { createVerificationToken, createPasswordResetToken, consumeToken } from "@/lib/auth/tokens";
import { notifyAdminNewVendor } from "@/lib/admin/vendor-actions";

type ActionResult = { success: true; message: string } | { success: false; error: string };

// ─── Schemas ──────────────────────────────────────────────────────────────────

const customerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  phone: z.string().optional(),
  city: z.string().optional(),
});

const vendorSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  phone: z.string().min(10, "Enter a valid phone number"),
  storeName: z.string().min(2, "Store name must be at least 2 characters"),
  storeSlug: z
    .string()
    .min(2, "Store URL must be at least 2 characters")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Store URL must contain only lowercase letters, numbers, and hyphens"),
  storeDescription: z.string().min(10, "Description must be at least 10 characters"),
  storeAddress: z.string().min(1, "Store address is required"),
  storePhone: z.string().min(10, "Enter a valid store phone number"),
  storeEmail: z.string().email().optional().or(z.literal("")),
  bankName: z.string().min(1, "Bank name is required"),
  accountTitle: z.string().min(1, "Account title is required"),
  accountNumber: z.string().min(1, "Account number is required"),
  iban: z.string().optional(),
  cnicFront: z.string().optional(),
  cnicBack: z.string().optional(),
  bankCheque: z.string().optional(),
});

// ─── Register Customer ─────────────────────────────────────────────────────────

export async function registerCustomer(data: {
  name: string;
  email: string;
  password: string;
  phone?: string;
  city?: string;
}): Promise<ActionResult> {
  const parsed = customerSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const existing = await db.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) return { success: false, error: "An account with this email already exists." };

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);

  const user = await db.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash,
      role: UserRole.CUSTOMER,
      phone: parsed.data.phone || null,
      customerProfile: { create: {} },
    },
  });

  // Only create address if a meaningful city was supplied
  // (line1 is required by schema — skip if we only have city, let user add full address from profile)
  // Address can be properly set from /customer/profile?tab=bank after registration

  const token = await createVerificationToken(user.email);
  const url = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${token}`;
  await sendEmail({ to: user.email, subject: "Verify your ZainStore.pk account", html: verificationEmailHtml(url) });

  return { success: true, message: "Account created! Check your email to verify your account." };
}

// ─── Register Vendor ───────────────────────────────────────────────────────────

export async function registerVendor(data: z.infer<typeof vendorSchema>): Promise<ActionResult> {
  const parsed = vendorSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const [existingEmail, existingSlug] = await Promise.all([
    db.user.findUnique({ where: { email: parsed.data.email } }),
    db.store.findUnique({ where: { slug: parsed.data.storeSlug } }),
  ]);

  if (existingEmail) return { success: false, error: "An account with this email already exists." };
  if (existingSlug) return { success: false, error: "This store URL is already taken. Please choose another." };

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);

  const user = await db.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash,
      role: UserRole.VENDOR,
      phone: parsed.data.phone,
      vendorProfile: {
        create: {
          status: VendorStatus.PENDING_APPROVAL,
          bankName: parsed.data.bankName || null,
          accountTitle: parsed.data.accountTitle || null,
          accountNumber: parsed.data.accountNumber || null,
          iban: parsed.data.iban || null,
          cnicFront: parsed.data.cnicFront || null,
          cnicBack: parsed.data.cnicBack || null,
          bankCheque: parsed.data.bankCheque || null,
          store: {
            create: {
              name: parsed.data.storeName,
              slug: parsed.data.storeSlug,
              description: parsed.data.storeDescription,
              address: parsed.data.storeAddress || null,
              phone: parsed.data.storePhone || null,
              email: parsed.data.storeEmail || null,
            },
          },
        },
      },
    },
    include: { vendorProfile: true },
  });

  const token = await createVerificationToken(user.email);
  const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${token}`;

  // Notify admin of the new application (non-blocking)
  if (user.vendorProfile) {
    notifyAdminNewVendor(
      user.vendorProfile.id,
      parsed.data.storeName,
      parsed.data.name,
      parsed.data.email,
      parsed.data.phone,
    ).catch(() => {});
  }

  await sendEmail({
    to: user.email,
    subject: "Verify your ZainStore.pk vendor account",
    html: verificationEmailHtml(verifyUrl),
  });

  return {
    success: true,
    message: "Application submitted! Please verify your email. Your account will be reviewed by our team — you'll be notified once approved.",
  };
}

// ─── Forgot Password ───────────────────────────────────────────────────────────

export async function forgotPassword(email: string): Promise<ActionResult> {
  const user = await db.user.findUnique({ where: { email } });

  if (user) {
    const token = await createPasswordResetToken(email);
    const url = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;
    await sendEmail({ to: email, subject: "Reset your ZainStore.pk password", html: resetPasswordEmailHtml(url) });
  }

  // Always return success to prevent email enumeration
  return { success: true, message: "If that email is registered, you'll receive a reset link shortly." };
}

// ─── Reset Password ────────────────────────────────────────────────────────────

export async function resetPassword(token: string, password: string): Promise<ActionResult> {
  if (password.length < 8) return { success: false, error: "Password must be at least 8 characters." };

  const record = await consumeToken(token);
  if (!record) return { success: false, error: "This reset link is invalid or has expired." };
  if (!record.identifier.startsWith("reset:")) return { success: false, error: "Invalid reset token." };

  const email = record.identifier.replace("reset:", "");
  const passwordHash = await bcrypt.hash(password, 10);

  await db.user.update({ where: { email }, data: { passwordHash } });

  return { success: true, message: "Password updated successfully. You can now sign in." };
}

// ─── Verify Email ──────────────────────────────────────────────────────────────

export async function verifyEmail(token: string): Promise<ActionResult> {
  const record = await consumeToken(token);
  if (!record) return { success: false, error: "This verification link is invalid or has expired." };
  if (!record.identifier.startsWith("verify:")) return { success: false, error: "Invalid verification token." };

  const email = record.identifier.replace("verify:", "");
  await db.user.update({ where: { email }, data: { emailVerified: new Date() } });

  return { success: true, message: "Email verified! You can now sign in to your account." };
}
