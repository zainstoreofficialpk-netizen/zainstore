import { ModulePage } from "@/components/dashboard/module-page";
import { vendorRows } from "@/lib/dashboard/sample-data";

export default function VendorsPage() {
  return (
    <ModulePage
      title="Vendor Management"
      description="Approve, reject, suspend, activate, edit, delete, filter, communicate with, and impersonate marketplace vendors."
      columns={["Store", "Owner", "Products", "Revenue", "Commission", "Status"]}
      rows={vendorRows}
      capabilities={["View As Vendor", "Approval Workflow", "Subscription Assignment", "Vendor Inbox"]}
    />
  );
}
