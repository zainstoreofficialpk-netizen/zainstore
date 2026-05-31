import { ModulePage } from "@/components/dashboard/module-page";

const rows = [
  ["Free", "50 products", "12%", "None", "0 days", "Active"],
  ["Silver", "500 products", "10%", "Monthly", "7 days", "Active"],
  ["Gold", "Unlimited", "8%", "Monthly / Yearly", "14 days", "Active"],
];

export default function MembershipsPage() {
  return (
    <ModulePage
      title="Membership & Subscription Plans"
      description="Create vendor plans with product limits, commission rates, feature access, recurring billing, trials, assignments, and expiry notifications."
      columns={["Plan", "Limit", "Commission", "Billing", "Trial", "Status"]}
      rows={rows}
      capabilities={["Plan Builder", "Feature Access", "Recurring Billing", "Expiry Notifications"]}
    />
  );
}
