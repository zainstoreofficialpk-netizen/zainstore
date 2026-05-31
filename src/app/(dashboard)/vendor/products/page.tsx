import { ModulePage } from "@/components/dashboard/module-page";
import { vendorModuleRows } from "@/lib/dashboard/portal-pages";

export default function VendorProductsPage() {
  return <ModulePage title="Vendor Products" description="Create products, manage variants, stock, images, attributes, and approval status." columns={["Module", "Scope", "Role", "Records", "Status"]} rows={vendorModuleRows} capabilities={["Product CRUD", "Inventory", "Variants", "Approval Status"]} />;
}
