import { ModulePage } from "@/components/dashboard/module-page";
import { customerModuleRows } from "@/lib/dashboard/portal-pages";

export default function CustomerSettingsPage() {
  return <ModulePage title="Customer Settings" description="Manage profile, password, notification preferences, and privacy controls." columns={["Module", "Scope", "Role", "Records", "Status"]} rows={customerModuleRows} capabilities={["Profile", "Password", "Preferences", "Privacy"]} />;
}
