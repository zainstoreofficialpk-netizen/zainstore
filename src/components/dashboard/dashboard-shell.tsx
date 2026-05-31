import type { ReactNode } from "react";

import { Sidebar } from "@/components/dashboard/sidebar";
import { Topbar } from "@/components/dashboard/topbar";

type DashboardShellProps = {
  portal: "admin" | "vendor" | "customer";
  navTitle: string;
  title: string;
  subtitle: string;
  children: ReactNode;
};

export function DashboardShell({ portal, navTitle, title, subtitle, children }: DashboardShellProps) {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950">
      <div className="flex">
        <Sidebar title={navTitle} portal={portal} />
        <div className="min-w-0 flex-1">
          <Topbar title={title} subtitle={subtitle} />
          <main className="mx-auto w-full max-w-7xl px-4 py-6 lg:px-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
