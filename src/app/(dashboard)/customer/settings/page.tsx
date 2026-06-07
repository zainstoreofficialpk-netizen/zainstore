import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { CustomerSettingsShell } from "@/components/customer/customer-settings-shell";

export const metadata = { title: "Settings — Customer" };

export default async function CustomerSettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const [user, addresses, refunds] = await Promise.all([
    db.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        image: true,
        emailVerified: true,
        notificationPreferences: true,
        privacySettings: true,
        createdAt: true,
      },
    }),
    db.address.findMany({
      where: { userId: session.user.id },
      orderBy: { id: "asc" },
    }),
    db.refundRequest.findMany({
      where: { customerId: session.user.id },
      include: { order: { select: { orderNumber: true } } },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
  ]);

  if (!user) redirect("/login");

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-zinc-950">Settings</h2>
        <p className="mt-0.5 text-sm text-zinc-400">Manage your account, preferences, and privacy.</p>
      </div>

      <CustomerSettingsShell
        user={{
          ...user,
          emailVerified: user.emailVerified?.toISOString() ?? null,
          notificationPreferences: (user.notificationPreferences as Record<string, boolean>) ?? null,
          privacySettings: (user.privacySettings as Record<string, boolean>) ?? null,
          createdAt: user.createdAt.toISOString(),
        }}
        addresses={addresses.map((a) => ({
          id: a.id,
          label: a.label,
          line1: a.line1,
          line2: a.line2,
          city: a.city,
          region: a.region,
          postalCode: a.postalCode,
        }))}
        refunds={refunds.map((r) => ({
          id: r.id,
          amount: Number(r.amount),
          reason: r.reason,
          status: r.status,
          createdAt: r.createdAt.toISOString(),
          orderNumber: r.order.orderNumber,
        }))}
      />
    </div>
  );
}
