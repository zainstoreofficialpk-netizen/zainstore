import { ModulePage } from "@/components/dashboard/module-page";

const rows = [
  ["Sales Report", "Daily / Weekly / Monthly / Yearly", "Charts", "CSV / PDF", "Scheduled", "Active"],
  ["Vendor Earnings", "Per Vendor", "Tables", "CSV / PDF", "Monthly", "Active"],
  ["Tax Report", "Per Region", "Summary", "CSV / PDF", "Quarterly", "Pending Review"],
];

export default function ReportsPage() {
  return (
    <ModulePage
      title="Reports & Analytics"
      description="Sales, vendor earnings, product sales, category performance, customer activity, commission, payout, tax, and refund reports."
      columns={["Report", "Scope", "Visualization", "Export", "Schedule", "Status"]}
      rows={rows}
      capabilities={["Charts", "CSV Export", "PDF Export", "Scheduled Reports"]}
    />
  );
}
