import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell
      portal="customer"
      navTitle="Customer Account"
      title="My Account"
      subtitle="Manage orders, addresses, wishlist, reviews, notifications, and account settings."
    >
      {children}
    </DashboardShell>
  );
}
