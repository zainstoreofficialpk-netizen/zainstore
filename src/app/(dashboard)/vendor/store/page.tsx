import { ModulePage } from "@/components/dashboard/module-page";
import { vendorModuleRows } from "@/lib/dashboard/portal-pages";

export default function VendorStorePage() {
  return <ModulePage title="Store Settings" description="Manage store profile, categories, SEO, hours, vacation mode, inquiries, and policies." columns={["Module", "Scope", "Role", "Records", "Status"]} rows={vendorModuleRows} capabilities={["Logo / Banner", "Store SEO", "Vacation Mode", "Policies"]} />;
}
