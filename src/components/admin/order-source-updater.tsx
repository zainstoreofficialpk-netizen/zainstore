"use client";

import { useState, useTransition } from "react";
import { Check, Pencil, X } from "lucide-react";
import { toast } from "sonner";
import { OrderSource } from "@prisma/client";

import { Input } from "@/components/ui/input";
import { updateOrderSource } from "@/lib/admin/order-actions";

const SOURCE_LABELS: Record<OrderSource, string> = {
  DIRECT:    "Direct",
  FACEBOOK:  "Facebook",
  WHATSAPP:  "WhatsApp",
  INSTAGRAM: "Instagram",
  GOOGLE:    "Google",
  OTHER:     "Other",
};

const SOURCE_STYLES: Record<OrderSource, string> = {
  DIRECT:    "bg-zinc-100 text-zinc-600",
  FACEBOOK:  "bg-blue-50 text-blue-700",
  WHATSAPP:  "bg-emerald-50 text-emerald-700",
  INSTAGRAM: "bg-purple-50 text-purple-700",
  GOOGLE:    "bg-red-50 text-red-700",
  OTHER:     "bg-zinc-100 text-zinc-500",
};

export function OrderSourceBadge({ source }: { source: OrderSource }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${SOURCE_STYLES[source]}`}>
      {SOURCE_LABELS[source]}
    </span>
  );
}

export function OrderSourceUpdater({
  orderId,
  currentSource,
  currentReference,
}: {
  orderId: string;
  currentSource: OrderSource;
  currentReference: string | null;
}) {
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [source, setSource] = useState<OrderSource>(currentSource);
  const [reference, setReference] = useState(currentReference ?? "");

  function handleSave() {
    startTransition(async () => {
      const r = await updateOrderSource(orderId, source, reference || null);
      if (r.success) {
        toast.success(r.message);
        setEditing(false);
      } else {
        toast.error(r.error);
      }
    });
  }

  if (!editing) {
    return (
      <div className="flex items-center gap-2">
        <OrderSourceBadge source={currentSource} />
        {currentReference && (
          <span className="font-mono text-xs text-zinc-400">#{currentReference}</span>
        )}
        <button
          onClick={() => setEditing(true)}
          className="grid size-5 place-items-center rounded text-zinc-400 hover:text-zinc-600"
        >
          <Pencil size={11} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <select
        value={source}
        onChange={(e) => setSource(e.target.value as OrderSource)}
        className="h-7 rounded border border-zinc-200 bg-white px-2 text-xs text-zinc-700 focus:outline-none focus:ring-1 focus:ring-brand-500"
        disabled={isPending}
      >
        {(Object.keys(SOURCE_LABELS) as OrderSource[]).map((s) => (
          <option key={s} value={s}>{SOURCE_LABELS[s]}</option>
        ))}
      </select>
      <Input
        value={reference}
        onChange={(e) => setReference(e.target.value)}
        placeholder="Reference # (optional)"
        className="h-7 w-40 text-xs"
        disabled={isPending}
      />
      <button
        onClick={handleSave}
        disabled={isPending}
        className="grid size-7 place-items-center rounded border border-emerald-200 text-emerald-600 hover:bg-emerald-50 disabled:opacity-50"
      >
        <Check size={12} />
      </button>
      <button
        onClick={() => { setEditing(false); setSource(currentSource); setReference(currentReference ?? ""); }}
        className="grid size-7 place-items-center rounded border border-zinc-200 text-zinc-400 hover:bg-zinc-50"
      >
        <X size={12} />
      </button>
    </div>
  );
}
