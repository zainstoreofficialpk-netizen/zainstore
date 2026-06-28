"use client";

import { useState, useTransition } from "react";
import { Star, ThumbsUp, ChevronDown, PenLine, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { submitProductReviewAction } from "@/lib/customer/review-actions";

export type ReviewData = {
  id: string;
  rating: number;
  title: string | null;
  body: string | null;
  isVerified: boolean;
  helpfulCount: number;
  createdAt: string;
  user: { name: string | null; image: string | null };
};

export function ProductReviews({
  reviews,
  avgRating,
  totalCount,
  productId,
  isLoggedIn,
}: {
  reviews: ReviewData[];
  avgRating: number;
  totalCount: number;
  productId: string;
  isLoggedIn: boolean;
}) {
  const [shown, setShown] = useState(4);

  const ratingCounts = [5, 4, 3, 2, 1].map((r) => ({
    star: r,
    count: reviews.filter((rv) => Math.round(rv.rating) === r).length,
  }));

  return (
    <div id="reviews" className="bg-white rounded-2xl border border-zinc-100 overflow-hidden">
      <div className="p-5 md:p-6 border-b border-zinc-100">
        <h2 className="text-base font-black text-zinc-900">
          Customer Reviews
          {totalCount > 0 && (
            <span className="ml-2 text-sm font-medium text-zinc-400">({totalCount})</span>
          )}
        </h2>
      </div>

      {totalCount === 0 ? (
        <div className="p-6 text-center text-zinc-400">
          <Star className="h-8 w-8 mx-auto mb-2 text-zinc-200" />
          <p className="text-sm">No reviews yet. Be the first to review this product!</p>
        </div>
      ) : (
        <div className="p-5 md:p-6 space-y-6">
          {/* Rating summary */}
          <div className="flex flex-col sm:flex-row gap-6">
            {/* Big number */}
            <div className="flex flex-col items-center justify-center bg-brand-50 rounded-2xl p-5 shrink-0 min-w-[120px]">
              <span className="text-4xl font-black text-zinc-900">{avgRating.toFixed(1)}</span>
              <div className="flex gap-0.5 my-1.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    className={`h-3.5 w-3.5 ${
                      i <= Math.round(avgRating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "fill-zinc-200 text-zinc-200"
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs text-zinc-500">{totalCount} ratings</span>
            </div>

            {/* Bar breakdown */}
            <div className="flex-1 space-y-1.5">
              {ratingCounts.map(({ star, count }) => {
                const pct = totalCount > 0 ? (count / totalCount) * 100 : 0;
                return (
                  <div key={star} className="flex items-center gap-2.5">
                    <div className="flex items-center gap-0.5 w-10 shrink-0 justify-end">
                      <span className="text-xs text-zinc-500">{star}</span>
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    </div>
                    <div className="flex-1 h-2 bg-zinc-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-yellow-400 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-zinc-400 w-6 shrink-0">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Individual reviews */}
          <div className="space-y-4">
            {reviews.slice(0, shown).map((rv) => (
              <ReviewCard key={rv.id} review={rv} />
            ))}
          </div>

          {/* Show more */}
          {shown < reviews.length && (
            <button
              onClick={() => setShown((s) => s + 4)}
              className="w-full py-3 border border-zinc-200 rounded-xl text-sm font-semibold text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50 flex items-center justify-center gap-2 transition-colors"
            >
              <ChevronDown className="h-4 w-4" />
              Show more reviews ({reviews.length - shown} remaining)
            </button>
          )}
        </div>
      )}

      {/* Write a review */}
      <div className="border-t border-zinc-100 p-5 md:p-6">
        <WriteReviewForm productId={productId} isLoggedIn={isLoggedIn} />
      </div>
    </div>
  );
}

function WriteReviewForm({ productId, isLoggedIn }: { productId: string; isLoggedIn: boolean }) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (done) {
    return (
      <div className="text-center py-2">
        <p className="text-sm text-emerald-600 font-semibold">Thank you — your review has been submitted!</p>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <p className="text-sm text-zinc-500 text-center">
        <a href="/login" className="text-brand-600 font-semibold hover:underline">Log in</a> to write a review.
      </p>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full py-3 border border-zinc-200 rounded-xl text-sm font-semibold text-zinc-600 hover:border-brand-400 hover:text-brand-600 flex items-center justify-center gap-2 transition-colors"
      >
        <PenLine className="h-4 w-4" /> Write a Review
      </button>
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) { toast.error("Please select a star rating."); return; }
    if (comment.length < 10) { toast.error("Review must be at least 10 characters."); return; }
    startTransition(async () => {
      const result = await submitProductReviewAction({ productId, rating, title: title || undefined, comment });
      if (result.success) {
        toast.success(result.message);
        setDone(true);
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-sm font-bold text-zinc-800 flex items-center gap-2">
        <PenLine className="h-4 w-4 text-brand-500" /> Write a Review
      </h3>

      {/* Star picker */}
      <div>
        <p className="text-xs text-zinc-500 mb-1.5">Your rating *</p>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((s) => (
            <button
              key={s}
              type="button"
              onMouseEnter={() => setHover(s)}
              onMouseLeave={() => setHover(0)}
              onClick={() => setRating(s)}
            >
              <Star
                className={`h-6 w-6 transition-colors ${
                  s <= (hover || rating) ? "fill-yellow-400 text-yellow-400" : "fill-zinc-200 text-zinc-200"
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Title */}
      <div>
        <label className="text-xs text-zinc-500 mb-1 block">Review title (optional)</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={120}
          placeholder="Summarise your experience"
          className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20"
        />
      </div>

      {/* Comment */}
      <div>
        <label className="text-xs text-zinc-500 mb-1 block">Your review *</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
          minLength={10}
          maxLength={2000}
          placeholder="Share your honest experience with this product…"
          className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20 resize-none"
        />
        <p className="text-xs text-zinc-400 mt-1">Only verified buyers can publish reviews.</p>
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60 transition-colors"
        >
          {isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</> : "Submit Review"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="px-4 py-2.5 border border-zinc-200 rounded-xl text-sm text-zinc-600 hover:bg-zinc-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function ReviewCard({ review }: { review: ReviewData }) {
  const initials = review.user.name
    ? review.user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  const date = new Date(review.createdAt).toLocaleDateString("en-PK", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="bg-zinc-50 rounded-xl p-4 space-y-2.5">
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="h-9 w-9 rounded-full bg-brand-100 flex items-center justify-center shrink-0 overflow-hidden">
          {review.user.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={review.user.image} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-xs font-black text-brand-700">{initials}</span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-zinc-800">
                {review.user.name ?? "Anonymous"}
              </span>
              {review.isVerified && (
                <span className="text-[9px] bg-green-100 text-green-700 font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide">
                  Verified Purchase
                </span>
              )}
            </div>
            <span className="text-xs text-zinc-400 shrink-0">{date}</span>
          </div>

          <div className="flex gap-0.5 mt-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star
                key={i}
                className={`h-3 w-3 ${
                  i <= review.rating ? "fill-yellow-400 text-yellow-400" : "fill-zinc-200 text-zinc-200"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {review.title && (
        <p className="font-semibold text-sm text-zinc-800">{review.title}</p>
      )}
      {review.body && (
        <p className="text-sm text-zinc-600 leading-relaxed">{review.body}</p>
      )}

      {review.helpfulCount > 0 && (
        <div className="flex items-center gap-1.5 text-xs text-zinc-400">
          <ThumbsUp className="h-3 w-3" />
          {review.helpfulCount} {review.helpfulCount === 1 ? "person" : "people"} found this helpful
        </div>
      )}
    </div>
  );
}
