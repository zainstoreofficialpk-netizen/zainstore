import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth/config";
import { getVendorAdminMessages, getAdminUserForVendor } from "@/lib/vendor/data";
import { VendorMessagesView } from "@/components/vendor/vendor-messages-view";

export default async function VendorMessagesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const admin = await getAdminUserForVendor();
  if (!admin) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-zinc-400">
        No admin account found.
      </div>
    );
  }

  const messages = await getVendorAdminMessages(session.user.id, admin.id);

  return (
    <VendorMessagesView
      messages={messages}
      vendorUserId={session.user.id}
      adminName={admin.name}
      adminImage={admin.image}
    />
  );
}
