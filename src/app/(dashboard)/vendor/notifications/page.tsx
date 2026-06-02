import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { Bell, ShoppingCart, MessageSquare, WalletCards, ShieldCheck, Info } from "lucide-react";

import { authOptions } from "@/lib/auth/config";
import { getVendorNotifications } from "@/lib/vendor/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { VendorNotificationsClient } from "@/components/vendor/vendor-notifications-client";

export default async function VendorNotificationsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const notifications = await getVendorNotifications(session.user.id, 50);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-zinc-950">Notifications</h2>
        <p className="mt-0.5 text-sm text-zinc-400">
          All activity alerts for your store.
        </p>
      </div>
      <VendorNotificationsClient notifications={notifications} />
    </div>
  );
}
