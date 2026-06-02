import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth/config";
import {
  getVendorDetail,
  getVendorMessages,
  getVendorActivityLog,
  getVendorRevenue,
  getAdminUser,
  markVendorMessagesRead,
} from "@/lib/admin/vendor-data";
import { VendorDetailTabs } from "@/components/vendors/vendor-detail-tabs";

export default async function VendorDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "SUPER_ADMIN") redirect("/login");

  const [vendor, adminUser] = await Promise.all([
    getVendorDetail(params.id),
    getAdminUser(),
  ]);

  if (!vendor || !adminUser) notFound();

  const [messages, activityLog, revenue] = await Promise.all([
    getVendorMessages(vendor.user.id, adminUser.id),
    getVendorActivityLog(params.id),
    getVendorRevenue(params.id),
    markVendorMessagesRead(vendor.user.id, adminUser.id),
  ]);

  return (
    <div>
      <VendorDetailTabs
        vendor={vendor}
        messages={messages}
        activityLog={activityLog}
        revenue={revenue}
        adminId={adminUser.id}
      />
    </div>
  );
}
