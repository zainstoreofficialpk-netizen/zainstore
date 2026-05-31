"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import {
  Bell,
  ChevronDown,
  KeyRound,
  LogOut,
  Settings,
  ShieldCheck,
  User,
  UserPen,
} from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const roleLabels: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  VENDOR: "Vendor",
  CUSTOMER: "Customer",
};

const roleTones: Record<string, "default" | "accent" | "muted"> = {
  SUPER_ADMIN: "accent",
  VENDOR: "default",
  CUSTOMER: "muted",
};

type Props = {
  name: string;
  email: string;
  role: string;
  image?: string | null;
  profileHref: string;
};

export function ProfileDropdown({ name, email, role, image, profileHref }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  const menuItems = [
    { icon: User,    label: "My Profile",            href: profileHref },
    { icon: UserPen, label: "Edit Profile",           href: `${profileHref}?tab=edit` },
    { icon: KeyRound,label: "Change Password",        href: `${profileHref}?tab=security` },
    { icon: Settings,label: "Account Settings",       href: `${profileHref}?tab=settings` },
    { icon: Bell,    label: "Notification Settings",  href: `${profileHref}?tab=notifications` },
  ];

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-sm text-zinc-700 transition hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
        aria-expanded={open}
        aria-haspopup="true"
      >
        <Avatar name={name} image={image} size="xs" />
        <span className="hidden max-w-[120px] truncate font-medium md:block">{name}</span>
        <ChevronDown
          size={14}
          className={`shrink-0 text-zinc-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown panel */}
      <div
        className={`absolute right-0 top-full z-50 mt-2 w-72 origin-top-right overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl transition-all duration-200 ${
          open ? "scale-100 opacity-100" : "pointer-events-none scale-95 opacity-0"
        }`}
      >
        {/* User header */}
        <div className="flex items-center gap-3 bg-gradient-to-r from-brand-50 via-white to-accent-50 p-4">
          <Avatar name={name} image={image} size="md" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-zinc-950">{name}</p>
            <p className="truncate text-xs text-zinc-500">{email}</p>
            <Badge tone={roleTones[role] ?? "muted"} className="mt-1">
              {roleLabels[role] ?? role}
            </Badge>
          </div>
        </div>

        {/* Menu */}
        <nav className="p-1.5">
          {menuItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-zinc-700 transition hover:bg-zinc-50 hover:text-zinc-950"
            >
              <item.icon size={16} className="shrink-0 text-zinc-400" aria-hidden />
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Divider + logout */}
        <div className="border-t border-zinc-100 p-1.5">
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-rose-600 transition hover:bg-rose-50"
          >
            <LogOut size={16} className="shrink-0" aria-hidden />
            Sign out
          </button>
        </div>

        {/* Verified badge */}
        <div className="border-t border-zinc-100 px-4 py-2">
          <p className="flex items-center gap-1.5 text-xs text-zinc-400">
            <ShieldCheck size={12} className="text-emerald-500" />
            Secure session active
          </p>
        </div>
      </div>
    </div>
  );
}
