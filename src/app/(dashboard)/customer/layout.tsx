import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { customerNavigation } from "@/config/navigation";

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell
      navTitle="Customer Account"
      title="Customer Dashboard"
      subtitle="Manage personal orders, addresses, wishlist, reviews, notifications, and account settings."
      items={customerNavigation}
    >
      {children}
    </DashboardShell>
  );
}
