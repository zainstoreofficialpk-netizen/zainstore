import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export default function VendorLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell
      portal="vendor"
      navTitle="Vendor Portal"
      title="Seller Workspace"
      subtitle="Manage store profile, catalog, orders, earnings, withdrawals, and reviews."
    >
      {children}
    </DashboardShell>
  );
}
