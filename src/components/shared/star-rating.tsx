"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

type StarRatingProps = {
  rating: number;
  max?: number;
  size?: number;
  interactive?: boolean;
  onChange?: (v: number) => void;
  className?: string;
};

export function StarRating({ rating, max = 5, size = 16, interactive = false, onChange, className }: StarRatingProps) {
  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      {Array.from({ length: max }, (_, i) => {
        const filled = i + 1 <= rating;
        const half = !filled && i + 0.5 <= rating;
        return (
          <button
            key={i}
            type={interactive ? "button" : undefined}
            onClick={interactive && onChange ? () => onChange(i + 1) : undefined}
            className={cn(
              interactive ? "cursor-pointer hover:scale-110 transition-transform" : "cursor-default",
            )}
            disabled={!interactive}
          >
            <Star
              size={size}
              className={cn(
                filled || half ? "text-amber-400 fill-amber-400" : "text-zinc-300 fill-zinc-100",
              )}
            />
          </button>
        );
      })}
    </div>
  );
}

type RatingBarProps = {
  star: number;
  count: number;
  total: number;
};

export function RatingBar({ star, count, total }: RatingBarProps) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-4 shrink-0 text-right text-zinc-500">{star}</span>
      <Star size={11} className="shrink-0 fill-amber-400 text-amber-400" />
      <div className="h-1.5 flex-1 rounded-full bg-zinc-100">
        <div className="h-full rounded-full bg-amber-400" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-6 shrink-0 text-zinc-400">{count}</span>
    </div>
  );
}

export function RatingBreakdown({
  dist,
  total,
  avg,
}: {
  dist: Record<number, number>;
  total: number;
  avg: number;
}) {
  return (
    <div className="flex gap-6 items-center">
      <div className="text-center">
        <p className="text-4xl font-bold text-zinc-950">{avg.toFixed(1)}</p>
        <StarRating rating={avg} size={14} />
        <p className="mt-1 text-xs text-zinc-400">{total} reviews</p>
      </div>
      <div className="flex-1 space-y-1.5">
        {[5, 4, 3, 2, 1].map((s) => (
          <RatingBar key={s} star={s} count={dist[s] ?? 0} total={total} />
        ))}
      </div>
    </div>
  );
}
