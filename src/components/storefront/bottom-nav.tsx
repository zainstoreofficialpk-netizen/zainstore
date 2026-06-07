"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Grid3X3, Search, Heart, User } from "lucide-react";

interface Props {
  onCategoryOpen: () => void;
  onSearchOpen: () => void;
  wishlistCount: number;
  isLoggedIn: boolean;
}

export function BottomNavBar({ onCategoryOpen, onSearchOpen, wishlistCount, isLoggedIn }: Props) {
  const pathname = usePathname();

  const items = [
    { label: "Home", icon: Home, href: "/shop", action: null },
    { label: "Categories", icon: Grid3X3, href: null, action: onCategoryOpen },
    { label: "Search", icon: Search, href: null, action: onSearchOpen },
    { label: "Wishlist", icon: Heart, href: isLoggedIn ? "/customer/wishlist" : "/login", action: null, badge: wishlistCount },
    { label: "Account", icon: User, href: isLoggedIn ? "/customer" : "/login", action: null },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-zinc-200 md:hidden safe-area-inset-bottom">
      <div className="flex items-center h-16">
        {items.map(({ label, icon: Icon, href, action, badge }) => {
          const isActive = href ? pathname === href : false;
          const cls = `flex-1 flex flex-col items-center justify-center gap-0.5 h-full transition-colors relative ${
            isActive ? "text-brand-500" : "text-zinc-500 hover:text-brand-500"
          }`;

          if (action) {
            return (
              <button key={label} onClick={action} className={cls}>
                <Icon className="h-[22px] w-[22px]" />
                <span className="text-[10px] font-medium leading-none mt-0.5">{label}</span>
              </button>
            );
          }

          return (
            <Link key={label} href={href!} className={cls}>
              <span className="relative">
                <Icon className="h-[22px] w-[22px]" />
                {badge != null && badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 h-4 min-w-[16px] px-0.5 flex items-center justify-center rounded-full bg-accent-500 text-white text-[9px] font-bold">
                    {badge > 9 ? "9+" : badge}
                  </span>
                )}
              </span>
              <span className="text-[10px] font-medium leading-none mt-0.5">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
