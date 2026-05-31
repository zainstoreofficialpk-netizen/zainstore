import { AlertCircle, RefreshCcw, Store, WalletCards } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const actions = [
  { label: "Vendor approvals",    count: 14, icon: Store,       tone: "warning"  as const },
  { label: "Withdrawal requests", count: 27, icon: WalletCards, tone: "accent"   as const },
  { label: "Refund requests",     count: 43, icon: RefreshCcw,  tone: "danger"   as const },
  { label: "Support tickets",     count: 9,  icon: AlertCircle, tone: "muted"    as const },
];

export function PendingActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending Actions</CardTitle>
        <p className="mt-0.5 text-xs text-zinc-400">Items requiring your attention</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {actions.map((action) => (
          <div className="flex items-center justify-between gap-4" key={action.label}>
            <div className="flex items-center gap-3">
              <span className="grid size-8 place-items-center rounded-md bg-zinc-100 text-zinc-500">
                <action.icon size={15} aria-hidden />
              </span>
              <span className="text-sm font-medium text-zinc-700">{action.label}</span>
            </div>
            <Badge tone={action.tone}>{action.count}</Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
