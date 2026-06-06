"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { X, Plus } from "lucide-react";

import { submitReviewAction, editReviewAction } from "@/lib/customer/review-actions";
import { StarRating } from "@/components/shared/star-rating";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type OrderItemRow = {
  id: string;
  product: { id: string; name: string; images: { url: string }[] };
  order: { orderNumber: string };
};

type ReviewRow = {
  id: string;
  title: string | null;
  rating: number;
  comment: string | null;
  createdAt: Date;
};

type Props =
  | { mode: "submit"; orderItem: OrderItemRow; onDone: () => void }
  | { mode: "edit"; review: ReviewRow; onDone: () => void };

export function ReviewForm(props: Props) {
  const [isPending, startTransition] = useTransition();
  const [rating, setRating] = useState(props.mode === "edit" ? props.review.rating : 0);
  const [title, setTitle] = useState(props.mode === "edit" ? (props.review.title ?? "") : "");
  const [comment, setComment] = useState(props.mode === "edit" ? (props.review.comment ?? "") : "");
  const [imageUrls, setImageUrls] = useState<string[]>([""]);

  function addImageField() {
    if (imageUrls.length < 5) setImageUrls((p) => [...p, ""]);
  }

  function setImageUrl(idx: number, val: string) {
    setImageUrls((p) => p.map((u, i) => (i === idx ? val : u)));
  }

  function removeImage(idx: number) {
    setImageUrls((p) => p.filter((_, i) => i !== idx));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) { toast.error("Please select a star rating."); return; }
    startTransition(async () => {
      let result;
      if (props.mode === "submit") {
        result = await submitReviewAction({
          orderItemId: props.orderItem.id,
          title: title || undefined,
          rating,
          comment: comment || undefined,
          imageUrls: imageUrls.filter(Boolean),
        });
      } else {
        result = await editReviewAction({
          reviewId: props.review.id,
          title: title || undefined,
          rating,
          comment: comment || undefined,
        });
      }

      if (result.success) {
        toast.success(result.message);
        props.onDone();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Card className="border-brand-200">
      <CardHeader>
        <CardTitle className="text-base">
          {props.mode === "submit"
            ? `Review: ${props.orderItem.product.name}`
            : "Edit Your Review"}
        </CardTitle>
        {props.mode === "submit" && (
          <p className="text-xs text-zinc-400">Order #{props.orderItem.order.orderNumber}</p>
        )}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700">Your Rating *</label>
            <StarRating rating={rating} size={28} interactive onChange={setRating} />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700">Title (optional)</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Summarise your experience"
              maxLength={120}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700">Your Review</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share details about quality, delivery experience, and what you loved or didn't…"
              rows={4}
              maxLength={2000}
              className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
            <p className="mt-0.5 text-right text-[10px] text-zinc-300">{comment.length}/2000</p>
          </div>

          {props.mode === "submit" && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-700">Review Images (optional, max 5)</label>
              <div className="space-y-2">
                {imageUrls.map((url, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Input
                      value={url}
                      onChange={(e) => setImageUrl(idx, e.target.value)}
                      placeholder="https://example.com/image.jpg"
                      type="url"
                      className="flex-1"
                    />
                    {imageUrls.length > 1 && (
                      <button type="button" onClick={() => removeImage(idx)} className="text-zinc-400 hover:text-rose-500">
                        <X size={14} />
                      </button>
                    )}
                  </div>
                ))}
                {imageUrls.length < 5 && (
                  <button type="button" onClick={addImageField} className="flex items-center gap-1 text-xs text-brand-600 hover:underline">
                    <Plus size={12} /> Add image URL
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving…" : props.mode === "submit" ? "Submit Review" : "Update Review"}
            </Button>
            <Button type="button" variant="outline" onClick={props.onDone}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
