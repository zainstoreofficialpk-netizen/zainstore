import { ModulePage } from "@/components/dashboard/module-page";

const rows = [
  ["Marketplace Revenue", "May 2026", "PKR 18.4M", "PKR 2.1M", "PKR 860K", "Active"],
  ["Vendor Revenue", "May 2026", "PKR 16.3M", "PKR 2.1M", "PKR 7.2M", "Active"],
  ["Refund Exposure", "May 2026", "PKR 184K", "PKR 18K", "PKR 42K", "Under Review"],
];

export default function FinancePage() {
  return (
    <ModulePage
      title="Finance & Earnings"
      description="Monitor marketplace revenue, vendor earnings, commission revenue, payout history, withdrawal requests, and financial reporting."
      columns={["Metric", "Period", "Gross", "Commission", "Payouts", "Status"]}
      rows={rows}
      capabilities={["Vendor Earnings", "Commission Breakdown", "Financial Reports", "Payout History"]}
    />
  );
}
