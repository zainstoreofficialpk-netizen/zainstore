import { Check, Package, Truck, MapPin, Clock, XCircle, RefreshCcw } from "lucide-react";
import { cn } from "@/lib/utils";

export type OrderStatusKey =
  | "PENDING"
  | "PROCESSING"
  | "READY_FOR_DISPATCH"
  | "SHIPPED"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED"
  | "REFUNDED";

type Step = {
  key: OrderStatusKey;
  label: string;
  description: string;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
};

const STEPS: Step[] = [
  { key: "PENDING",            label: "Order Placed",        description: "We received your order",         Icon: Package },
  { key: "PROCESSING",         label: "Vendor Processing",   description: "Seller is preparing your order", Icon: Clock },
  { key: "READY_FOR_DISPATCH", label: "Ready for Dispatch",  description: "Packed and ready to ship",       Icon: Package },
  { key: "SHIPPED",            label: "Dispatched",          description: "Your order is on the way",       Icon: Truck },
  { key: "OUT_FOR_DELIVERY",   label: "Out for Delivery",    description: "Arriving today",                 Icon: MapPin },
  { key: "DELIVERED",          label: "Delivered",           description: "Enjoy your purchase!",           Icon: Check },
];

const STEP_ORDER: Record<OrderStatusKey, number> = {
  PENDING:            0,
  PROCESSING:         1,
  READY_FOR_DISPATCH: 2,
  SHIPPED:            3,
  OUT_FOR_DELIVERY:   4,
  DELIVERED:          5,
  CANCELLED:          -1,
  REFUNDED:           -1,
};

type Props = {
  currentStatus: OrderStatusKey;
  timeline?: { status: string; note: string | null; createdAt: Date }[];
  compact?: boolean;
};

export function OrderTracker({ currentStatus, timeline = [], compact = false }: Props) {
  const isCancelled = currentStatus === "CANCELLED" || currentStatus === "REFUNDED";
  const currentStep = STEP_ORDER[currentStatus] ?? 0;

  if (isCancelled) {
    const Icon = currentStatus === "REFUNDED" ? RefreshCcw : XCircle;
    return (
      <div className="flex items-center gap-3 rounded-xl bg-rose-50 border border-rose-100 px-4 py-3">
        <Icon size={18} className="text-rose-500 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-rose-700">
            {currentStatus === "REFUNDED" ? "Order Refunded" : "Order Cancelled"}
          </p>
          {timeline.length > 0 && (
            <p className="text-xs text-rose-500">
              {new Date(timeline[timeline.length - 1].createdAt).toLocaleDateString("en-PK", {
                day: "numeric", month: "short", year: "numeric",
              })}
            </p>
          )}
        </div>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-1.5">
        {STEPS.map((step, i) => {
          const done = i < currentStep;
          const active = i === currentStep;
          return (
            <div key={step.key} className="flex items-center gap-1.5">
              <div
                className={cn(
                  "size-2.5 rounded-full transition-colors",
                  active ? "bg-brand-500 ring-2 ring-brand-200" :
                  done   ? "bg-brand-400" : "bg-zinc-200",
                )}
              />
              {i < STEPS.length - 1 && (
                <div className={cn("h-0.5 w-5", done || active ? "bg-brand-300" : "bg-zinc-200")} />
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Connecting line */}
      <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-zinc-100" />

      <div className="space-y-0">
        {STEPS.map((step, i) => {
          const done = i < currentStep;
          const active = i === currentStep;
          const future = i > currentStep;
          const StepIcon = step.Icon;

          // Find matching timeline entry
          const timelineEntry = timeline
            .filter((t) => t.status === step.key)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

          return (
            <div key={step.key} className="relative flex gap-4 pb-6 last:pb-0">
              {/* Icon circle */}
              <div
                className={cn(
                  "relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full border-2 transition-all",
                  active ? "border-brand-500 bg-brand-500 text-white shadow-lg shadow-brand-200" :
                  done   ? "border-brand-300 bg-brand-50 text-brand-500" :
                           "border-zinc-200 bg-white text-zinc-300",
                )}
              >
                {done ? <Check size={16} strokeWidth={2.5} /> : <StepIcon size={16} />}
              </div>

              {/* Content */}
              <div className={cn("flex-1 pt-1.5", future && "opacity-40")}>
                <div className="flex items-center justify-between gap-2">
                  <p className={cn(
                    "text-sm font-semibold",
                    active ? "text-brand-600" : done ? "text-zinc-800" : "text-zinc-400",
                  )}>
                    {step.label}
                    {active && (
                      <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-medium text-brand-700">
                        Current
                      </span>
                    )}
                  </p>
                  {timelineEntry && (
                    <span className="text-[10px] text-zinc-400 shrink-0">
                      {new Date(timelineEntry.createdAt).toLocaleDateString("en-PK", {
                        day: "numeric", month: "short",
                      })}{" "}
                      {new Date(timelineEntry.createdAt).toLocaleTimeString("en-PK", {
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </span>
                  )}
                </div>
                <p className={cn("mt-0.5 text-xs", active ? "text-zinc-600" : "text-zinc-400")}>
                  {timelineEntry?.note ?? step.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Status badge helper ───────────────────────────────────────────────────────

export const ORDER_STATUS_LABELS: Record<OrderStatusKey, string> = {
  PENDING:            "Order Placed",
  PROCESSING:         "Processing",
  READY_FOR_DISPATCH: "Ready to Ship",
  SHIPPED:            "Shipped",
  OUT_FOR_DELIVERY:   "Out for Delivery",
  DELIVERED:          "Delivered",
  CANCELLED:          "Cancelled",
  REFUNDED:           "Refunded",
};

export const ORDER_STATUS_TONE: Record<OrderStatusKey, "success" | "warning" | "accent" | "danger" | "muted"> = {
  PENDING:            "warning",
  PROCESSING:         "accent",
  READY_FOR_DISPATCH: "accent",
  SHIPPED:            "accent",
  OUT_FOR_DELIVERY:   "accent",
  DELIVERED:          "success",
  CANCELLED:          "danger",
  REFUNDED:           "muted",
};
