import { Building2, PackageCheck, ShieldCheck, UserCheck } from "lucide-react";

import { PendingActions } from "@/components/dashboard/pending-actions";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { StatCard } from "@/components/dashboard/stat-card";
import { ModuleTable } from "@/components/dashboard/module-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { adminStats, orderRows, vendorRows } from "@/lib/dashboard/sample-data";

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {adminStats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <RevenueChart />
        <PendingActions />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <ModuleTable
          title="Recent Orders"
          description="Status, payment, shipping, invoice, refund, and dispute workflow."
          columns={["Order", "Customer", "Vendor", "Total", "Payment", "Status"]}
          rows={orderRows}
        />
        <ModuleTable
          title="Recent Vendors"
          description="Application review, status control, subscriptions, and view-as-vendor entry."
          columns={["Store", "Owner", "Products", "Revenue", "Commission", "Status"]}
          rows={vendorRows}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { title: "Vendor View Mode", icon: UserCheck, text: "Impersonation workflow with an exit control back to admin." },
          { title: "Product Approval", icon: PackageCheck, text: "Bulk approve, reject, feature, archive, and audit every catalog change." },
          { title: "RBAC Guardrails", icon: ShieldCheck, text: "Separate admin, vendor, and customer route maps and permission contracts." },
          { title: "Store Operations", icon: Building2, text: "SEO, hours, vacation mode, inquiries, policies, reviews, and categories." },
        ].map((item) => (
          <Card key={item.title}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-md bg-teal-50 text-teal-700">
                  <item.icon size={18} aria-hidden />
                </span>
                <CardTitle>{item.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm leading-6 text-zinc-500">{item.text}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
