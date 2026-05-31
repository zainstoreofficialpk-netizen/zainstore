import { ModulePage } from "@/components/dashboard/module-page";
import { vendorModuleRows } from "@/lib/dashboard/portal-pages";

export default function VendorWithdrawalsPage() {
  return <ModulePage title="Vendor Withdrawals" description="Request payouts by supported methods and track approval, rejection, processing, and payment history." columns={["Module", "Scope", "Role", "Records", "Status"]} rows={vendorModuleRows} capabilities={["Bank Transfer", "EasyPaisa", "JazzCash", "PayPal"]} />;
}
