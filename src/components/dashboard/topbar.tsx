import { Bell, Search, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";

type TopbarProps = {
  title: string;
  subtitle: string;
};

export function Topbar({ title, subtitle }: TopbarProps) {
  return (
    <header className="sticky top-0 z-10 border-b border-zinc-100 bg-white/95 backdrop-blur">
      <div className="flex min-h-16 items-center justify-between gap-4 px-4 lg:px-6">
        <div>
          <h1 className="text-base font-bold text-zinc-950">{title}</h1>
          <p className="text-xs text-zinc-400">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden h-9 w-64 items-center gap-2 rounded-md border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-400 md:flex">
            <Search size={14} aria-hidden />
            Search…
          </div>
          <Button variant="outline" size="icon" type="button" aria-label="Notifications" className="relative size-9">
            <Bell size={16} aria-hidden />
            <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-accent-500" />
          </Button>
          <Button variant="outline" size="icon" type="button" aria-label="Account" className="size-9">
            <UserRound size={16} aria-hidden />
          </Button>
        </div>
      </div>
    </header>
  );
}
