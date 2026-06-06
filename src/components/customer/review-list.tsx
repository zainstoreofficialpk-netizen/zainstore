"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Pencil, ShieldCheck, Clock, Flag } from "lucide-react";

import { reportReviewAction } from "@/lib/customer/review-actions";
import { StarRating } from "@/components/shared/star-rating";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ReviewForm } from "@/components/customer/review-form";
import type { getCustomerReviews } from "@/lib/customer/review-actions";

type Review = Awaited<ReturnType<typeof getCustomerReviews>>[number];

const STATUS_TONE: Record<string, "success" | "warning" | "danger" | "muted"> = {
  APPROVED: "success",
  PENDING: "warning",
  FLAGGED: "warning",
  REJECTED: "danger",
};

const STATUS_LABEL: Record<string, string> = {
  APPROVED: "Published",
  PENDING: "Pending Moderation",
  FLAGGED: "Under Review",
  REJECTED: "Not Published",
};

function canEdit(review: Review) {
  return Date.now() - new Date(review.createdAt).getTime() < 48 * 60 * 60 * 1000;
}

export function CustomerReviewList({ reviews }: { reviews: Review[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [reportingId, setReportingId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleReport(reviewId: string) {
    if (!reportReason.trim()) { toast.error("Please provide a reason."); return; }
    startTransition(async () => {
      const r = await reportReviewAction({ reviewId, reason: reportReason });
      if (r.success) { toast.success(r.message); setReportingId(null); setReportReason(""); }
      else toast.error(r.error);
    });
  }

  if (reviews.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-zinc-200 py-16 text-center">
        <ShieldCheck className="size-10 text-zinc-300" />
        <p className="text-sm font-medium text-zinc-500">No reviews yet</p>
        <p className="text-xs text-zinc-400">Reviews you write on delivered orders will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => {
        if (editingId === review.id) {
          return (
            <ReviewForm
              key={review.id}
              mode="edit"
              review={{
                id: review.id,
                title: review.title,
                rating: review.rating,
                comment: review.comment,
                createdAt: review.createdAt,
              }}
              onDone={() => setEditingId(null)}
            />
          );
        }

        return (
          <Card key={review.id}>
            <CardContent className="pt-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  {review.product?.images[0]?.url && (
                    <img
                      src={review.product.images[0].url}
                      alt={review.product.name}
                      className="size-12 shrink-0 rounded-md object-cover border border-zinc-100"
                    />
                  )}
                  <div>
                    <p className="text-sm font-medium text-zinc-800">{review.product?.name ?? "Product"}</p>
                    <div className="mt-0.5 flex items-center gap-2">
                      <StarRating rating={review.rating} size={13} />
                      {review.verifiedPurchase && (
                        <span className="flex items-center gap-0.5 text-[10px] text-emerald-600 font-medium">
                          <ShieldCheck size={10} /> Verified Purchase
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge tone={STATUS_TONE[review.status] ?? "muted"}>
                    {STATUS_LABEL[review.status] ?? review.status}
                  </Badge>
                  {canEdit(review) && (
                    <button
                      onClick={() => setEditingId(review.id)}
                      className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
                      title="Edit review (within 48h)"
                    >
                      <Pencil size={13} />
                    </button>
                  )}
                </div>
              </div>

              {review.title && <p className="mt-3 text-sm font-semibold text-zinc-900">{review.title}</p>}
              {review.comment && <p className="mt-1 text-sm text-zinc-600 leading-relaxed">{review.comment}</p>}

              {review.images.length > 0 && (
                <div className="mt-3 flex gap-2 flex-wrap">
                  {review.images.map((img) => (
                    <img
                      key={img.id}
                      src={img.url}
                      alt="Review image"
                      className="size-16 rounded-md object-cover border border-zinc-100"
                    />
                  ))}
                </div>
              )}

              {review.vendorReply && (
                <div className="mt-3 rounded-lg bg-brand-50 border border-brand-100 p-3">
                  <p className="text-xs font-semibold text-brand-700 mb-1">Seller Response</p>
                  <p className="text-xs text-zinc-600">{review.vendorReply}</p>
                </div>
              )}

              <div className="mt-3 flex items-center justify-between text-[10px] text-zinc-400">
                <span className="flex items-center gap-1">
                  <Clock size={10} />
                  {new Date(review.createdAt).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}
                  {review.editedAt && " · Edited"}
                </span>
                {review.status === "APPROVED" && (
                  <button
                    onClick={() => setReportingId(reportingId === review.id ? null : review.id)}
                    className="flex items-center gap-0.5 text-zinc-300 hover:text-rose-500 transition-colors"
                  >
                    <Flag size={10} /> Report
                  </button>
                )}
              </div>

              {reportingId === review.id && (
                <div className="mt-3 flex items-center gap-2">
                  <Input
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    placeholder="Reason for reporting…"
                    className="h-8 text-xs"
                  />
                  <Button size="sm" variant="danger" disabled={isPending} onClick={() => handleReport(review.id)}>
                    {isPending ? "…" : "Report"}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setReportingId(null)}>Cancel</Button>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
