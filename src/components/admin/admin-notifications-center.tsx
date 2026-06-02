"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bell, Check, ShoppingCart, MessageSquare, WalletCards, Store, ShieldCheck, Info, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { markAllNotificationsRead, markNotificationRead } from "@/lib/admin/vendor-actions";

type Notification = {
  id: string; type: string; title: string; body: string;
  data: any; readAt: Date | null; createdAt: Date;
};

const TYPE_ICON: Record<string, React.ReactNode> = {
  ORDER: <ShoppingCart size={15} />, SYSTEM: <MessageSquare size={15} />,
  VENDOR: <Store size={15} />, WITHDRAWAL: <WalletCards size={15} />,
  REFUND: <WalletCards size={15} />, REVIEW: <ShieldCheck size={15} />,
  SUPPORT: <Info size={15} />,
};
const TYPE_TONE: Record<string, "success"|"warning"|"accent"|"muted"|"danger"> = {
  ORDER: "success", VENDOR: "warning", WITHDRAWAL: "accent", REFUND: "danger", SYSTEM: "muted",
};

function getActionUrl(notification: Notification): string | null {
  const data = notification.data as Record<string, string> | null;
  if (data?.url) return data.url;
  if (data?.vendorId) return `/admin/vendors/${data.vendorId}`;
  if (data?.productId) return `/admin/products`;
  if (notification.type === "ORDER") return "/admin/orders";
  if (notification.type === "WITHDRAWAL") return "/admin/withdrawals";
  if (notification.type === "REFUND") return "/admin/refunds";
  if (notification.type === "VENDOR") return "/admin/vendors";
  return null;
}

export function AdminNotificationsCenter({ notifications: initial, total, page, unreadCount }: {
  notifications: Notification[]; total: number; page: number; unreadCount: number;
}) {
  const router = useRouter();
  const [notifications, setNotifications] = useState(initial);
  const [isPending, startTransition] = useTransition();
  const LIMIT = 20;

  function handleClick(n: Notification) {
    // Mark read
    if (!n.readAt) {
      startTransition(async () => {
        await markNotificationRead(n.id);
        setNotifications((prev) => prev.map((x) => x.id === n.id ? { ...x, readAt: new Date() } : x));
      });
    }
    // Navigate
    const url = getActionUrl(n);
    if (url) router.push(url);
  }

  function handleMarkAll() {
    startTransition(async () => {
      const r = await markAllNotificationsRead();
      if (r.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, readAt: new Date() })));
        toast.success("All notifications marked as read.");
      }
    });
  }

  const unread = notifications.filter((n) => !n.readAt).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-zinc-950">Notification Center</h2>
          <p className="mt-0.5 text-sm text-zinc-400">{total} total · {unreadCount} unread</p>
        </div>
        <div className="flex gap-3">
          {/* Filter tabs */}
          <div className="flex gap-1 border border-zinc-200 rounded-lg p-0.5">
            {[["All",""], ["Unread","unread"], ["Read","read"]].map(([label, val]) => (
              <a key={val} href={val ? `/admin/notifications?read=${val}` : "/admin/notifications"}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors bg-brand-500 text-white`}
                style={typeof window !== "undefined" && new URLSearchParams(window.location.search).get("read") === val ? {} : { background: "transparent", color: "#71717a" }}>
                {label}
              </a>
            ))}
          </div>
          {unread > 0 && (
            <Button size="sm" variant="outline" onClick={handleMarkAll} disabled={isPending} className="gap-1.5 h-9">
              <Check size={13} /> Mark all read
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {notifications.length === 0
            ? <EmptyState icon="🔔" title="No notifications" description="You're all caught up! Notifications appear here when activity occurs." />
            : <div className="divide-y divide-zinc-50">
                {notifications.map((n) => {
                  const url = getActionUrl(n);
                  return (
                    <div key={n.id}
                      onClick={() => handleClick(n)}
                      className={`flex items-start gap-4 px-5 py-4 transition-colors ${url ? "cursor-pointer hover:bg-zinc-50" : ""} ${!n.readAt ? "bg-brand-50/30" : ""}`}>
                      <span className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full ${!n.readAt ? "bg-brand-100 text-brand-600" : "bg-zinc-100 text-zinc-500"}`}>
                        {TYPE_ICON[n.type] ?? <Bell size={15} />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm ${!n.readAt ? "font-semibold text-zinc-900" : "text-zinc-700"}`}>{n.title}</p>
                          <div className="flex shrink-0 items-center gap-2">
                            <Badge tone={TYPE_TONE[n.type] ?? "muted"} className="text-[10px]">{n.type}</Badge>
                            {!n.readAt && <span className="size-2 rounded-full bg-brand-500" />}
                          </div>
                        </div>
                        <p className="mt-0.5 text-sm text-zinc-500 leading-relaxed">{n.body}</p>
                        <div className="mt-1.5 flex items-center gap-3">
                          <p className="text-xs text-zinc-400">{new Date(n.createdAt).toLocaleString("en-PK",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})}</p>
                          {url && <span className="text-xs text-brand-500">Click to open →</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>}
        </CardContent>
      </Card>

      {total > LIMIT && (
        <div className="flex items-center justify-between text-xs text-zinc-500">
          <span>Page {page} of {Math.ceil(total/LIMIT)}</span>
          <div className="flex gap-2">
            {page > 1 && <a href={`/admin/notifications?page=${page-1}`} className="rounded border border-zinc-200 px-3 py-1 hover:bg-zinc-50">← Prev</a>}
            {page < Math.ceil(total/LIMIT) && <a href={`/admin/notifications?page=${page+1}`} className="rounded border border-zinc-200 px-3 py-1 hover:bg-zinc-50">Next →</a>}
          </div>
        </div>
      )}
    </div>
  );
}
