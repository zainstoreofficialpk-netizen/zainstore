import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { ProfileShell } from "@/components/profile/profile-shell";

export default async function CustomerProfilePage({
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
    },
  });

  if (!user) redirect("/login");

  const primaryAddress = await db.address.findFirst({
    where: { userId: user.id },
    orderBy: { id: "asc" },
    select: {
      id: true,
      label: true,
      line1: true,
      line2: true,
      city: true,
      region: true,
      postalCode: true,
    },
  });

  return (
    <ProfileShell
      user={{
        ...user,
        name: user.name ?? "",
        role: user.role as string,
        primaryAddress: primaryAddress ?? null,
      }}
      initialTab={searchParams.tab ?? "profile"}
    />
  );
}
