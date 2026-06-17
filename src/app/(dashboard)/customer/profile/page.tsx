import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { CustomerProfileForm } from "@/components/customer/customer-profile-form";
import { UserPen } from "lucide-react";

export default async function CustomerProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  if (session.user.role !== "CUSTOMER") redirect("/login");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, phone: true, image: true, emailVerified: true, createdAt: true },
  });
  if (!user) redirect("/login");

  const primaryAddress = await db.address.findFirst({
    where: { userId: user.id },
    orderBy: { id: "asc" },
    select: { id: true, label: true, line1: true, line2: true, city: true, region: true, postalCode: true },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
          <UserPen className="w-5 h-5 text-brand-500" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-zinc-950">Update Profile</h2>
          <p className="text-sm text-zinc-400 mt-0.5">Manage your personal information, address, and account security</p>
        </div>
      </div>

      <CustomerProfileForm
        user={{
          ...user,
          name: user.name ?? "",
          primaryAddress: primaryAddress ?? null,
        }}
      />
    </div>
  );
}
