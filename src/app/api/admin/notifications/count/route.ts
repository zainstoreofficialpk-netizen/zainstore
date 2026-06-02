import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth/config";
import { getUnreadNotificationCount, getAdminNotifications } from "@/lib/admin/vendor-data";
import { getAdminUser } from "@/lib/admin/vendor-data";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ count: 0, notifications: [] });
  if (session.user.role !== "SUPER_ADMIN") return NextResponse.json({ count: 0, notifications: [] });

  const adminUser = await getAdminUser();
  if (!adminUser) return NextResponse.json({ count: 0, notifications: [] });

  const [count, notifications] = await Promise.all([
    getUnreadNotificationCount(adminUser.id),
    getAdminNotifications(adminUser.id, 10),
  ]);

  return NextResponse.json({ count, notifications });
}
