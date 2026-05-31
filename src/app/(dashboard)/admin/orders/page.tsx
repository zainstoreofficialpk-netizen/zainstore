import { ModulePage } from "@/components/dashboard/module-page";
import { orderRows } from "@/lib/dashboard/sample-data";

export default function OrdersPage() {
  return (
    <ModulePage
      title="Order Management"
      description="Manage order status, shipping status, delivery status, invoices, timelines, refunds, exports, and disputes."
      columns={["Order", "Customer", "Vendor", "Total", "Payment", "Status"]}
      rows={orderRows}
      capabilities={["CSV / Excel Export", "Invoice Download", "Order Timeline", "Dispute Resolution"]}
    />
  );
}
