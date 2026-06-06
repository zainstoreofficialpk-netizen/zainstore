import { Search } from "lucide-react";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth/config";
import { ProfileDropdown } from "@/components/dashboard/profile-dropdown";
import { AdminNotificationBell } from "@/components/dashboard/admin-notification-bell";
import { VendorNotificationBell } from "@/components/dashboard/vendor-notification-bell";
import { CustomerNotificationBell } from "@/components/dashboard/customer-notification-bell";

type TopbarProps = { title: string; subtitle: string };

function profileHref(role?: string) {
  if (role === "SUPER_ADMIN") return "/admin/profile";
  if (role === "VENDOR") return "/vendor/profile";
  return "/customer/profile";
}

export async function Topbar({ title, subtitle }: TopbarProps) {
  const session = await getServerSession(authOptions);
  const user = session?.user;

  return (
    <header className="sticky top-0 z-10 border-b border-zinc-100 bg-white/95 backdrop-blur">
      <div className="flex min-h-16 items-center justify-between gap-4 px-4 lg:px-6">
        <div className="min-w-0">
          <h1 className="truncate text-base font-bold text-zinc-950">{title}</h1>
          <p className="truncate text-xs text-zinc-400">{subtitle}</p>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <div className="hidden h-9 w-56 items-center gap-2 rounded-md border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-400 lg:flex">
            <Search size={14} aria-hidden />
            Search…
          </div>

          {user?.role === "SUPER_ADMIN" && <AdminNotificationBell />}
          {user?.role === "VENDOR" && <VendorNotificationBell />}
          {user?.role === "CUSTOMER" && <CustomerNotificationBell />}

          <ProfileDropdown
            name={user?.name ?? "User"}
            email={user?.email ?? ""}
            role={user?.role ?? "CUSTOMER"}
            image={user?.image}
            profileHref={profileHref(user?.role)}
          />
        </div>
      </div>
    </header>
  );
}
