import { ModulePage } from "@/components/dashboard/module-page";
import { vendorModuleRows } from "@/lib/dashboard/portal-pages";

export default function VendorEarningsPage() {
  return <ModulePage title="Vendor Earnings" description="Track revenue, commissions, deductions, refund reversals, and ledger entries." columns={["Module", "Scope", "Role", "Records", "Status"]} rows={vendorModuleRows} capabilities={["Ledger", "Commission", "Refund Reversal", "Reports"]} />;
}
