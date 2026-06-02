import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth/config";
import { getShippingSettings } from "@/lib/shipping";
import { ShippingManager } from "@/components/admin/shipping-manager";

export default async function AdminShippingPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "SUPER_ADMIN") redirect("/login");

  const settings = await getShippingSettings();

  return <ShippingManager settings={settings} />;
}
