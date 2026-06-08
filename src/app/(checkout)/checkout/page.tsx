import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { CheckoutClient } from "@/components/storefront/checkout-client";

export const metadata = {
  title: "Checkout — ZainStore.pk",
  robots: { index: false },
};

export default async function CheckoutPage() {
  const session = await getServerSession(authOptions);

  const user = session?.user
    ? {
        id: (session.user as { id: string }).id,
        name: session.user.name ?? null,
        email: session.user.email ?? null,
        role: (session.user as { role: string }).role,
      }
    : null;

  return <CheckoutClient user={user} />;
}
