import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth/config";
import { getAdminReviews } from "@/lib/admin/review-data";
import { AdminReviewModeration } from "@/components/admin/review-moderation";
import type { AdminReviewFilter } from "@/lib/admin/review-data";

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: { filter?: string; page?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "SUPER_ADMIN") redirect("/login");

  const filter = (searchParams.filter ?? "ALL") as AdminReviewFilter;
  const page = Number(searchParams.page ?? "1");

  const { reviews, total, pages, stats } = await getAdminReviews(filter, page);

  return (
    <AdminReviewModeration
      reviews={reviews}
      stats={stats}
      total={total}
      pages={pages}
      currentPage={page}
      currentFilter={filter}
    />
  );
}
