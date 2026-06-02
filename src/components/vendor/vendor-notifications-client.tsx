"use client";

import { useTransition, useState } from "react";
import { Bell, Check, MessageSquare, ShoppingCart, ShieldCheck, WalletCards, Info } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { markVendorNotificationRead, markAllVendorNotificationsRead } from "@/lib/vendor/actions";

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string;
  readAt: Date | null;
  createdAt: Date;
};

const TYPE_ICON: Record<string, React.ReactNode> = {
  ORDER:      <ShoppingCart size={16} />,
  SYSTEM:     <MessageSquare size={16} />,
  VENDOR:     <ShieldCheck size={16} />,
  WITHDRAWAL: <WalletCards size={16} />,
  REFUND:     <WalletCards size={16} />,
  REVIEW:     <Info size={16} />,
  SUPPORT:    <Info size={16} />,
};

const TYPE_TONE: Record<string, "success" | "warning" | "accent" | "muted"> = {
  ORDER:      "success",
  SYSTEM:     "accent",
  VENDOR:     "warning",
  WITHDRAWAL: "accent",
  REFUND:     "warning",
};

export function VendorNotificationsClient({ notifications: initial }: { notifications: Notification[] }) {
  const [notifications, setNotifications] = useState(initial);
  const [isPending, startTransition] = useTransition();

  const unread = notifications.filter((n) => !n.readAt).length;

  function handleMarkOne(id: string) {
    startTransition(async () => {
      const r = await markVendorNotificationRead(id);
      if (r.success) {
        setNotifications((p) => p.map((n) => n.id === id ? { ...n, readAt: new Date() } : n));
      } else {
        toast.error(r.error);
      }
    });
  }

  function handleMarkAll() {
    startTransition(async () => {
      const r = await markAllVendorNotificationsRead();
      if (r.success) {
        setNotifications((p) => p.map((n) => ({ ...n, readAt: new Date() })));
        toast.success("All notifications marked as read.");
      } else {
        toast.error(r.error);
      }
    });
  }

  return (
    <Card>
      <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-zinc-900">All Notifications</span>
          {unread > 0 && <Badge tone="accent">{unread} unread</Badge>}
        </div>
        {unread > 0 && (
          <Button size="sm" variant="outline" onClick={handleMarkAll} disabled={isPending} className="h-8 gap-1.5">
            <Check size={13} /> Mark all read
          </Button>
        )}
      </div>

      <CardContent className="p-0">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-zinc-400">
            <Bell size={32} className="opacity-20" />
            <p className="text-sm">No notifications yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-50">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`flex items-start gap-4 px-5 py-4 transition-colors ${!n.readAt ? "bg-brand-50/30" : "hover:bg-zinc-50/60"}`}
              >
                <span className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full ${
                  !n.readAt ? "bg-brand-100 text-brand-600" : "bg-zinc-100 text-zinc-500"
                }`}>
                  {TYPE_ICON[n.type] ?? <Bell size={16} />}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <p className={`text-sm ${!n.readAt ? "font-semibold text-zinc-900" : "text-zinc-700"}`}>
                      {n.title}
                    </p>
                    <Badge tone={TYPE_TONE[n.type] ?? "muted"} className="shrink-0 text-xs">
                      {n.type}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-sm text-zinc-500 leading-relaxed">{n.body}</p>
                  <p className="mt-1.5 text-xs text-zinc-400">
                    {new Date(n.createdAt).toLocaleString("en-PK", {
                      day: "numeric", month: "short", year: "numeric",
                      hour: "2-digit", minute: "2-digit",
                    })}
                  </p>
                </div>

                {!n.readAt && (
                  <button
                    onClick={() => handleMarkOne(n.id)}
                    disabled={isPending}
                    className="mt-1 shrink-0 rounded-md p-1 text-zinc-300 hover:bg-zinc-100 hover:text-zinc-600"
                    title="Mark as read"
                  >
                    <Check size={15} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
