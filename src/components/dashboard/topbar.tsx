import { Bell, Search, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";

type TopbarProps = {
  title: string;
  subtitle: string;
};

export function Topbar({ title, subtitle }: TopbarProps) {
  return (
    <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/95 backdrop-blur">
      <div className="flex min-h-16 items-center justify-between gap-4 px-4 lg:px-6">
        <div>
          <h1 className="text-lg font-bold text-zinc-950">{title}</h1>
          <p className="text-xs text-zinc-500">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden h-10 w-72 items-center gap-2 rounded-md border border-zinc-200 px-3 text-sm text-zinc-500 md:flex">
            <Search size={16} aria-hidden />
            Search dashboard
          </div>
          <Button variant="outline" size="icon" type="button" aria-label="Notifications">
            <Bell size={18} aria-hidden />
          </Button>
          <Button variant="outline" size="icon" type="button" aria-label="Account">
            <UserRound size={18} aria-hidden />
          </Button>
        </div>
      </div>
    </header>
  );
}
