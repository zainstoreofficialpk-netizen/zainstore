import { ModulePage } from "@/components/dashboard/module-page";
import { vendorModuleRows } from "@/lib/dashboard/portal-pages";

export default function VendorAnalyticsPage() {
  return <ModulePage title="Vendor Analytics" description="Analyze sales, best products, conversion, low-stock trends, and payout history." columns={["Module", "Scope", "Role", "Records", "Status"]} rows={vendorModuleRows} capabilities={["Sales", "Products", "Inventory", "Payouts"]} />;
}
