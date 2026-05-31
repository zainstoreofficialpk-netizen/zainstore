import type { ReactNode } from "react";

import type { NavItem } from "@/config/navigation";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Topbar } from "@/components/dashboard/topbar";

type DashboardShellProps = {
  navTitle: string;
  title: string;
  subtitle: string;
  items: NavItem[];
  children: ReactNode;
};

export function DashboardShell({ navTitle, title, subtitle, items, children }: DashboardShellProps) {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950">
      <div className="flex">
        <Sidebar title={navTitle} items={items} />
        <div className="min-w-0 flex-1">
          <Topbar title={title} subtitle={subtitle} />
          <main className="mx-auto w-full max-w-7xl px-4 py-6 lg:px-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
