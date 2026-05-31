"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Store } from "lucide-react";

import type { NavItem } from "@/config/navigation";
import { cn } from "@/lib/utils";

type SidebarProps = {
  title: string;
  items: NavItem[];
};

export function Sidebar({ title, items }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="hidden min-h-screen w-64 shrink-0 border-r border-zinc-200 bg-white lg:block">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-zinc-100 px-4">
        <span className="grid size-9 place-items-center rounded-lg bg-gradient-to-br from-brand-500 to-accent-500 text-white shadow-sm">
          <Store size={18} aria-hidden />
        </span>
        <div>
          <p className="text-sm font-bold text-zinc-950">ZainStore.pk</p>
          <p className="text-xs text-zinc-400">{title}</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="space-y-0.5 p-3">
        {items.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href + "/"));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-brand-50 text-brand-700 font-semibold"
                  : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900",
              )}
            >
              <item.icon
                size={17}
                aria-hidden
                className={isActive ? "text-brand-600" : "text-zinc-400"}
              />
              {item.title}
              {isActive && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-brand-500" />
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
