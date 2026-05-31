import { ModulePage } from "@/components/dashboard/module-page";

const rows = [
  ["Cotton Overshirt", "Urban Loom", "Fashion", "PKR 3,499", "42", "Active"],
  ["Fast Charge Power Bank", "Gadget Yard", "Electronics", "PKR 6,999", "25", "Active"],
  ["Bamboo Desk Lamp", "Home Craft PK", "Home", "PKR 4,250", "0", "Pending Review"],
];

export default function ProductsPage() {
  return (
    <ModulePage
      title="Product Management"
      description="Manage product approval, rejection, bulk actions, categories, brands, attributes, featured products, and low-stock alerts."
      columns={["Product", "Vendor", "Category", "Price", "Stock", "Status"]}
      rows={rows}
      capabilities={["Bulk Approval", "Featured Products", "Brand & Attributes", "Low Stock Alerts"]}
    />
  );
}
