"use client";

import { NotificationBell } from "@/components/dashboard/notification-bell";
import { markAllNotificationsRead, markNotificationRead } from "@/lib/admin/vendor-actions";

export function AdminNotificationBell() {
  return (
    <NotificationBell
      apiPath="/api/admin/notifications/count"
      allHref="/admin/notifications"
      markOneAction={(id) => markNotificationRead(id!)}
      markAllAction={() => markAllNotificationsRead()}
    />
  );
}
