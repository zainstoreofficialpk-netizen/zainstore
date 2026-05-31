import { ModulePage } from "@/components/dashboard/module-page";
import { customerModuleRows } from "@/lib/dashboard/portal-pages";

export default function CustomerAddressesPage() {
  return <ModulePage title="Customer Addresses" description="Manage personal shipping and billing addresses." columns={["Module", "Scope", "Role", "Records", "Status"]} rows={customerModuleRows} capabilities={["Primary Address", "City / Region", "Billing", "Shipping"]} />;
}
