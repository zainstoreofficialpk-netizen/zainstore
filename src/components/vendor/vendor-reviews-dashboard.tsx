"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Star, ShieldCheck, MessageSquare, TrendingUp, Award,
  ThumbsUp, Flag, ChevronDown, ChevronUp, Send, Trash2,
} from "lucide-react";

import { replyToReviewAction, deleteReplyAction } from "@/lib/vendor/review-actions";
import { StarRating, RatingBreakdown } from "@/components/shared/star-rating";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import { BADGE_META } from "@/lib/trust-score";

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
  vendorReply: string | null;
  vendorRepliedAt: Date | null;
  editedAt: Date | null;
  createdAt: Date;
  user: { name: string | null; image: string | null };
  product: { id: string; name: string; images: { url: string }[] } | null;
  images: { id: string; url: string }[];
  _count: { votes: number; reports: number };
};

type Stats = {
  total: number;
  avgRating: number;
  ratingDist: Record<number, number>;
  positivePercent: number;
  responseRate: number;
  pendingCount: number;
  flaggedCount: number;
};

type TrustScore = {
  overallScore: number;
  badges: string[];
  orderCompletionRate: number;
  refundRate: number;
  deliveryScore: number;
} | null;

type Props = {
  reviews: Review[];
  stats: Stats;
  trustScore: TrustScore;
  total: number;
  pages: number;
  currentPage: number;
  currentFilter: string;
  currentSort: string;
};

// ── Status helpers ────────────────────────────────────────────────────────────

const STATUS_TONE: Record<string, "success" | "warning" | "danger" | "muted"> = {
  APPROVED: "success", PENDING: "warning", FLAGGED: "warning", REJECTED: "danger",
};

// ── Trust score card ──────────────────────────────────────────────────────────

function TrustScoreCard({ score }: { score: TrustScore }) {
  if (!score) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-8 text-center text-sm text-zinc-400">
          Trust score is calculated once you have approved reviews and completed orders.
        </CardContent>
      </Card>
    );
  }

  const scoreColor =
    score.overallScore >= 80 ? "text-emerald-700" :
    score.overallScore >= 60 ? "text-amber-700" : "text-rose-600";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award size={16} className="text-brand-600" /> Vendor Trust Score
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <div className={`text-5xl font-bold ${scoreColor}`}>{score.overallScore}</div>
          <div className="flex-1">
            <div className="h-3 rounded-full bg-zinc-100">
              <div
                className={`h-full rounded-full ${score.overallScore >= 80 ? "bg-emerald-500" : score.overallScore >= 60 ? "bg-amber-400" : "bg-rose-400"}`}
                style={{ width: `${score.overallScore}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-zinc-400">out of 100</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Order Completion", value: `${score.orderCompletionRate}%` },
            { label: "Return Rate", value: `${score.refundRate}%` },
            { label: "Delivery Score", value: `${score.deliveryScore}` },
          ].map((m) => (
            <div key={m.label} className="rounded-lg bg-zinc-50 p-2 text-center">
              <p className="text-sm font-bold text-zinc-900">{m.value}</p>
              <p className="text-[10px] text-zinc-400">{m.label}</p>
            </div>
          ))}
        </div>

        {score.badges.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-medium text-zinc-600">Achievement Badges</p>
            <div className="flex flex-wrap gap-2">
              {score.badges.map((badge) => {
                const meta = BADGE_META[badge];
                if (!meta) return null;
                return (
                  <span
                    key={badge}
                    title={meta.description}
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${meta.color}`}
                  >
                    <Award size={10} /> {meta.label}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Review card ───────────────────────────────────────────────────────────────

function ReviewCard({ review }: { review: Review }) {
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState(review.vendorReply ?? "");
  const [isPending, startTransition] = useTransition();

  function handleReply() {
    if (!replyText.trim()) { toast.error("Reply cannot be empty."); return; }
    startTransition(async () => {
      const r = await replyToReviewAction({ reviewId: review.id, reply: replyText });
      if (r.success) { toast.success(r.message); setReplyOpen(false); }
      else toast.error(r.error);
    });
  }

  function handleDeleteReply() {
    startTransition(async () => {
      const r = await deleteReplyAction(review.id);
      if (r.success) { toast.success(r.message); setReplyText(""); }
      else toast.error(r.error);
    });
  }

  return (
    <div className="border-b border-zinc-100 py-5 last:border-0">
      <div className="flex items-start gap-3">
        <div className="grid size-9 shrink-0 place-items-center rounded-full bg-zinc-100 text-sm font-semibold text-zinc-600">
          {review.user.name?.[0]?.toUpperCase() ?? "?"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-zinc-900">{review.user.name ?? "Anonymous"}</span>
            {review.verifiedPurchase && (
              <span className="flex items-center gap-0.5 text-[10px] font-medium text-emerald-600">
                <ShieldCheck size={10} /> Verified Purchase
              </span>
            )}
            <Badge tone={STATUS_TONE[review.status] ?? "muted"} className="text-[10px]">
              {review.status}
            </Badge>
            {review.flagged && <Badge tone="warning" className="text-[10px]">⚠ Flagged</Badge>}
          </div>

          <div className="mt-1 flex items-center gap-2">
            <StarRating rating={review.rating} size={13} />
            <span className="text-xs text-zinc-400">
              {new Date(review.createdAt).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}
              {review.editedAt && " · Edited"}
            </span>
          </div>

          {review.product && (
            <p className="mt-0.5 text-xs text-zinc-400">
              Product: <span className="text-zinc-600">{review.product.name}</span>
            </p>
          )}

          {review.title && <p className="mt-2 text-sm font-semibold text-zinc-900">{review.title}</p>}
          {review.comment && <p className="mt-1 text-sm text-zinc-700 leading-relaxed">{review.comment}</p>}

          {review.images.length > 0 && (
            <div className="mt-2 flex gap-2 flex-wrap">
              {review.images.map((img) => (
                <img key={img.id} src={img.url} alt="" className="size-14 rounded-md object-cover border border-zinc-100" />
              ))}
            </div>
          )}

          <div className="mt-2 flex items-center gap-3 text-[10px] text-zinc-400">
            <span className="flex items-center gap-0.5"><ThumbsUp size={10} /> {review.helpfulCount} helpful</span>
            {review._count.reports > 0 && (
              <span className="flex items-center gap-0.5 text-rose-400"><Flag size={10} /> {review._count.reports} reports</span>
            )}
          </div>

          {/* Vendor reply */}
          {review.vendorReply ? (
            <div className="mt-3 rounded-lg bg-brand-50 border border-brand-100 p-3">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-semibold text-brand-700">Your Response</p>
                <div className="flex gap-1">
                  <button onClick={() => { setReplyText(review.vendorReply!); setReplyOpen(true); }} className="text-[10px] text-brand-600 hover:underline">Edit</button>
                  <button onClick={handleDeleteReply} disabled={isPending} className="text-[10px] text-rose-500 hover:underline ml-2">Remove</button>
                </div>
              </div>
              {replyOpen ? (
                <div className="space-y-2">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    rows={3}
                    className="w-full rounded border border-brand-200 bg-white px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand-400"
                  />
                  <div className="flex gap-2">
                    <button onClick={handleReply} disabled={isPending} className="flex items-center gap-1 rounded-md bg-brand-500 px-3 py-1 text-xs text-white hover:bg-brand-600 disabled:opacity-50">
                      <Send size={10} />{isPending ? "Saving…" : "Update Reply"}
                    </button>
                    <button onClick={() => setReplyOpen(false)} className="text-xs text-zinc-400 hover:underline">Cancel</button>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-zinc-600">{review.vendorReply}</p>
              )}
            </div>
          ) : (
            review.status === "APPROVED" && (
              <div className="mt-2">
                {replyOpen ? (
                  <div className="rounded-lg border border-zinc-200 p-3 space-y-2">
                    <p className="text-xs font-medium text-zinc-700">Write a public reply</p>
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      rows={3}
                      placeholder="Thank the customer and address their feedback professionally…"
                      className="w-full rounded border border-zinc-200 bg-white px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand-400"
                    />
                    <div className="flex gap-2">
                      <button onClick={handleReply} disabled={isPending} className="flex items-center gap-1 rounded-md bg-brand-500 px-3 py-1 text-xs text-white hover:bg-brand-600 disabled:opacity-50">
                        <Send size={10} />{isPending ? "Posting…" : "Post Reply"}
                      </button>
                      <button onClick={() => setReplyOpen(false)} className="text-xs text-zinc-400 hover:underline">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setReplyOpen(true)} className="flex items-center gap-1 text-xs text-brand-600 hover:underline">
                    <MessageSquare size={11} /> Reply to this review
                  </button>
                )}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main dashboard ────────────────────────────────────────────────────────────

export function VendorReviewsDashboard({ reviews, stats, trustScore, total, pages, currentPage, currentFilter, currentSort }: Props) {
  const filters = ["ALL", "APPROVED", "PENDING", "FLAGGED", "REJECTED"];
  const sorts = [
    { value: "latest", label: "Latest" },
    { value: "highest", label: "Highest Rated" },
    { value: "lowest", label: "Lowest Rated" },
    { value: "helpful", label: "Most Helpful" },
  ];

  function buildUrl(params: Record<string, string>) {
    const u = new URLSearchParams({ filter: currentFilter, sort: currentSort, page: String(currentPage) });
    for (const [k, v] of Object.entries(params)) u.set(k, v);
    return `/vendor/reviews?${u}`;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-zinc-950">Reviews & Reputation</h2>
        <p className="mt-0.5 text-sm text-zinc-400">Monitor customer feedback and manage your store reputation.</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Total Reviews", value: stats.total, icon: Star },
          { label: "Avg Rating", value: stats.avgRating.toFixed(1) + " ★", icon: TrendingUp },
          { label: "Positive %", value: stats.positivePercent + "%", icon: ThumbsUp },
          { label: "Response Rate", value: stats.responseRate + "%", icon: MessageSquare },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-3 py-4">
              <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600">
                <s.icon size={16} />
              </div>
              <div>
                <p className="text-[11px] text-zinc-500">{s.label}</p>
                <p className="text-sm font-bold text-zinc-950">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Rating breakdown */}
        <Card>
          <CardHeader><CardTitle>Rating Breakdown</CardTitle></CardHeader>
          <CardContent>
            <RatingBreakdown dist={stats.ratingDist} total={stats.total} avg={stats.avgRating} />
          </CardContent>
        </Card>

        {/* Trust score */}
        <div className="lg:col-span-2">
          <TrustScoreCard score={trustScore} />
        </div>
      </div>

      {/* Review list */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle>Customer Reviews ({total})</CardTitle>
            <div className="flex flex-wrap gap-2">
              {/* Filter tabs */}
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
                    {f === "PENDING" && stats.pendingCount > 0 && ` (${stats.pendingCount})`}
                    {f === "FLAGGED" && stats.flaggedCount > 0 && ` (${stats.flaggedCount})`}
                  </a>
                ))}
              </div>
              {/* Sort */}
              <select
                defaultValue={currentSort}
                onChange={(e) => { window.location.href = buildUrl({ sort: e.target.value, page: "1" }); }}
                className="h-7 rounded-full border border-zinc-200 bg-white px-2.5 text-xs focus:outline-none"
              >
                {sorts.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 px-5">
          {reviews.length === 0 ? (
            <div className="py-16 text-center text-sm text-zinc-400">No reviews match this filter.</div>
          ) : (
            reviews.map((r) => <ReviewCard key={r.id} review={r} />)
          )}
        </CardContent>

        {pages > 1 && (
          <div className="flex items-center justify-center gap-2 border-t border-zinc-100 p-4">
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
