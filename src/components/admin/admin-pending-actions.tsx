import Link from "next/link";
import { AlertCircle, PackageCheck, RefreshCcw, Store, WalletCards } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { getPendingActionCounts } from "@/lib/admin/dashboard-data";

type Counts = Awaited<ReturnType<typeof getPendingActionCounts>>;

export function AdminPendingActions({ counts }: { counts: Counts }) {
  const actions = [
    {
      label: "Vendor approvals",
      count: counts.vendorApprovals,
      icon: Store,
      tone: "warning" as const,
      href: "/admin/vendors?status=PENDING_APPROVAL",
    },
    {
      label: "Withdrawal requests",
      count: counts.withdrawalRequests,
      icon: WalletCards,
      tone: "accent" as const,
      href: "/admin/withdrawals?status=REQUESTED",
    },
    {
      label: "Refund requests",
      count: counts.refundRequests,
      icon: RefreshCcw,
      tone: "danger" as const,
      href: "/admin/refunds?status=REQUESTED",
    },
    {
      label: "Products awaiting review",
      count: counts.pendingProducts,
      icon: PackageCheck,
      tone: "warning" as const,
      href: "/admin/products?status=PENDING_REVIEW",
    },
    {
      label: "Open support tickets",
      count: counts.openTickets,
      icon: AlertCircle,
      tone: "muted" as const,
      href: "/admin/support",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending Actions</CardTitle>
        <p className="mt-0.5 text-xs text-zinc-400">Items requiring your attention</p>
      </CardHeader>
      <CardContent className="space-y-2">
        {actions.map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className="flex items-center justify-between gap-4 rounded-lg px-2 py-2.5 transition-colors hover:bg-zinc-50"
          >
            <div className="flex items-center gap-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-md bg-zinc-100 text-zinc-500">
                <action.icon size={15} aria-hidden />
              </span>
              <span className="text-sm font-medium text-zinc-700">{action.label}</span>
            </div>
            <Badge tone={action.count > 0 ? action.tone : "muted"}>{action.count}</Badge>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
