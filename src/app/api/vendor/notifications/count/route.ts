import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth/config";
import { getVendorNotifications, getVendorUnreadNotificationCount } from "@/lib/vendor/data";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ count: 0, notifications: [] });

  const [count, notifications] = await Promise.all([
    getVendorUnreadNotificationCount(session.user.id),
    getVendorNotifications(session.user.id, 10),
  ]);

  return NextResponse.json({ count, notifications });
}
