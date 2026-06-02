"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, Check } from "lucide-react";
import { toast } from "sonner";

type Notification = {
  id: string;
  title: string;
  body: string;
  type: string;
  readAt: string | null;
  createdAt: string;
};

type MarkAction = (id?: string) => Promise<{ success: boolean; message?: string; error?: string }>;

const POLL_INTERVAL = 30_000;

export function NotificationBell({
  apiPath,
  markOneAction,
  markAllAction,
  allHref,
}: {
  apiPath: string;
  markOneAction: MarkAction;
  markAllAction: MarkAction;
  allHref: string;
}) {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [prevCount, setPrevCount] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);

  async function fetchNotifications() {
    try {
      const res = await fetch(apiPath, { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      const newCount: number = data.count ?? 0;

      if (newCount > prevCount && prevCount > 0) {
        const newest: Notification | undefined = data.notifications?.[0];
        if (newest) {
          toast(newest.title, { description: newest.body, icon: "🔔" });
          try {
            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.value = 880;
            gain.gain.setValueAtTime(0.12, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.35);
          } catch { /* AudioContext unavailable */ }
        }
      }

      setPrevCount(newCount);
      setCount(newCount);
      setNotifications(data.notifications ?? []);
    } catch { /* ignore */ }
  }

  useEffect(() => {
    fetchNotifications();
    const id = setInterval(fetchNotifications, POLL_INTERVAL);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  async function handleMarkAll() {
    const r = await markAllAction();
    if (r.success) {
      setCount(0);
      setNotifications((p) => p.map((n) => ({ ...n, readAt: new Date().toISOString() })));
      toast.success("All notifications marked as read.");
    }
  }

  async function handleMarkOne(id: string) {
    await markOneAction(id);
    setNotifications((p) =>
      p.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n)),
    );
    setCount((c) => Math.max(0, c - 1));
  }

  return (
    <div ref={panelRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative grid size-9 place-items-center rounded-md border border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-50 hover:text-zinc-700"
        aria-label="Notifications"
      >
        <Bell size={16} />
        {count > 0 && (
          <span className="absolute -right-1 -top-1 flex min-w-[18px] items-center justify-center rounded-full bg-accent-500 px-1 py-0.5 text-[10px] font-bold text-white leading-none">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-80 rounded-xl border border-zinc-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
            <span className="font-semibold text-zinc-900">Notifications</span>
            {count > 0 && (
              <button
                onClick={handleMarkAll}
                className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700"
              >
                <Check size={12} /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-zinc-50">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-sm text-zinc-400">No notifications</div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`flex items-start gap-3 px-4 py-3 hover:bg-zinc-50 ${!n.readAt ? "bg-brand-50/30" : ""}`}
                >
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm ${!n.readAt ? "font-semibold text-zinc-900" : "text-zinc-700"}`}>
                      {n.title}
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-500 leading-relaxed">{n.body}</p>
                    <p className="mt-1 text-xs text-zinc-300">
                      {new Date(n.createdAt).toLocaleString("en-PK", {
                        day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                      })}
                    </p>
                  </div>
                  {!n.readAt && (
                    <button
                      onClick={() => handleMarkOne(n.id)}
                      className="mt-1 shrink-0 text-zinc-300 hover:text-zinc-500"
                      title="Mark as read"
                    >
                      <Check size={14} />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="border-t border-zinc-100 px-4 py-2 text-center">
            <a
              href={allHref}
              className="text-xs text-brand-600 hover:underline"
              onClick={() => setOpen(false)}
            >
              View all notifications
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
