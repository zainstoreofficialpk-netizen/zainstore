import { ModulePage } from "@/components/dashboard/module-page";
import { customerModuleRows } from "@/lib/dashboard/portal-pages";

export default function CustomerReviewsPage() {
  return <ModulePage title="Customer Reviews" description="Manage personal product and store reviews awaiting moderation or already published." columns={["Module", "Scope", "Role", "Records", "Status"]} rows={customerModuleRows} capabilities={["Product Reviews", "Store Reviews", "Moderation", "Edit"]} />;
}
