import { AlertCircle, RefreshCcw, Store, WalletCards } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const actions = [
  { label: "Vendor approvals", count: 14, icon: Store, tone: "warning" as const },
  { label: "Withdrawal requests", count: 27, icon: WalletCards, tone: "warning" as const },
  { label: "Refund requests", count: 43, icon: RefreshCcw, tone: "danger" as const },
  { label: "Support tickets", count: 9, icon: AlertCircle, tone: "default" as const },
];

export function PendingActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {actions.map((action) => (
          <div className="flex items-center justify-between gap-4" key={action.label}>
            <div className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-md bg-zinc-100 text-zinc-700">
                <action.icon size={17} aria-hidden />
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
