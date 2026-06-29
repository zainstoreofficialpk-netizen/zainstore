"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { adminNavigation, vendorNavigation, customerNavigation } from "@/config/navigation";

const navMap = {
  admin: adminNavigation,
  vendor: vendorNavigation,
  customer: customerNavigation,
};

const titleMap = {
  admin: "Super Admin",
  vendor: "Vendor Panel",
  customer: "My Account",
};

type Props = { portal: "admin" | "vendor" | "customer" };

export function MobileNavDrawer({ portal }: Props) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close drawer on route change
  useEffect(() => { setOpen(false); }, [pathname]);

  // Prevent body scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const items = navMap[portal];
  const navTitle = titleMap[portal];

  const drawerContent = (
    <>
      {/* Backdrop — renders to body via portal, no stacking context issues */}
      <div
        onClick={() => setOpen(false)}
        style={{
          position: "fixed", inset: 0, zIndex: 9998,
          backgroundColor: open ? "rgba(0,0,0,0.5)" : "transparent",
          pointerEvents: open ? "auto" : "none",
          transition: "background-color 0.3s",
        }}
      />

      {/* Drawer */}
      <div
        style={{
          position: "fixed", top: 0, left: 0, bottom: 0,
          width: 288, zIndex: 9999,
          backgroundColor: "#ffffff",
          boxShadow: "4px 0 24px rgba(0,0,0,0.18)",
          transform: open ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.3s ease",
          display: "flex", flexDirection: "column",
        }}
      >
        {/* Header */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-zinc-100 px-4">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-icon.svg" alt="ZainStore.pk" className="h-9 w-9 object-contain shrink-0" />
            <div>
              <p className="text-sm font-bold text-zinc-950">ZainStore.pk</p>
              <p className="text-xs text-zinc-400">{navTitle}</p>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-100 transition-colors"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
          {items.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href + "/"));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
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
      </div>
    </>
  );

  return (
    <>
      {/* Hamburger button — stays in topbar flow */}
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden -ml-1 flex h-9 w-9 items-center justify-center rounded-md text-zinc-600 hover:bg-zinc-100 transition-colors"
        aria-label="Open menu"
      >
        <Menu size={21} />
      </button>

      {/* Portal renders drawer directly into document.body — bypasses all stacking contexts */}
      {typeof document !== "undefined" && createPortal(drawerContent, document.body)}
    </>
  );
}
