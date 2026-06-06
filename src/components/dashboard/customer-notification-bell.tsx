"use client";

import { NotificationBell } from "@/components/dashboard/notification-bell";
import {
  markCustomerNotificationRead,
  markAllCustomerNotificationsRead,
} from "@/lib/customer/notification-actions";

export function CustomerNotificationBell() {
  return (
    <NotificationBell
      apiPath="/api/customer/notifications/count"
      allHref="/customer/notifications"
      markOneAction={(id) => markCustomerNotificationRead(id!)}
      markAllAction={() => markAllCustomerNotificationsRead()}
    />
  );
}
