"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import type { LucideIcon } from "lucide-react";
import { Bell, Check, Package, Star, RefreshCcw, ShieldCheck, CreditCard } from "lucide-react";

import {
  markCustomerNotificationRead,
  markAllCustomerNotificationsRead,
} from "@/lib/customer/notification-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string;
  readAt: Date | null;
  createdAt: Date;
};

const TYPE_ICON: Record<string, LucideIcon> = {
  ORDER: Package,
  REVIEW: Star,
  REFUND: RefreshCcw,
  WITHDRAWAL: CreditCard,
  SUPPORT: ShieldCheck,
  SYSTEM: Bell,
};

const TYPE_COLOR: Record<string, string> = {
  ORDER:      "bg-brand-50 text-brand-600",
  REVIEW:     "bg-amber-50 text-amber-600",
  REFUND:     "bg-rose-50 text-rose-600",
  WITHDRAWAL: "bg-emerald-50 text-emerald-600",
  SUPPORT:    "bg-sky-50 text-sky-600",
  SYSTEM:     "bg-zinc-100 text-zinc-500",
};

export function NotificationsClient({ notifications: initial }: { notifications: Notification[] }) {
  const [notifications, setNotifications] = useState(initial);
  const [isPending, startTransition] = useTransition();

  const unreadCount = notifications.filter((n) => !n.readAt).length;

  function markOneRead(id: string) {
    startTransition(async () => {
      await markCustomerNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, readAt: new Date() } : n)),
      );
    });
  }

  function markAllRead() {
    startTransition(async () => {
      const r = await markAllCustomerNotificationsRead();
      if (r.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date() })));
        toast.success("All notifications marked as read.");
      }
    });
  }

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-zinc-200 py-20 text-center">
        <Bell size={32} className="text-zinc-300" />
        <p className="text-sm font-medium text-zinc-500">No notifications yet</p>
        <p className="text-xs text-zinc-400">Order updates and account alerts will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {unreadCount > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-zinc-500">{unreadCount} unread</p>
          <Button size="sm" variant="outline" onClick={markAllRead} disabled={isPending}>
            <Check size={12} className="mr-1.5" />
            Mark all read
          </Button>
        </div>
      )}

      <Card className="overflow-hidden">
        <div className="divide-y divide-zinc-100">
          {notifications.map((n) => {
            const Icon = TYPE_ICON[n.type] ?? Bell;
            const iconColor = TYPE_COLOR[n.type] ?? TYPE_COLOR.SYSTEM;
            const isUnread = !n.readAt;

            return (
              <div
                key={n.id}
                className={`flex items-start gap-4 px-5 py-4 transition-colors ${
                  isUnread ? "bg-brand-50/30 hover:bg-brand-50/50" : "hover:bg-zinc-50/60"
                }`}
              >
                <div className={`grid size-9 shrink-0 place-items-center rounded-full ${iconColor}`}>
                  <Icon size={15} />
                </div>

                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${isUnread ? "font-semibold text-zinc-900" : "text-zinc-700"}`}>
                    {n.title}
                    {isUnread && (
                      <span className="ml-2 inline-block size-1.5 rounded-full bg-brand-500 align-middle" />
                    )}
                  </p>
                  <p className="mt-0.5 text-xs text-zinc-500 leading-relaxed">{n.body}</p>
                  <p className="mt-1.5 text-[10px] text-zinc-400">
                    {new Date(n.createdAt).toLocaleString("en-PK", {
                      day: "numeric", month: "short", year: "numeric",
                      hour: "2-digit", minute: "2-digit",
                    })}
                  </p>
                </div>

                {isUnread && (
                  <button
                    onClick={() => markOneRead(n.id)}
                    disabled={isPending}
                    title="Mark as read"
                    className="mt-0.5 shrink-0 text-zinc-300 hover:text-brand-500 transition-colors disabled:opacity-40"
                  >
                    <Check size={15} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
