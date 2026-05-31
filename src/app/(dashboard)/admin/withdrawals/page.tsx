import { ModulePage } from "@/components/dashboard/module-page";
import { withdrawalRows } from "@/lib/dashboard/sample-data";

export default function WithdrawalsPage() {
  return (
    <ModulePage
      title="Withdrawal & Payout Management"
      description="Review requests by vendor, amount, method, date, status, ledger impact, minimum withdrawal rules, and payout schedule."
      columns={["Request", "Vendor", "Amount", "Method", "Schedule", "Status"]}
      rows={withdrawalRows}
      capabilities={["Manual Payout", "Minimum Amount Setting", "Weekly / Monthly Schedule", "Ledger Book"]}
    />
  );
}
