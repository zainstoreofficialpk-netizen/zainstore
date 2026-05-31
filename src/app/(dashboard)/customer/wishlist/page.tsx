import { ModulePage } from "@/components/dashboard/module-page";
import { customerModuleRows } from "@/lib/dashboard/portal-pages";

export default function CustomerWishlistPage() {
  return <ModulePage title="Customer Wishlist" description="Manage saved products and restock reminders." columns={["Module", "Scope", "Role", "Records", "Status"]} rows={customerModuleRows} capabilities={["Saved Products", "Restock Alerts", "Vendor Visibility", "Remove"]} />;
}
