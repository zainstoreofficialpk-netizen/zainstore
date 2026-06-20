"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { ChevronDown, Check, X, CreditCard, MessageSquare, ChevronRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { OrderStatus, PaymentStatus } from "@prisma/client";

import { Input } from "@/components/ui/input";
import { updateOrderStatus, updatePaymentStatus, addOrderNote } from "@/lib/admin/order-actions";

const NEXT_STATUSES: Record<string, OrderStatus[]> = {
  PENDING:            [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
  PROCESSING:         [OrderStatus.READY_FOR_DISPATCH, OrderStatus.SHIPPED, OrderStatus.CANCELLED],
  READY_FOR_DISPATCH: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
  SHIPPED:            [OrderStatus.OUT_FOR_DELIVERY, OrderStatus.DELIVERED, OrderStatus.CANCELLED],
  OUT_FOR_DELIVERY:   [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
  DELIVERED:          [],
  CANCELLED:          [],
  REFUNDED:           [],
};

const STATUS_LABEL: Record<string, string> = {
  PROCESSING:         "Mark Processing",
  READY_FOR_DISPATCH: "Ready for Dispatch",
  SHIPPED:            "Mark Shipped",
  OUT_FOR_DELIVERY:   "Out for Delivery",
  DELIVERED:          "Mark Delivered",
};

export const STATUS_TONE: Record<string, "success" | "warning" | "danger" | "accent" | "muted"> = {
  PENDING: "warning", PROCESSING: "accent", SHIPPED: "accent",
  DELIVERED: "success", CANCELLED: "danger", REFUNDED: "muted",
  READY_FOR_DISPATCH: "accent", OUT_FOR_DELIVERY: "accent",
};

export const PAY_TONE: Record<string, "success" | "warning" | "danger" | "muted"> = {
  PAID: "success", PENDING: "warning", FAILED: "danger", REFUNDED: "muted", AUTHORIZED: "warning",
};

export function OrderStatusUpdater({
  orderId,
  orderNumber,
  currentStatus,
  paymentStatus,
}: {
  orderId: string;
  orderNumber: string;
  currentStatus: string;
  paymentStatus: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [showNote, setShowNote] = useState(false);
  const [note, setNote] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const next = NEXT_STATUSES[currentStatus] ?? [];
  const hasActions = next.length > 0 || (paymentStatus === "PENDING" && currentStatus !== "CANCELLED");

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setShowNote(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  function handleStatusUpdate(newStatus: OrderStatus) {
    setOpen(false);
    startTransition(async () => {
      const r = await updateOrderStatus(orderId, newStatus);
      if (r.success) toast.success(r.message);
      else toast.error(r.error);
    });
  }

  function handleMarkPaid() {
    setOpen(false);
    startTransition(async () => {
      const r = await updatePaymentStatus(orderId, PaymentStatus.PAID);
      if (r.success) toast.success(r.message);
      else toast.error(r.error);
    });
  }

  function handleNote(e: React.FormEvent) {
    e.preventDefault();
    if (!note.trim()) return;
    startTransition(async () => {
      const r = await addOrderNote(orderId, note);
      if (r.success) { toast.success(r.message); setNote(""); setShowNote(false); setOpen(false); }
      else toast.error(r.error);
    });
  }

  if (!hasActions && currentStatus === "DELIVERED") {
    return <span className="text-xs text-zinc-300">—</span>;
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={isPending}
        className="flex items-center gap-1 rounded border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 shadow-sm"
      >
        {isPending ? <Loader2 size={11} className="animate-spin" /> : null}
        Actions
        <ChevronDown size={11} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-1 w-44 rounded-lg border border-zinc-200 bg-white shadow-lg py-1">

          {/* Advance status buttons */}
          {next
            .filter((s) => s !== OrderStatus.CANCELLED)
            .map((s) => (
              <button
                key={s}
                onClick={() => handleStatusUpdate(s)}
                disabled={isPending}
                className="flex w-full items-center gap-2 px-3 py-2 text-xs text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
              >
                <ChevronRight size={11} />
                {STATUS_LABEL[s] ?? s}
              </button>
            ))}

          {/* Cancel */}
          {next.includes(OrderStatus.CANCELLED) && (
            <button
              onClick={() => handleStatusUpdate(OrderStatus.CANCELLED)}
              disabled={isPending}
              className="flex w-full items-center gap-2 px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 disabled:opacity-50"
            >
              <X size={11} /> Cancel Order
            </button>
          )}

          {/* Mark Paid */}
          {paymentStatus === "PENDING" && currentStatus !== "CANCELLED" && (
            <>
              {next.length > 0 && <div className="my-1 border-t border-zinc-100" />}
              <button
                onClick={handleMarkPaid}
                disabled={isPending}
                className="flex w-full items-center gap-2 px-3 py-2 text-xs text-brand-700 hover:bg-brand-50 disabled:opacity-50"
              >
                <CreditCard size={11} /> Mark Paid
              </button>
            </>
          )}

          {/* Add Note */}
          <div className="my-1 border-t border-zinc-100" />
          {!showNote ? (
            <button
              onClick={() => setShowNote(true)}
              className="flex w-full items-center gap-2 px-3 py-2 text-xs text-zinc-500 hover:bg-zinc-50"
            >
              <MessageSquare size={11} /> Add Note
            </button>
          ) : (
            <form onSubmit={handleNote} className="px-3 py-2 space-y-1.5">
              <Input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add note…"
                className="h-7 text-xs"
                autoFocus
              />
              <div className="flex gap-1">
                <button
                  type="submit"
                  disabled={isPending || !note.trim()}
                  className="flex flex-1 items-center justify-center gap-1 rounded border border-emerald-200 py-1 text-[11px] text-emerald-600 hover:bg-emerald-50 disabled:opacity-50"
                >
                  <Check size={11} /> Save
                </button>
                <button
                  type="button"
                  onClick={() => setShowNote(false)}
                  className="grid size-7 place-items-center rounded border border-zinc-200 text-zinc-400 hover:bg-zinc-50"
                >
                  <X size={11} />
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
