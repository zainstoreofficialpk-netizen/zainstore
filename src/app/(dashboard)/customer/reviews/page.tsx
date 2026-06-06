import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { ShieldCheck } from "lucide-react";

import { authOptions } from "@/lib/auth/config";
import { getCustomerReviews, getReviewableOrderItems } from "@/lib/customer/review-actions";
import { CustomerReviewList } from "@/components/customer/review-list";
import { PendingReviewsPanel } from "@/components/customer/pending-reviews-panel";

export default async function CustomerReviewsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "CUSTOMER") redirect("/login");

  const [reviews, pendingItems] = await Promise.all([
    getCustomerReviews(session.user.id),
    getReviewableOrderItems(session.user.id),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-bold text-zinc-950">My Reviews</h2>
        <p className="mt-0.5 text-sm text-zinc-400">
          Share your experience and help other shoppers make informed decisions.
        </p>
      </div>

      {pendingItems.length > 0 && (
        <div>
          <div className="mb-3 flex items-center gap-2">
            <ShieldCheck size={15} className="text-brand-600" />
            <h3 className="text-sm font-semibold text-zinc-800">
              Pending Reviews ({pendingItems.length})
            </h3>
          </div>
          <PendingReviewsPanel items={pendingItems} />
        </div>
      )}

      <div>
        <h3 className="mb-3 text-sm font-semibold text-zinc-800">
          Your Reviews ({reviews.length})
        </h3>
        <CustomerReviewList reviews={reviews} />
      </div>
    </div>
  );
}
