import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { VendorSettingsShell } from "@/components/vendor/vendor-settings-shell";

export const metadata = { title: "Settings — Vendor" };

export default async function VendorSettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "VENDOR") redirect("/login");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      image: true,
      emailVerified: true,
      notificationPreferences: true,
      createdAt: true,
    },
  });

  if (!user) redirect("/login");

  const vendor = await db.vendorProfile.findUnique({
    where: { userId: session.user.id },
    include: { store: true },
  });

  if (!vendor?.store) redirect("/vendor");

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-zinc-950">Settings</h2>
        <p className="mt-0.5 text-sm text-zinc-400">Manage your store, payments, and preferences.</p>
      </div>

      <VendorSettingsShell
        user={{
          ...user,
          emailVerified: user.emailVerified?.toISOString() ?? null,
          notificationPreferences: (user.notificationPreferences as Record<string, boolean>) ?? null,
          createdAt: user.createdAt.toISOString(),
        }}
        vendor={{
          id: vendor.id,
          bankName: vendor.bankName,
          accountTitle: vendor.accountTitle,
          accountNumber: vendor.accountNumber,
          iban: vendor.iban,
          shippingSettings: (vendor.shippingSettings as Record<string, unknown>) ?? null,
          taxSettings: (vendor.taxSettings as Record<string, unknown>) ?? null,
        }}
        store={{
          id: vendor.store.id,
          name: vendor.store.name,
          slug: vendor.store.slug,
          description: vendor.store.description,
          logoUrl: vendor.store.logoUrl,
          bannerUrl: vendor.store.bannerUrl,
          address: vendor.store.address,
          phone: vendor.store.phone,
          email: vendor.store.email,
          shippingPolicy: vendor.store.shippingPolicy,
          returnPolicy: vendor.store.returnPolicy,
        }}
      />
    </div>
  );
}
