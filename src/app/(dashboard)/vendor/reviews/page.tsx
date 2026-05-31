import { ModulePage } from "@/components/dashboard/module-page";
import { vendorModuleRows } from "@/lib/dashboard/portal-pages";

export default function VendorReviewsPage() {
  return <ModulePage title="Vendor Reviews" description="Monitor product and store reviews, ratings, flags, and customer feedback." columns={["Module", "Scope", "Role", "Records", "Status"]} rows={vendorModuleRows} capabilities={["Store Reviews", "Product Reviews", "Flags", "Ratings"]} />;
}
