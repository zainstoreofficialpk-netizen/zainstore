import { ModulePage } from "@/components/dashboard/module-page";

const rows = [
  ["New Order", "Email", "Admin + Vendor", "Transactional", "Unread count", "Active"],
  ["Refund Request", "Email + Bell", "Admin", "Operational", "Unread count", "Active"],
  ["Vendor Approval", "Email", "Vendor", "Lifecycle", "Clear all", "Active"],
];

export default function NotificationsPage() {
  return (
    <ModulePage
      title="Notification System"
      description="Configure email and optional SMS notifications for orders, vendors, refunds, withdrawals, reviews, support, and system events."
      columns={["Event", "Channel", "Audience", "Template", "Bell", "Status"]}
      rows={rows}
      capabilities={["Email Settings", "SMS Settings", "Unread Count", "Mark Read / Clear"]}
    />
  );
}
