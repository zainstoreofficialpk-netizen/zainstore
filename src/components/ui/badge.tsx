import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type BadgeTone = "default" | "success" | "warning" | "danger" | "muted" | "accent";

const tones: Record<BadgeTone, string> = {
  default: "bg-brand-50  text-brand-700  ring-brand-200",
  accent:  "bg-accent-50 text-accent-700 ring-accent-200",
  success: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  warning: "bg-amber-50  text-amber-700  ring-amber-200",
  danger:  "bg-rose-50   text-rose-700   ring-rose-200",
  muted:   "bg-zinc-100  text-zinc-700   ring-zinc-200",
};

export function Badge({
  className,
  tone = "default",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold ring-1 ring-inset",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
