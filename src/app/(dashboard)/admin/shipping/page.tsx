import { ModulePage } from "@/components/dashboard/module-page";

const rows = [
  ["Karachi Metro", "Karachi", "Flat Rate", "PKR 250", "Vendor override on", "Active"],
  ["Pakistan Nationwide", "All Regions", "Distance Rate", "Variable", "Vendor override off", "Active"],
  ["Pickup Partners", "Selected Cities", "Local Pickup", "PKR 0", "Vendor override on", "Pending Review"],
];

export default function ShippingPage() {
  return (
    <ModulePage
      title="Shipping Management"
      description="Define zones, methods, vendor shipping-rate overrides, shipping classes, distance-rate shipping, and tracking providers."
      columns={["Zone", "Coverage", "Method", "Rate", "Vendor Rates", "Status"]}
      rows={rows}
      capabilities={["Zones", "Flat / Free / Pickup", "Shipping Classes", "Tracking Settings"]}
    />
  );
}
