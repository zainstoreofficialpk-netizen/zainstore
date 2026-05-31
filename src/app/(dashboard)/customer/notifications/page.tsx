import { ModulePage } from "@/components/dashboard/module-page";
import { customerModuleRows } from "@/lib/dashboard/portal-pages";

export default function CustomerNotificationsPage() {
  return <ModulePage title="Customer Notifications" description="Read order, refund, support, wishlist, and system notifications." columns={["Module", "Scope", "Role", "Records", "Status"]} rows={customerModuleRows} capabilities={["Unread Count", "Mark Read", "Clear All", "Preferences"]} />;
}
