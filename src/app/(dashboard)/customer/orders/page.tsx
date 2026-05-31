import { ModulePage } from "@/components/dashboard/module-page";
import { customerModuleRows } from "@/lib/dashboard/portal-pages";

export default function CustomerOrdersPage() {
  return <ModulePage title="Customer Orders" description="View personal orders, statuses, invoices, refunds, and support links." columns={["Module", "Scope", "Role", "Records", "Status"]} rows={customerModuleRows} capabilities={["Order History", "Invoices", "Refunds", "Tracking"]} />;
}
