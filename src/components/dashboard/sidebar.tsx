"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Store } from "lucide-react";

import { cn } from "@/lib/utils";
import { adminNavigation, vendorNavigation, customerNavigation } from "@/config/navigation";

const navMap = {
  admin: adminNavigation,
  vendor: vendorNavigation,
  customer: customerNavigation,
};

type SidebarProps = {
  title: string;
  portal: "admin" | "vendor" | "customer";
};

export function Sidebar({ title, portal }: SidebarProps) {
  const pathname = usePathname();
  const items = navMap[portal];

  return (
    <aside className="hidden min-h-screen w-64 shrink-0 border-r border-zinc-200 bg-white lg:block">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-zinc-100 px-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-icon.svg" alt="ZainStore.pk" className="h-9 w-9 object-contain shrink-0" />
        <div>
          <p className="text-sm font-bold text-zinc-950">ZainStore.pk</p>
          <p className="text-xs text-zinc-400">{title}</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="space-y-0.5 p-3">
        {items.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href + "/"));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-brand-50 font-semibold text-brand-700"
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
