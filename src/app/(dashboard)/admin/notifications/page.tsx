import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { getAdminUser } from "@/lib/admin/vendor-data";
import { AdminNotificationsCenter } from "@/components/admin/admin-notifications-center";

export default async function AdminNotificationsPage({ searchParams }: { searchParams: { type?: string; read?: string; page?: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "SUPER_ADMIN") redirect("/login");

  const admin = await getAdminUser();
  if (!admin) redirect("/admin");

  const page = Number(searchParams.page ?? "1");
  const LIMIT = 20;
  const typeFilter = searchParams.type;
  const readFilter = searchParams.read;

  const where = {
    userId: admin.id,
    ...(typeFilter ? { type: typeFilter as any } : {}),
    ...(readFilter === "unread" ? { readAt: null } : readFilter === "read" ? { readAt: { not: null } } : {}),
  };

  const [notifications, total, unreadCount] = await Promise.all([
    db.notification.findMany({ where, skip: (page - 1) * LIMIT, take: LIMIT, orderBy: { createdAt: "desc" } }),
    db.notification.count({ where }),
    db.notification.count({ where: { userId: admin.id, readAt: null } }),
  ]);

  return <AdminNotificationsCenter notifications={notifications} total={total} page={page} unreadCount={unreadCount} />;
}
