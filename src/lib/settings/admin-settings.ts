"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";

type ActionResult = { success: true; message: string } | { success: false; error: string };

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "SUPER_ADMIN") throw new Error("Unauthorized");
  return session.user;
}

type SettingEntry = { value: unknown; group: string; description?: string };

export async function savePlatformSettings(
  entries: Record<string, SettingEntry>,
): Promise<ActionResult> {
  await requireAdmin();
  for (const [key, { value, group, description }] of Object.entries(entries)) {
    await db.settings.upsert({
      where: { key },
      update: { value: value as never },
      create: { key, value: value as never, group, description: description ?? "" },
    });
  }
  revalidatePath("/admin/settings");
  return { success: true, message: "Settings saved." };
}

export async function saveAdminNotificationPreferences(
  prefs: Record<string, boolean>,
): Promise<ActionResult> {
  const user = await requireAdmin();
  await db.user.update({ where: { id: user.id }, data: { notificationPreferences: prefs } });
  revalidatePath("/admin/settings");
  return { success: true, message: "Notification preferences saved." };
}
