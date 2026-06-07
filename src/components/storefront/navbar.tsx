"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import {
  Menu, Heart, ShoppingCart, User, ChevronDown, LogOut,
  Package, Settings, Shield, Store, Zap,
} from "lucide-react";
import { SearchBar } from "./search-bar";
import { MegaMenu } from "./mega-menu";

type NavCategory = { id: string; name: string; slug: string; children: { id: string; name: string; slug: string }[] };
type NavBrand = { id: string; name: string; logoUrl: string | null };
type SessionUser = { id: string; name: string | null; email: string | null; image: string | null; role: string } | null;

interface Props {
  categories: NavCategory[];
  brands: NavBrand[];
  user: SessionUser;
  onMenuOpen: () => void;
}

function CurrencySelector() {
  const [currency, setCurrency] = useState("PKR");
  useEffect(() => {
    const saved = localStorage.getItem("zs_currency");
    if (saved) setCurrency(saved);
  }, []);
  function toggle() {
    const next = currency === "PKR" ? "USD" : "PKR";
    setCurrency(next);
    localStorage.setItem("zs_currency", next);
  }
  return (
    <button onClick={toggle}
      className="hidden lg:flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors">
      {currency === "PKR" ? "🇵🇰" : "🇺🇸"} {currency} <ChevronDown className="h-3 w-3" />
    </button>
  );
}

export function Navbar({ categories, brands, user, onMenuOpen }: Props) {
  const [scrolled, setScrolled] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const megaTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const accountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Cart from localStorage
  useEffect(() => {
    function sync() {
      try {
        const cart: { qty?: number }[] = JSON.parse(localStorage.getItem("zs_cart") ?? "[]");
        setCartCount(cart.reduce((s, i) => s + (i.qty ?? 1), 0));
      } catch { setCartCount(0); }
    }
    sync();
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  // Wishlist from API
  useEffect(() => {
    if (!user) return;
    fetch("/api/customer/wishlist/count")
      .then((r) => r.json())
      .then((d) => setWishlistCount(d.count ?? 0))
      .catch(() => {});
  }, [user]);

  // Close account on outside click
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) setAccountOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const openMega = useCallback(() => {
    if (megaTimer.current) clearTimeout(megaTimer.current);
    setMegaOpen(true);
  }, []);

  const closeMega = useCallback(() => {
    megaTimer.current = setTimeout(() => setMegaOpen(false), 120);
  }, []);

  function dashboardHref() {
    if (!user) return "/login";
    if (user.role === "SUPER_ADMIN") return "/admin";
    if (user.role === "VENDOR") return "/vendor";
    return "/customer";
  }

  return (
    <header className={`w-full bg-white transition-shadow duration-300 ${scrolled ? "shadow-lg" : "shadow-sm"}`}>
      {/* ── Main bar ── */}
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex items-center gap-3 h-16">
          {/* Hamburger (mobile) */}
          <button onClick={onMenuOpen} className="md:hidden p-2 text-zinc-600 hover:text-zinc-900 -ml-1">
            <Menu className="h-5 w-5" />
          </button>

          {/* Logo */}
          <Link href="/shop" className="shrink-0 flex items-center gap-1.5">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center shadow-sm">
              <span className="text-white font-black text-base leading-none">Z</span>
            </div>
            <span className="hidden sm:block font-black text-zinc-900 text-[17px] tracking-tight">
              Zain<span className="text-brand-500">Store</span>
              <span className="text-zinc-300 font-normal text-xs">.pk</span>
            </span>
          </Link>

          {/* Search — desktop */}
          <div className="hidden md:flex flex-1 max-w-2xl mx-2">
            <SearchBar />
          </div>

          {/* Right cluster */}
          <div className="flex items-center gap-1 ml-auto md:ml-0">
            <CurrencySelector />

            {/* Wishlist */}
            <Link href={user ? "/customer/wishlist" : "/login"}
              className="relative p-2.5 text-zinc-600 hover:text-brand-500 transition-colors rounded-xl hover:bg-zinc-50">
              <Heart className="h-[22px] w-[22px]" />
              {wishlistCount > 0 && (
                <span className="absolute top-1 right-1 h-4 w-4 flex items-center justify-center rounded-full bg-accent-500 text-white text-[9px] font-bold">
                  {wishlistCount > 9 ? "9+" : wishlistCount}
                </span>
              )}
            </Link>

            {/* Cart */}
            <Link href="/shop/cart"
              className="relative p-2.5 text-zinc-600 hover:text-brand-500 transition-colors rounded-xl hover:bg-zinc-50">
              <ShoppingCart className="h-[22px] w-[22px]" />
              {cartCount > 0 && (
                <span className="absolute top-1 right-1 h-4 w-4 flex items-center justify-center rounded-full bg-accent-500 text-white text-[9px] font-bold">
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              )}
            </Link>

            {/* Account */}
            <div ref={accountRef} className="relative">
              <button
                onClick={() => setAccountOpen((p) => !p)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-zinc-700 hover:bg-zinc-50 transition-colors"
              >
                {user?.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.image} alt="" className="h-7 w-7 rounded-full object-cover ring-2 ring-brand-200" />
                ) : (
                  <div className="h-7 w-7 rounded-full bg-zinc-100 flex items-center justify-center">
                    <User className="h-4 w-4 text-zinc-500" />
                  </div>
                )}
                <span className="hidden md:block text-sm font-semibold max-w-[90px] truncate">
                  {user ? user.name?.split(" ")[0] : "Account"}
                </span>
                <ChevronDown className="hidden md:block h-3.5 w-3.5 text-zinc-400" />
              </button>

              {accountOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-zinc-100 overflow-hidden z-50 py-1.5">
                  {user ? (
                    <>
                      <div className="px-4 py-3 border-b border-zinc-50">
                        <p className="text-sm font-semibold text-zinc-900 truncate">{user.name}</p>
                        <p className="text-xs text-zinc-400 truncate mt-0.5">{user.email}</p>
                      </div>
                      <Link href={dashboardHref()} onClick={() => setAccountOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50">
                        <Package className="h-4 w-4 text-zinc-400" /> My Dashboard
                      </Link>
                      <Link href="/customer/orders" onClick={() => setAccountOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50">
                        <ShoppingCart className="h-4 w-4 text-zinc-400" /> My Orders
                      </Link>
                      <Link href="/customer/settings" onClick={() => setAccountOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50">
                        <Settings className="h-4 w-4 text-zinc-400" /> Settings
                      </Link>
                      {user.role === "VENDOR" && (
                        <Link href="/vendor" onClick={() => setAccountOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50">
                          <Store className="h-4 w-4 text-zinc-400" /> Vendor Dashboard
                        </Link>
                      )}
                      {user.role === "SUPER_ADMIN" && (
                        <Link href="/admin" onClick={() => setAccountOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50">
                          <Shield className="h-4 w-4 text-zinc-400" /> Admin Panel
                        </Link>
                      )}
                      <div className="border-t border-zinc-50 mt-1 pt-1">
                        <button
                          onClick={() => { setAccountOpen(false); signOut({ callbackUrl: "/shop" }); }}
                          className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                        >
                          <LogOut className="h-4 w-4" /> Sign Out
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="px-4 pb-3 pt-2">
                        <Link href="/login" onClick={() => setAccountOpen(false)}
                          className="flex items-center justify-center py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm rounded-xl transition-colors">
                          Sign In
                        </Link>
                        <Link href="/register/customer" onClick={() => setAccountOpen(false)}
                          className="flex items-center justify-center mt-2 py-2.5 border border-zinc-200 hover:border-zinc-300 text-zinc-700 font-medium text-sm rounded-xl transition-colors">
                          Create Account
                        </Link>
                      </div>
                      <div className="border-t border-zinc-100 px-4 py-2.5">
                        <Link href="/register/vendor" onClick={() => setAccountOpen(false)}
                          className="flex items-center gap-2 text-xs text-zinc-500 hover:text-brand-500 transition-colors">
                          <Zap className="h-3.5 w-3.5" /> Sell on ZainStore
                        </Link>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile search bar */}
        <div className="md:hidden pb-3">
          <SearchBar />
        </div>
      </div>

      {/* ── Secondary nav bar (desktop) ── */}
      <div className="hidden md:block border-t border-zinc-100 bg-white">
        <div className="container mx-auto px-4 max-w-7xl flex items-center gap-0">
          {/* Browse Categories mega trigger */}
          <div
            className="relative shrink-0"
            onMouseEnter={openMega}
            onMouseLeave={closeMega}
          >
            <button
              onClick={() => setMegaOpen((o) => !o)}
              className="flex items-center gap-2 px-5 py-3 text-sm font-bold bg-brand-500 hover:bg-brand-600 text-white transition-colors"
            >
              <Menu className="h-4 w-4" />
              Browse Categories
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${megaOpen ? "rotate-180" : ""}`} />
            </button>

            {megaOpen && (
              <div
                className="absolute top-full left-0 w-[720px] bg-white shadow-2xl border border-zinc-100 rounded-b-2xl overflow-hidden z-50"
                onMouseEnter={openMega}
                onMouseLeave={closeMega}
              >
                <MegaMenu categories={categories} brands={brands} onClose={() => setMegaOpen(false)} />
              </div>
            )}
          </div>

          {/* Primary nav items */}
          <nav className="flex items-center flex-1">
            <Link
              href="/shop/stores"
              className="px-5 py-3 text-sm font-semibold text-zinc-700 hover:text-brand-500 hover:bg-zinc-50 transition-colors whitespace-nowrap"
            >
              Stores
            </Link>
            <Link
              href="/shop"
              className="px-5 py-3 text-sm font-semibold text-zinc-700 hover:text-brand-500 hover:bg-zinc-50 transition-colors whitespace-nowrap"
            >
              Shop
            </Link>
            <Link
              href="/shop/sale"
              className="px-5 py-3 text-sm font-bold text-accent-500 hover:bg-accent-50 transition-colors whitespace-nowrap"
            >
              Sale Deals
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
