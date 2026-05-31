import { ModulePage } from "@/components/dashboard/module-page";
import { vendorModuleRows } from "@/lib/dashboard/portal-pages";

export default function VendorOrdersPage() {
  return <ModulePage title="Vendor Orders" description="View assigned order items, update fulfillment, view refund requests, and export records." columns={["Module", "Scope", "Role", "Records", "Status"]} rows={vendorModuleRows} capabilities={["Fulfillment", "Refund Requests", "Invoices", "Exports"]} />;
}
