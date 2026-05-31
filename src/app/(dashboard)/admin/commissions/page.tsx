import { ModulePage } from "@/components/dashboard/module-page";

const rows = [
  ["Global Default", "Percentage of sale", "10%", "Shipping included", "Tax excluded", "Active"],
  ["Urban Loom", "Vendor override", "8%", "Shipping excluded", "Coupon deducted", "Active"],
  ["Electronics", "Category override", "12%", "Shipping included", "Tax included", "Active"],
  ["High Ticket Products", "Price range", "15%", "Shipping excluded", "Tax excluded", "Pending Review"],
];

export default function CommissionsPage() {
  return (
    <ModulePage
      title="Commission Management"
      description="Configure global, vendor, product, category, sales-volume, and product-price-range commission strategies with history logs."
      columns={["Scope", "Type", "Rate", "Shipping", "Tax / Coupon", "Status"]}
      rows={rows}
      capabilities={["Global Rate", "Vendor Override", "Product Override", "History Log"]}
    />
  );
}
