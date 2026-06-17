"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { VendorStatus, NotificationType, UserRole, Prisma } from "@prisma/client";
import { z } from "zod";

import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { sendEmail, vendorApprovedEmailHtml, vendorRejectedEmailHtml, vendorSignupAdminEmailHtml } from "@/lib/email";
import { createNotification } from "@/lib/notifications";

type ActionResult = { success: true; message: string } | { success: false; error: string };

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");
  if (session.user.role !== "SUPER_ADMIN") throw new Error("Forbidden");
  return session.user;
}

// ── Activity log helper ───────────────────────────────────────────────────────

async function logActivity(actorId: string, action: string, vendorId: string, metadata?: Prisma.InputJsonValue) {
  await db.activityLog.create({
    data: {
      actorId,
      action,
      entity: "vendor",
      entityId: vendorId,
      metadata: metadata ?? undefined,
    },
  });
}

// ── Notification helper ───────────────────────────────────────────────────────

async function notifyAdmin(title: string, body: string, data?: Prisma.InputJsonValue) {
  const admin = await db.user.findFirst({
    where: { role: UserRole.SUPER_ADMIN },
    select: { id: true },
  });
  if (!admin) return;
  await createNotification({
    userId: admin.id,
    type: NotificationType.VENDOR,
    title,
    body,
    url: "/admin/vendors",
  });
  void data;
}

async function notifyVendorUser(vendorId: string, title: string, body: string, data?: Prisma.InputJsonValue) {
  const vendor = await db.vendorProfile.findUnique({
    where: { id: vendorId },
    select: { userId: true },
  });
  if (!vendor) return;
  await createNotification({
    userId: vendor.userId,
    type: NotificationType.VENDOR,
    title,
    body,
    url: "/vendor",
  });
  void data;
}

// ── Status actions ────────────────────────────────────────────────────────────

export async function approveVendorAction(vendorId: string): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const vendor = await db.vendorProfile.update({
      where: { id: vendorId },
      data: { status: VendorStatus.ACTIVE, approvedAt: new Date(), rejectedAt: null },
      include: { store: { select: { name: true } }, user: { select: { name: true, email: true } } },
    });
    await Promise.all([
      logActivity(admin.id, "vendor.approved", vendorId, { storeName: vendor.store?.name }),
      notifyVendorUser(vendorId, "Application Approved! 🎉", `Your vendor application for ${vendor.store?.name ?? "your store"} has been approved. You can now start listing products.`),
    ]);
    void sendEmail({
      to: vendor.user.email,
      subject: "Your ZainStore.pk store is approved! 🎉",
      html: vendorApprovedEmailHtml({ vendorName: vendor.user.name ?? "Vendor", storeName: vendor.store?.name ?? "Your Store" }),
    });
    revalidatePath("/admin/vendors");
    revalidatePath(`/admin/vendors/${vendorId}`);
    return { success: true, message: `${vendor.store?.name ?? "Vendor"} approved successfully.` };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to approve vendor." };
  }
}

export async function rejectVendorAction(vendorId: string, reason: string): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const vendor = await db.vendorProfile.update({
      where: { id: vendorId },
      data: { status: VendorStatus.REJECTED, rejectedAt: new Date(), internalNotes: reason },
      include: { store: { select: { name: true } }, user: { select: { name: true, email: true } } },
    });
    await Promise.all([
      logActivity(admin.id, "vendor.rejected", vendorId, { reason }),
      notifyVendorUser(vendorId, "Application Rejected", `Your vendor application has been reviewed. Reason: ${reason}`),
    ]);
    void sendEmail({
      to: vendor.user.email,
      subject: "Update on your ZainStore.pk store application",
      html: vendorRejectedEmailHtml({ vendorName: vendor.user.name ?? "Vendor", storeName: vendor.store?.name ?? "Your Store", reason }),
    });
    revalidatePath("/admin/vendors");
    revalidatePath(`/admin/vendors/${vendorId}`);
    return { success: true, message: `${vendor.store?.name ?? "Vendor"} rejected.` };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to reject vendor." };
  }
}

export async function suspendVendorAction(vendorId: string, reason: string): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const vendor = await db.vendorProfile.update({
      where: { id: vendorId },
      data: { status: VendorStatus.SUSPENDED, suspendedAt: new Date(), internalNotes: reason },
      include: { store: { select: { name: true } } },
    });
    await Promise.all([
      logActivity(admin.id, "vendor.suspended", vendorId, { reason }),
      notifyVendorUser(vendorId, "Account Suspended", `Your vendor account has been suspended. Reason: ${reason}`),
    ]);
    revalidatePath("/admin/vendors");
    revalidatePath(`/admin/vendors/${vendorId}`);
    return { success: true, message: `${vendor.store?.name ?? "Vendor"} suspended.` };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to suspend vendor." };
  }
}

export async function reactivateVendorAction(vendorId: string): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const vendor = await db.vendorProfile.update({
      where: { id: vendorId },
      data: { status: VendorStatus.ACTIVE, suspendedAt: null, internalNotes: null },
      include: { store: { select: { name: true } } },
    });
    await Promise.all([
      logActivity(admin.id, "vendor.reactivated", vendorId),
      notifyVendorUser(vendorId, "Account Reactivated ✓", "Your vendor account has been reactivated. You can now list and sell products again."),
    ]);
    revalidatePath("/admin/vendors");
    revalidatePath(`/admin/vendors/${vendorId}`);
    return { success: true, message: `${vendor.store?.name ?? "Vendor"} reactivated.` };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to reactivate vendor." };
  }
}

// ── Edit vendor ───────────────────────────────────────────────────────────────

const editVendorSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  storeName: z.string().min(2).optional(),
  internalNotes: z.string().optional(),
  commissionValue: z.coerce.number().min(0).max(100).optional(),
  postexPickupCode: z.string().nullable().optional(),
  postexReturnCode: z.string().nullable().optional(),
});

export async function editVendorAction(vendorId: string, data: z.infer<typeof editVendorSchema>): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const parsed = editVendorSchema.safeParse(data);
    if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

    const vendor = await db.vendorProfile.findUnique({
      where: { id: vendorId },
      include: { user: true, store: true },
    });
    if (!vendor) return { success: false, error: "Vendor not found." };

    await db.$transaction([
      db.user.update({
        where: { id: vendor.userId },
        data: { name: parsed.data.name, email: parsed.data.email, phone: parsed.data.phone },
      }),
      db.vendorProfile.update({
        where: { id: vendorId },
        data: {
          internalNotes: parsed.data.internalNotes,
          ...(parsed.data.commissionValue !== undefined
            ? { commissionValue: parsed.data.commissionValue }
            : {}),
          ...(parsed.data.postexPickupCode !== undefined
            ? { postexPickupCode: parsed.data.postexPickupCode }
            : {}),
          ...(parsed.data.postexReturnCode !== undefined
            ? { postexReturnCode: parsed.data.postexReturnCode }
            : {}),
        },
      }),
      ...(parsed.data.storeName && vendor.store
        ? [db.store.update({ where: { id: vendor.store.id }, data: { name: parsed.data.storeName } })]
        : []),
    ]);

    await logActivity(admin.id, "vendor.edited", vendorId, { fields: Object.keys(parsed.data) });
    revalidatePath("/admin/vendors");
    revalidatePath(`/admin/vendors/${vendorId}`);
    return { success: true, message: "Vendor updated successfully." };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to update vendor." };
  }
}

// ── Delete vendor ─────────────────────────────────────────────────────────────

export async function deleteVendorAction(vendorId: string): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const vendor = await db.vendorProfile.findUnique({
      where: { id: vendorId },
      include: { user: { select: { id: true, name: true } }, store: { select: { name: true } } },
    });
    if (!vendor) return { success: false, error: "Vendor not found." };

    // Delete user cascades to vendorProfile, store, products, etc. via Prisma onDelete: Cascade
    await db.user.delete({ where: { id: vendor.userId } });
    await logActivity(admin.id, "vendor.deleted", vendorId, { name: vendor.user.name, storeName: vendor.store?.name });

    revalidatePath("/admin/vendors");
    return { success: true, message: `${vendor.store?.name ?? vendor.user.name} deleted permanently.` };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to delete vendor." };
  }
}

// ── Bulk actions ──────────────────────────────────────────────────────────────

export type BulkAction = "approve" | "reject" | "suspend" | "activate" | "delete";

export async function bulkVendorAction(vendorIds: string[], action: BulkAction): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    if (!vendorIds.length) return { success: false, error: "No vendors selected." };

    if (action === "delete") {
      const vendors = await db.vendorProfile.findMany({
        where: { id: { in: vendorIds } },
        select: { userId: true },
      });
      await db.user.deleteMany({ where: { id: { in: vendors.map((v) => v.userId) } } });
    } else {
      const statusMap: Record<Exclude<BulkAction, "delete">, VendorStatus> = {
        approve: VendorStatus.ACTIVE,
        reject: VendorStatus.REJECTED,
        suspend: VendorStatus.SUSPENDED,
        activate: VendorStatus.ACTIVE,
      };
      await db.vendorProfile.updateMany({
        where: { id: { in: vendorIds } },
        data: {
          status: statusMap[action as Exclude<BulkAction, "delete">],
          ...(action === "approve" ? { approvedAt: new Date() } : {}),
          ...(action === "suspend" ? { suspendedAt: new Date() } : {}),
        },
      });
    }

    await logActivity(admin.id, `vendor.bulk.${action}`, "bulk", { ids: vendorIds, count: vendorIds.length });
    revalidatePath("/admin/vendors");
    return { success: true, message: `${vendorIds.length} vendors — ${action} done.` };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : `Bulk ${action} failed.` };
  }
}

// ── Subscription assignment ───────────────────────────────────────────────────

export async function assignSubscriptionAction(vendorId: string, planId: string): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const plan = await db.membershipPlan.findUnique({ where: { id: planId } });
    if (!plan) return { success: false, error: "Plan not found." };

    await db.vendorSubscription.create({
      data: {
        vendorId,
        planId,
        status: "ACTIVE",
        startsAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });

    await Promise.all([
      logActivity(admin.id, "vendor.subscription.assigned", vendorId, { planName: plan.name }),
      notifyVendorUser(vendorId, "Subscription Assigned", `You have been assigned the "${plan.name}" membership plan.`),
    ]);
    revalidatePath(`/admin/vendors/${vendorId}`);
    return { success: true, message: `${plan.name} plan assigned.` };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to assign subscription." };
  }
}

// ── Messaging ─────────────────────────────────────────────────────────────────

export async function sendMessageToVendorAction(
  vendorUserId: string,
  body: string,
): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    if (!body.trim()) return { success: false, error: "Message cannot be empty." };

    await db.message.create({
      data: {
        senderId: admin.id,
        receiverId: vendorUserId,
        body: body.trim(),
      },
    });

    await db.notification.create({
      data: {
        userId: vendorUserId,
        type: NotificationType.SYSTEM,
        title: "New message from Admin",
        body: body.length > 80 ? body.slice(0, 80) + "…" : body,
      },
    });

    revalidatePath(`/admin/vendors`);
    return { success: true, message: "Message sent." };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to send message." };
  }
}

// ── Notify admin of new vendor registration ────────────────────────────────────
// Called from vendor registration flow (can be triggered from register action)

export async function notifyAdminNewVendor(
  vendorId: string,
  storeName: string,
  ownerName: string,
  ownerEmail: string,
  ownerPhone?: string | null,
) {
  await notifyAdmin(
    "New Vendor Application",
    `${ownerName} applied to open "${storeName}". Review and approve or reject.`,
    { vendorId },
  );
  const adminEmail = process.env.ADMIN_EMAIL;
  if (adminEmail) {
    void sendEmail({
      to: adminEmail,
      subject: `New Vendor Application: ${storeName} — ZainStore.pk`,
      html: vendorSignupAdminEmailHtml({ vendorName: ownerName, storeName, email: ownerEmail, phone: ownerPhone }),
    });
  }
}

// ── Mark notification read ────────────────────────────────────────────────────

export async function markNotificationRead(notificationId: string): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    await db.notification.updateMany({
      where: { id: notificationId, userId: admin.id },
      data: { readAt: new Date() },
    });
    revalidatePath("/admin");
    return { success: true, message: "Marked as read." };
  } catch (e) {
    return { success: false, error: "Failed." };
  }
}

export async function markAllNotificationsRead(): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    await db.notification.updateMany({
      where: { userId: admin.id, readAt: null },
      data: { readAt: new Date() },
    });
    revalidatePath("/admin");
    return { success: true, message: "All notifications marked as read." };
  } catch (e) {
    return { success: false, error: "Failed." };
  }
}
