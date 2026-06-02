"use client";

import { NotificationBell } from "@/components/dashboard/notification-bell";
import { markVendorNotificationRead, markAllVendorNotificationsRead } from "@/lib/vendor/actions";

export function VendorNotificationBell() {
  return (
    <NotificationBell
      apiPath="/api/vendor/notifications/count"
      allHref="/vendor/notifications"
      markOneAction={(id) => markVendorNotificationRead(id!)}
      markAllAction={() => markAllVendorNotificationsRead()}
    />
  );
}
