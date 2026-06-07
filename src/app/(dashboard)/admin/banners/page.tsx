import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { BannerManager } from "@/components/admin/banner-manager";

export const metadata = { title: "Banner Management — Admin" };

export default async function AdminBannersPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "SUPER_ADMIN") redirect("/login");

  const banners = await db.banner.findMany({
    orderBy: [{ placement: "asc" }, { createdAt: "desc" }],
  });

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-zinc-950">Banner Management</h2>
        <p className="mt-0.5 text-sm text-zinc-400">
          Manage homepage slider images, hero banners, and promotional strips shown on the storefront.
        </p>
      </div>

      <div className="rounded-xl bg-brand-50 border border-brand-100 px-4 py-3">
        <p className="text-sm text-brand-700 font-medium">
          💡 <strong>Slider images</strong> appear on the homepage hero carousel at{" "}
          <a href="/shop" target="_blank" className="underline hover:no-underline">/shop</a>.
          Set placement to <strong>Homepage Slider</strong> and upload an image URL (1200×480px recommended).
        </p>
      </div>

      <BannerManager
        initialBanners={banners.map((b) => ({
          id: b.id,
          title: b.title,
          imageUrl: b.imageUrl,
          linkUrl: b.linkUrl,
          placement: b.placement,
          active: b.active,
          startsAt: b.startsAt?.toISOString() ?? null,
          endsAt: b.endsAt?.toISOString() ?? null,
          createdAt: b.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
