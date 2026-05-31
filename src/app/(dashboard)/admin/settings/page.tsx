import { ModulePage } from "@/components/dashboard/module-page";

const rows = [
  ["Marketplace", "Name / logo / currency / timezone", "Admin", "Global", "Versioned", "Active"],
  ["Registration", "Vendor approval / guest checkout", "Admin", "Global", "Audit logged", "Active"],
  ["Payments", "COD / Stripe / PayPal / JazzCash / EasyPaisa", "Admin", "Encrypted", "Provider tested", "Pending Review"],
  ["Maintenance", "Marketplace maintenance mode", "Admin", "Global", "Immediate", "Active"],
];

export default function SettingsPage() {
  return (
    <ModulePage
      title="General Settings"
      description="Control marketplace identity, registration, multi-vendor product behavior, guest checkout, policies, gateways, tax, email templates, and maintenance mode."
      columns={["Group", "Setting", "Owner", "Scope", "Change Control", "Status"]}
      rows={rows}
      capabilities={["Currency / Timezone", "Vendor Registration", "Payment Gateways", "Email Templates"]}
    />
  );
}
