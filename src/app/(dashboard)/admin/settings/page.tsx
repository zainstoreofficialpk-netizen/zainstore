import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { AdminSettingsShell } from "@/components/admin/admin-settings-shell";

export const metadata = { title: "Settings — Admin" };

export default async function AdminSettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "SUPER_ADMIN") redirect("/login");

  const [user, platformSettings, activityLogs] = await Promise.all([
    db.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        image: true,
        emailVerified: true,
        notificationPreferences: true,
        twoFactorEnabled: true,
        createdAt: true,
      },
    }),
    db.settings.findMany({ orderBy: [{ group: "asc" }, { key: "asc" }] }),
    db.activityLog.findMany({
      where: { actorId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  if (!user) redirect("/login");

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-zinc-950">Settings</h2>
        <p className="mt-0.5 text-sm text-zinc-400">Manage your profile, platform configuration, and system preferences.</p>
      </div>

      <AdminSettingsShell
        user={{
          ...user,
          emailVerified: user.emailVerified?.toISOString() ?? null,
          notificationPreferences: (user.notificationPreferences as Record<string, boolean>) ?? null,
          createdAt: user.createdAt.toISOString(),
        }}
        platformSettings={platformSettings.map((s) => ({
          key: s.key,
          value: s.value,
          group: s.group,
          description: s.description ?? undefined,
        }))}
        activityLogs={activityLogs.map((log) => ({
          id: log.id,
          action: log.action,
          entity: log.entity,
          entityId: log.entityId,
          ipAddress: log.ipAddress,
          createdAt: log.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
