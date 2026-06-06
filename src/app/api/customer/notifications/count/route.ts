import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth/config";
import { getCustomerNotifications, getCustomerUnreadCount } from "@/lib/customer/notification-actions";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "CUSTOMER") {
    return NextResponse.json({ count: 0, notifications: [] });
  }

  const [count, notifications] = await Promise.all([
    getCustomerUnreadCount(session.user.id),
    getCustomerNotifications(session.user.id, 15),
  ]);

  return NextResponse.json({ count, notifications });
}
