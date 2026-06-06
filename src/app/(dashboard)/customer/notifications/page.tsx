import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { Bell, Check, Package, RefreshCcw, Star, ShieldCheck } from "lucide-react";

import { authOptions } from "@/lib/auth/config";
import { getCustomerNotifications, markAllCustomerNotificationsRead } from "@/lib/customer/notification-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NotificationsClient } from "@/components/customer/notifications-client";

export default async function CustomerNotificationsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "CUSTOMER") redirect("/login");

  const notifications = await getCustomerNotifications(session.user.id, 50);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-zinc-950">Notifications</h2>
          <p className="mt-0.5 text-sm text-zinc-400">
            Order updates, account alerts, and important messages.
          </p>
        </div>
      </div>

      <NotificationsClient notifications={notifications} />
    </div>
  );
}
