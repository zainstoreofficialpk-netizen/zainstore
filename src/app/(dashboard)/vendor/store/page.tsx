import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { StoreSettingsForm } from "@/components/vendor/store-settings-form";
import { Store } from "lucide-react";

export default async function VendorStorePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "VENDOR") redirect("/login");

  const vendor = await db.vendorProfile.findUnique({
    where: { userId: session.user.id },
    include: { store: true },
  });
  if (!vendor?.store) redirect("/vendor");

  const s = vendor.store;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
          <Store className="w-5 h-5 text-brand-500" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-zinc-950">Store Settings</h2>
          <p className="text-sm text-zinc-400 mt-0.5">Manage your store profile, policies, and SEO</p>
        </div>
      </div>

      <StoreSettingsForm store={{
        slug: s.slug,
        name: s.name,
        description: s.description ?? undefined,
        logoUrl: s.logoUrl ?? undefined,
        bannerUrl: s.bannerUrl ?? undefined,
        address: s.address ?? undefined,
        phone: s.phone ?? undefined,
        email: s.email ?? undefined,
        seoTitle: s.seoTitle ?? undefined,
        seoDescription: s.seoDescription ?? undefined,
        returnPolicy: s.returnPolicy ?? undefined,
        shippingPolicy: s.shippingPolicy ?? undefined,
        vacationMode: s.vacationMode,
      }} />
    </div>
  );
}
