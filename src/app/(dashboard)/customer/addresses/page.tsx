import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { AddressManager } from "@/components/customer/address-manager";
import { MapPin } from "lucide-react";

export default async function CustomerAddressesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "CUSTOMER") redirect("/login");

  const addresses = await db.address.findMany({
    where: { userId: session.user.id },
    orderBy: { id: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
          <MapPin className="w-5 h-5 text-brand-500" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-zinc-950">Saved Addresses</h2>
          <p className="text-sm text-zinc-400">Manage your delivery addresses for faster checkout</p>
        </div>
      </div>

      <AddressManager addresses={addresses} />
    </div>
  );
}
