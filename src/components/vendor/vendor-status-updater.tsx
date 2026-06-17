"use client";

import { useState, useTransition } from "react";
import { ChevronRight, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { OrderStatus } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { vendorUpdateOrderStatus } from "@/lib/vendor/order-actions";

const NEXT: Record<string, OrderStatus[]> = {
  PENDING:    [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
  PROCESSING: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
  SHIPPED:    [OrderStatus.CANCELLED],
  DELIVERED:  [],
  CANCELLED:  [],
  REFUNDED:   [],
};

const TONE: Record<string, "success" | "warning" | "danger" | "accent" | "muted"> = {
  PENDING: "warning", PROCESSING: "accent", SHIPPED: "accent",
  DELIVERED: "success", CANCELLED: "danger", REFUNDED: "muted",
};

const LABELS: Record<string, string> = {
  PROCESSING: "Mark Processing",
  SHIPPED: "Mark Shipped",
  CANCELLED: "Cancel Order",
};

export function VendorStatusUpdater({
  orderId,
  initialStatus,
}: {
  orderId: string;
  initialStatus: string;
}) {
  const [status, setStatus] = useState(initialStatus);
  const [isPending, startTransition] = useTransition();

  const next = NEXT[status] ?? [];

  function handleUpdate(newStatus: OrderStatus) {
    startTransition(async () => {
      const result = await vendorUpdateOrderStatus(orderId, newStatus);
      if (result.success) {
        setStatus(newStatus);
        toast.success(result.message);
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="flex items-center gap-2">
        <span className="text-xs text-zinc-500 font-medium">Status:</span>
        <Badge tone={TONE[status] ?? "muted"}>{status}</Badge>
      </div>

      {isPending ? (
        <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
      ) : (
        <div className="flex items-center gap-1.5">
          {next
            .filter((s) => s !== OrderStatus.CANCELLED)
            .map((s) => (
              <button
                key={s}
                onClick={() => handleUpdate(s)}
                disabled={isPending}
                className="flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors disabled:opacity-50"
              >
                <ChevronRight className="w-3 h-3" />
                {LABELS[s] ?? s}
              </button>
            ))}

          {next.includes(OrderStatus.CANCELLED) && (
            <button
              onClick={() => handleUpdate(OrderStatus.CANCELLED)}
              disabled={isPending}
              className="flex items-center gap-1 rounded-md border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-100 transition-colors disabled:opacity-50"
            >
              <X className="w-3 h-3" /> Cancel Order
            </button>
          )}

          {next.length === 0 && (
            <span className="text-xs text-zinc-400 italic">No further actions available</span>
          )}
        </div>
      )}

      {status !== "DELIVERED" && status !== "CANCELLED" && status !== "REFUNDED" && (
        <p className="w-full text-xs text-zinc-400 mt-1">
          Note: Only admin can mark orders as Delivered.
        </p>
      )}
    </div>
  );
}
