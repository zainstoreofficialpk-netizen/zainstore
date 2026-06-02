"use client";

import { useState, useTransition } from "react";
import { ChevronRight, Check, X, CreditCard, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { OrderStatus, PaymentStatus } from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateOrderStatus, updatePaymentStatus, addOrderNote } from "@/lib/admin/order-actions";

// ── Valid next statuses (mirrors server-side VALID_TRANSITIONS) ───────────────
const NEXT_STATUSES: Record<string, OrderStatus[]> = {
  PENDING:    [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
  PROCESSING: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
  SHIPPED:    [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
  DELIVERED:  [],
  CANCELLED:  [],
  REFUNDED:   [],
};

const STATUS_TONE: Record<string, "success" | "warning" | "danger" | "accent" | "muted"> = {
  PENDING: "warning", PROCESSING: "accent", SHIPPED: "accent",
  DELIVERED: "success", CANCELLED: "danger", REFUNDED: "muted",
};

const PAY_TONE: Record<string, "success" | "warning" | "danger" | "muted"> = {
  PAID: "success", PENDING: "warning", FAILED: "danger", REFUNDED: "muted", AUTHORIZED: "warning",
};

const STATUS_LABEL: Record<string, string> = {
  PROCESSING: "Mark Processing",
  SHIPPED:    "Mark Shipped",
  DELIVERED:  "Mark Delivered",
  CANCELLED:  "Cancel Order",
};

// ── Single row updater ────────────────────────────────────────────────────────

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
  const [showNote, setShowNote] = useState(false);
  const [note, setNote] = useState("");

  const next = NEXT_STATUSES[currentStatus] ?? [];

  function handleStatusUpdate(newStatus: OrderStatus) {
    startTransition(async () => {
      const r = await updateOrderStatus(orderId, newStatus);
      if (r.success) toast.success(r.message);
      else toast.error(r.error);
    });
  }

  function handleMarkPaid() {
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
      if (r.success) { toast.success(r.message); setNote(""); setShowNote(false); }
      else toast.error(r.error);
    });
  }

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-center gap-1">
        {/* Advance status */}
        {next
          .filter((s) => s !== OrderStatus.CANCELLED)
          .map((s) => (
            <button
              key={s}
              onClick={() => handleStatusUpdate(s)}
              disabled={isPending}
              className="flex items-center gap-1 rounded border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
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
            className="flex items-center gap-1 rounded border border-rose-200 bg-rose-50 px-2 py-1 text-[11px] font-medium text-rose-600 hover:bg-rose-100 disabled:opacity-50"
          >
            <X size={11} /> Cancel
          </button>
        )}

        {/* Mark Paid (if still pending payment) */}
        {paymentStatus === "PENDING" && currentStatus !== "CANCELLED" && (
          <button
            onClick={handleMarkPaid}
            disabled={isPending}
            className="flex items-center gap-1 rounded border border-brand-200 bg-brand-50 px-2 py-1 text-[11px] font-medium text-brand-700 hover:bg-brand-100 disabled:opacity-50"
          >
            <CreditCard size={11} /> Mark Paid
          </button>
        )}

        {/* Add note */}
        <button
          onClick={() => setShowNote((v) => !v)}
          className="flex items-center gap-1 rounded border border-zinc-200 px-2 py-1 text-[11px] text-zinc-500 hover:bg-zinc-50"
        >
          <MessageSquare size={11} /> Note
        </button>
      </div>

      {showNote && (
        <form onSubmit={handleNote} className="flex items-center gap-1.5">
          <Input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add note…"
            className="h-7 text-xs"
            autoFocus
          />
          <button
            type="submit"
            disabled={isPending || !note.trim()}
            className="grid size-7 place-items-center rounded border border-emerald-200 text-emerald-600 hover:bg-emerald-50 disabled:opacity-50"
          >
            <Check size={12} />
          </button>
          <button
            type="button"
            onClick={() => setShowNote(false)}
            className="grid size-7 place-items-center rounded border border-zinc-200 text-zinc-400 hover:bg-zinc-50"
          >
            <X size={12} />
          </button>
        </form>
      )}
    </div>
  );
}

// ── Re-export tones for the page ──────────────────────────────────────────────
export { STATUS_TONE, PAY_TONE };
