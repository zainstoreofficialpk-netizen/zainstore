"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { X, ChevronDown, ChevronRight, Home, ShoppingCart, Heart, User, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

type NavCategory = { id: string; name: string; slug: string; children: { id: string; name: string; slug: string }[] };
type SessionUser = { id: string; name: string | null; email: string | null; image: string | null; role: string } | null;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  categories: NavCategory[];
  user: SessionUser;
}

export function MobileDrawer({ isOpen, onClose, categories, user }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  function dashboardHref() {
    if (!user) return "/login";
    if (user.role === "SUPER_ADMIN") return "/admin";
    if (user.role === "VENDOR") return "/vendor";
    return "/customer";
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      />

      {/* Drawer */}
      <aside
        className={`fixed top-0 left-0 h-full w-[300px] max-w-[85vw] bg-white z-50 flex flex-col transition-transform duration-300 ease-in-out shadow-2xl ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 bg-brand-500">
          <div className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-icon.svg" alt="ZainStore.pk" className="h-8 w-8 object-contain brightness-0 invert" />
            <div>
              <p className="text-white font-black text-base tracking-tight leading-none">ZainStore<span className="text-white/70">.pk</span></p>
              <p className="text-white/75 text-xs mt-0.5">
                {user ? `Hi, ${user.name?.split(" ")[0] ?? "there"}!` : "Welcome, Guest"}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">
          {/* Quick links */}
          <div className="grid grid-cols-3 gap-2 p-4 border-b border-zinc-100">
            {[
              { icon: Home, label: "Home", href: "/shop" },
              { icon: Heart, label: "Wishlist", href: user ? "/customer/wishlist" : "/login" },
              { icon: ShoppingCart, label: "Cart", href: "/shop/cart" },
            ].map(({ icon: Icon, label, href }) => (
              <Link key={label} href={href} onClick={onClose}
                className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-zinc-50 hover:bg-brand-50 hover:text-brand-600 text-zinc-600 text-xs font-medium transition-colors">
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </div>

          {/* Browse all products */}
          <Link href="/shop/browse" onClick={onClose}
            className="flex items-center justify-between mx-4 mt-3 mb-1 px-4 py-3 bg-brand-50 rounded-xl text-sm font-bold text-brand-700 hover:bg-brand-100 transition-colors">
            <span>Browse All Products</span>
            <ChevronRight className="h-4 w-4" />
          </Link>

          {/* Categories */}
          <div className="px-4 pt-4 pb-1">
            <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Shop by Category</p>
          </div>
          {categories.map((cat) => (
            <div key={cat.id}>
              <div
                onClick={() => {
                  if (cat.children.length === 0) onClose();
                  else setExpanded(expanded === cat.id ? null : cat.id);
                }}
                className="flex items-center justify-between px-4 py-3 hover:bg-zinc-50 cursor-pointer border-b border-zinc-50"
              >
                <Link
                  href={`/shop/category/${cat.slug}`}
                  onClick={(e) => { if (cat.children.length > 0) e.preventDefault(); else onClose(); }}
                  className="text-sm font-medium text-zinc-800"
                >
                  {cat.name}
                </Link>
                {cat.children.length > 0 && (
                  <ChevronDown className={`h-4 w-4 text-zinc-400 transition-transform duration-200 ${expanded === cat.id ? "rotate-180" : ""}`} />
                )}
              </div>
              {expanded === cat.id && (
                <div className="bg-zinc-50/60">
                  {cat.children.map((sub) => (
                    <Link key={sub.id} href={`/shop/category/${sub.slug}`} onClick={onClose}
                      className="flex items-center gap-2 px-8 py-2.5 text-sm text-zinc-600 hover:text-brand-500 border-b border-zinc-50 transition-colors">
                      <ChevronRight className="h-3 w-3 text-zinc-400" />
                      {sub.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Account section */}
          <div className="px-4 pt-4 pb-1 mt-1 border-t border-zinc-100">
            <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Account</p>
          </div>
          {user ? (
            <>
              <Link href={dashboardHref()} onClick={onClose}
                className="flex items-center gap-3 px-4 py-3 text-sm text-zinc-700 hover:bg-zinc-50 border-b border-zinc-50">
                <User className="h-4 w-4 text-zinc-400" /> My Dashboard
              </Link>
              <Link href="/customer/orders" onClick={onClose}
                className="flex items-center gap-3 px-4 py-3 text-sm text-zinc-700 hover:bg-zinc-50 border-b border-zinc-50">
                <ShoppingCart className="h-4 w-4 text-zinc-400" /> My Orders
              </Link>
              <button
                onClick={() => { onClose(); signOut({ callbackUrl: "/shop" }); }}
                className="flex items-center gap-3 w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 text-left"
              >
                <LogOut className="h-4 w-4" /> Sign Out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" onClick={onClose}
                className="flex items-center justify-center mx-4 my-2 py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm rounded-xl transition-colors">
                Sign In
              </Link>
              <Link href="/register/customer" onClick={onClose}
                className="flex items-center justify-center mx-4 mb-2 py-2.5 border border-zinc-200 hover:border-zinc-300 text-zinc-700 font-medium text-sm rounded-xl transition-colors">
                Create Account
              </Link>
              <Link href="/register/vendor" onClick={onClose}
                className="flex items-center justify-center px-4 py-2.5 text-xs text-zinc-500 hover:text-brand-500 transition-colors">
                Sell on ZainStore →
              </Link>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-zinc-100 text-center">
          <p className="text-[11px] text-zinc-400">© 2024 ZainStore.pk</p>
        </div>
      </aside>
    </>
  );
}
