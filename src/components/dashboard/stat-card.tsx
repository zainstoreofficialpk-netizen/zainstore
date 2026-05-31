import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

type StatCardProps = {
  title: string;
  value: string;
  helper: string;
  icon: LucideIcon;
};

export function StatCard({ title, value, helper, icon: Icon }: StatCardProps) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-zinc-500">{title}</p>
          <p className="mt-2 text-2xl font-bold text-zinc-950">{value}</p>
          <p className="mt-1 text-xs text-zinc-400">{helper}</p>
        </div>
        <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600">
          <Icon size={20} aria-hidden />
        </div>
      </CardContent>
    </Card>
  );
}
