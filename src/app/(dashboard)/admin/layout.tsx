import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { adminNavigation } from "@/config/navigation";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell
      navTitle="Super Admin"
      title="Marketplace Command Center"
      subtitle="Manage vendors, orders, finance, operations, and platform settings."
      items={adminNavigation}
    >
      {children}
    </DashboardShell>
  );
}
