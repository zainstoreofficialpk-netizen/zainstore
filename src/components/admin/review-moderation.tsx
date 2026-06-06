"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Check, X, Flag, Trash2, ShieldCheck, ThumbsUp, AlertTriangle } from "lucide-react";

import {
  approveReviewAction,
  rejectReviewAction,
  flagReviewAction,
  deleteReviewAction,
  dismissReportsAction,
} from "@/lib/admin/review-actions";
import { StarRating } from "@/components/shared/star-rating";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";

// ── Types ─────────────────────────────────────────────────────────────────────

type Review = {
  id: string;
  title: string | null;
  rating: number;
  comment: string | null;
  status: string;
  flagged: boolean;
  verifiedPurchase: boolean;
  helpfulCount: number;
  reportCount: number;
  vendorReply: string | null;
  createdAt: Date;
  user: { name: string | null; email: string; image: string | null };
  product: {
    id: string;
    name: string;
    images: { url: string }[];
    vendor: { id: string; store: { name: string } | null } | null;
  } | null;
  images: { id: string; url: string }[];
  reports: { reason: string; createdAt: Date; user: { name: string | null } }[];
  _count: { votes: number; reports: number };
};

type Stats = {
  pending: number;
  approved: number;
  rejected: number;
  flagged: number;
  autoFlagged: number;
  totalReports: number;
};

type Props = {
  reviews: Review[];
  stats: Stats;
  total: number;
  pages: number;
  currentPage: number;
  currentFilter: string;
};

// ── Status helpers ────────────────────────────────────────────────────────────

const STATUS_TONE: Record<string, "success" | "warning" | "danger" | "muted"> = {
  APPROVED: "success", PENDING: "warning", FLAGGED: "warning", REJECTED: "danger",
};

// ── Review moderation card ────────────────────────────────────────────────────

function ReviewModerationCard({ review }: { review: Review }) {
  const [expanded, setExpanded] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showReject, setShowReject] = useState(false);
  const [isPending, startTransition] = useTransition();

  function act(fn: () => Promise<{ success: boolean; message?: string; error?: string }>) {
    startTransition(async () => {
      const r = await fn();
      if (r.success) toast.success(r.message ?? "Done");
      else toast.error(r.error ?? "Error");
    });
  }

  return (
    <div className="border-b border-zinc-100 py-5 last:border-0">
      <div className="flex items-start gap-4">
        {/* Product thumbnail */}
        {review.product?.images[0]?.url ? (
          <img src={review.product.images[0].url} alt="" className="size-14 shrink-0 rounded-md object-cover border border-zinc-100" />
        ) : (
          <div className="grid size-14 shrink-0 place-items-center rounded-md bg-zinc-100 text-zinc-400 text-xs">No img</div>
        )}

        <div className="flex-1 min-w-0">
          {/* Header row */}
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-zinc-900">{review.user.name ?? "Anonymous"}</span>
                <span className="text-xs text-zinc-400">{review.user.email}</span>
                {review.verifiedPurchase && (
                  <span className="flex items-center gap-0.5 text-[10px] font-medium text-emerald-600">
                    <ShieldCheck size={10} /> Verified
                  </span>
                )}
              </div>
              <div className="mt-0.5 flex items-center gap-2">
                <StarRating rating={review.rating} size={13} />
                <span className="text-xs text-zinc-400">
                  {new Date(review.createdAt).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}
                </span>
                <Badge tone={STATUS_TONE[review.status] ?? "muted"} className="text-[10px]">{review.status}</Badge>
                {review.flagged && <Badge tone="warning" className="text-[10px]">⚠ Auto-flagged</Badge>}
              </div>
              {review.product && (
                <p className="mt-0.5 text-xs text-zinc-400">
                  {review.product.name}
                  {review.product.vendor?.store && <> · <span className="text-brand-600">{review.product.vendor.store.name}</span></>}
                </p>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-1.5 shrink-0">
              {review.status !== "APPROVED" && (
                <button
                  onClick={() => act(() => approveReviewAction(review.id))}
                  disabled={isPending}
                  title="Approve"
                  className="flex items-center gap-1 rounded-md border border-emerald-200 px-2.5 py-1 text-xs text-emerald-700 hover:bg-emerald-50 disabled:opacity-40"
                >
                  <Check size={12} /> Approve
                </button>
              )}
              {review.status !== "REJECTED" && (
                <button
                  onClick={() => setShowReject(!showReject)}
                  disabled={isPending}
                  title="Reject"
                  className="flex items-center gap-1 rounded-md border border-rose-200 px-2.5 py-1 text-xs text-rose-600 hover:bg-rose-50 disabled:opacity-40"
                >
                  <X size={12} /> Reject
                </button>
              )}
              <button
                onClick={() => act(() => flagReviewAction(review.id))}
                disabled={isPending}
                title={review.flagged ? "Unflag" : "Flag"}
                className="rounded-md border border-zinc-200 p-1.5 text-zinc-500 hover:bg-zinc-50 disabled:opacity-40"
              >
                <Flag size={12} />
              </button>
              <button
                onClick={() => { if (confirm("Delete this review permanently?")) act(() => deleteReviewAction(review.id)); }}
                disabled={isPending}
                title="Delete"
                className="rounded-md border border-zinc-200 p-1.5 text-zinc-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40"
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>

          {/* Reject inline form */}
          {showReject && (
            <div className="mt-2 flex items-center gap-2">
              <input
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Rejection reason (optional)"
                className="flex-1 rounded border border-zinc-200 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-brand-400"
              />
              <button
                onClick={() => act(() => rejectReviewAction(review.id, rejectReason || undefined).then((r) => { setShowReject(false); return r; }))}
                disabled={isPending}
                className="rounded-md bg-rose-500 px-3 py-1 text-xs text-white hover:bg-rose-600 disabled:opacity-40"
              >
                Confirm Reject
              </button>
              <button onClick={() => setShowReject(false)} className="text-xs text-zinc-400 hover:underline">Cancel</button>
            </div>
          )}

          {/* Review content */}
          {review.title && <p className="mt-2 text-sm font-semibold text-zinc-900">{review.title}</p>}
          {review.comment && (
            <p className="mt-1 text-sm text-zinc-700 leading-relaxed">
              {expanded || review.comment.length <= 200 ? review.comment : `${review.comment.slice(0, 200)}…`}
              {review.comment.length > 200 && (
                <button onClick={() => setExpanded(!expanded)} className="ml-1 text-brand-600 text-xs hover:underline">
                  {expanded ? "Less" : "More"}
                </button>
              )}
            </p>
          )}

          {review.images.length > 0 && (
            <div className="mt-2 flex gap-2">
              {review.images.map((img) => (
                <img key={img.id} src={img.url} alt="" className="size-12 rounded object-cover border border-zinc-100" />
              ))}
            </div>
          )}

          {/* Reports */}
          {review._count.reports > 0 && (
            <div className="mt-3 rounded-lg border border-rose-100 bg-rose-50 p-3">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs font-semibold text-rose-700 flex items-center gap-1">
                  <AlertTriangle size={11} /> {review._count.reports} Report{review._count.reports > 1 ? "s" : ""}
                </p>
                <button
                  onClick={() => act(() => dismissReportsAction(review.id))}
                  disabled={isPending}
                  className="text-[10px] text-emerald-600 hover:underline"
                >
                  Dismiss All & Approve
                </button>
              </div>
              {review.reports.slice(0, 3).map((r, i) => (
                <p key={i} className="text-[10px] text-rose-700">
                  · {r.user.name ?? "User"}: "{r.reason}"
                </p>
              ))}
            </div>
          )}

          {/* Stats footer */}
          <div className="mt-2 flex items-center gap-3 text-[10px] text-zinc-400">
            <span className="flex items-center gap-0.5"><ThumbsUp size={10} /> {review.helpfulCount} helpful</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export function AdminReviewModeration({ reviews, stats, total, pages, currentPage, currentFilter }: Props) {
  const filters = ["ALL", "PENDING", "APPROVED", "FLAGGED", "REJECTED"];

  function buildUrl(params: Record<string, string>) {
    const u = new URLSearchParams({ filter: currentFilter, page: String(currentPage) });
    for (const [k, v] of Object.entries(params)) u.set(k, v);
    return `/admin/reviews?${u}`;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-zinc-950">Review Moderation</h2>
        <p className="mt-0.5 text-sm text-zinc-400">
          Moderate customer reviews, manage flagged content, and maintain marketplace trust.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { label: "Pending", value: stats.pending, color: "text-amber-700 bg-amber-50" },
          { label: "Approved", value: stats.approved, color: "text-emerald-700 bg-emerald-50" },
          { label: "Rejected", value: stats.rejected, color: "text-rose-700 bg-rose-50" },
          { label: "Flagged", value: stats.flagged, color: "text-orange-700 bg-orange-50" },
          { label: "Auto-flagged", value: stats.autoFlagged, color: "text-red-700 bg-red-50" },
          { label: "Reports", value: stats.totalReports, color: "text-zinc-700 bg-zinc-100" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-4 pb-3">
              <p className={`text-xl font-bold ${s.color.split(" ")[0]}`}>{s.value}</p>
              <p className="text-[10px] text-zinc-500">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter tabs + list */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle>Review Queue ({total})</CardTitle>
            <div className="flex gap-1">
              {filters.map((f) => (
                <a
                  key={f}
                  href={buildUrl({ filter: f, page: "1" })}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    currentFilter === f ? "bg-brand-500 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                  }`}
                >
                  {f === "ALL" ? "All" : f.charAt(0) + f.slice(1).toLowerCase()}
                  {f === "PENDING" && stats.pending > 0 && ` (${stats.pending})`}
                  {f === "FLAGGED" && stats.flagged > 0 && ` (${stats.flagged})`}
                </a>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 px-5">
          {reviews.length === 0 ? (
            <div className="py-16 text-center text-sm text-zinc-400">No reviews match this filter.</div>
          ) : (
            reviews.map((r) => <ReviewModerationCard key={r.id} review={r} />)
          )}
        </CardContent>

        {pages > 1 && (
          <div className="flex items-center justify-center gap-3 border-t border-zinc-100 p-4">
            {currentPage > 1 && (
              <a href={buildUrl({ page: String(currentPage - 1) })} className="text-xs text-brand-600 hover:underline">← Previous</a>
            )}
            <span className="text-xs text-zinc-400">Page {currentPage} of {pages}</span>
            {currentPage < pages && (
              <a href={buildUrl({ page: String(currentPage + 1) })} className="text-xs text-brand-600 hover:underline">Next →</a>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
