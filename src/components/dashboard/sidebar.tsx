import Link from "next/link";
import { Store } from "lucide-react";

import type { NavItem } from "@/config/navigation";

type SidebarProps = {
  title: string;
  items: NavItem[];
};

export function Sidebar({ title, items }: SidebarProps) {
  return (
    <aside className="hidden min-h-screen w-72 border-r border-zinc-200 bg-white lg:block">
      <div className="flex h-16 items-center gap-3 border-b border-zinc-200 px-5">
        <span className="grid size-10 place-items-center rounded-md bg-teal-700 text-white">
          <Store size={21} aria-hidden />
        </span>
        <div>
          <p className="text-sm font-bold text-zinc-950">ZainStore.pk</p>
          <p className="text-xs text-zinc-500">{title}</p>
        </div>
      </div>
      <nav className="space-y-1 p-3">
        {items.map((item) => (
          <Link
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950"
            href={item.href}
            key={item.href}
          >
            <item.icon size={18} aria-hidden />
            {item.title}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
