"use client";

import { useState } from "react";
import { Star, ThumbsUp, ChevronDown } from "lucide-react";

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
}: {
  reviews: ReviewData[];
  avgRating: number;
  totalCount: number;
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
    </div>
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
