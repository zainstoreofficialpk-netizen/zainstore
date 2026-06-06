import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { getVendorReviews, getVendorReviewStats } from "@/lib/vendor/review-data";
import { getVendorTrustScore } from "@/lib/trust-score";
import { VendorReviewsDashboard } from "@/components/vendor/vendor-reviews-dashboard";
import type { ReviewFilter, ReviewSort } from "@/lib/vendor/review-data";

export default async function VendorReviewsPage({
  searchParams,
}: {
  searchParams: { filter?: string; sort?: string; page?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "VENDOR") redirect("/login");

  const vendor = await db.vendorProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!vendor) redirect("/vendor");

  const filter = (searchParams.filter ?? "ALL") as ReviewFilter;
  const sort = (searchParams.sort ?? "latest") as ReviewSort;
  const page = Number(searchParams.page ?? "1");

  const [{ reviews, total, pages }, stats, trustScore] = await Promise.all([
    getVendorReviews(vendor.id, { filter, sort, page }),
    getVendorReviewStats(vendor.id),
    getVendorTrustScore(vendor.id),
  ]);

  const serializedReviews = reviews.map((r) => ({
    ...r,
    createdAt: r.createdAt,
    vendorRepliedAt: r.vendorRepliedAt,
    editedAt: r.editedAt,
  }));

  const serializedScore = trustScore
    ? {
        overallScore: trustScore.overallScore,
        badges: trustScore.badges,
        orderCompletionRate: trustScore.orderCompletionRate,
        refundRate: trustScore.refundRate,
        deliveryScore: trustScore.deliveryScore,
      }
    : null;

  return (
    <VendorReviewsDashboard
      reviews={serializedReviews}
      stats={stats}
      trustScore={serializedScore}
      total={total}
      pages={pages}
      currentPage={page}
      currentFilter={filter}
      currentSort={sort}
    />
  );
}
