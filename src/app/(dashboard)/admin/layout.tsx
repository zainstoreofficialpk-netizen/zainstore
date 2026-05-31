import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell
      portal="admin"
      navTitle="Super Admin"
      title="Marketplace Command Center"
      subtitle="Manage vendors, orders, finance, operations, and platform settings."
    >
      {children}
    </DashboardShell>
  );
}
