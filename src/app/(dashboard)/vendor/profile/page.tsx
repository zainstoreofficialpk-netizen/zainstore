import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { ProfileShell } from "@/components/profile/profile-shell";

export default async function VendorProfilePage({
  searchParams,
}: {
  searchParams: { tab?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      image: true,
      role: true,
      emailVerified: true,
      createdAt: true,
      vendorProfile: {
        select: {
          bankName: true,
          accountTitle: true,
          accountNumber: true,
          iban: true,
          store: {
            select: {
              name: true,
              description: true,
              address: true,
              phone: true,
              email: true,
              logoUrl: true,
              bannerUrl: true,
            },
          },
        },
      },
    },
  });

  if (!user) redirect("/login");

  return (
    <ProfileShell
      user={{ ...user, name: user.name ?? "", role: user.role as string }}
      initialTab={searchParams.tab ?? "profile"}
    />
  );
}
