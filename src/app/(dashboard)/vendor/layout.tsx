import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { vendorNavigation } from "@/config/navigation";

export default function VendorLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell
      navTitle="Vendor Portal"
      title="Seller Workspace"
      subtitle="Manage store profile, catalog, orders, earnings, withdrawals, and reviews."
      items={vendorNavigation}
    >
      {children}
    </DashboardShell>
  );
}
