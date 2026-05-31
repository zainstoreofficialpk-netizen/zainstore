import { ModulePage } from "@/components/dashboard/module-page";
import { refundRows } from "@/lib/dashboard/sample-data";

export default function RefundsPage() {
  return (
    <ModulePage
      title="Refund Management"
      description="Approve, reject, process, and audit full or partial refund requests while keeping vendor ledger reversal hooks available."
      columns={["Refund", "Order", "Vendor", "Amount", "Reason", "Status"]}
      rows={refundRows}
      capabilities={["Approve / Reject", "Partial Refunds", "Reverse Withdrawal", "Refund Report Export"]}
    />
  );
}
