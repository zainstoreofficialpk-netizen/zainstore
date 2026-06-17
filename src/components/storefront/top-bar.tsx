"use client";

import Link from "next/link";
import { Phone, MapPin, HelpCircle } from "lucide-react";

type SessionUser = { name: string | null; role: string } | null;

export function TopBar({ user }: { user: SessionUser }) {
  return (
    <div className="bg-zinc-900 text-zinc-400 text-xs border-b border-zinc-800 overflow-hidden">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex items-center justify-between h-8 gap-4 min-w-0">

          {/* Left: contact info */}
          <div className="flex items-center gap-4 min-w-0 overflow-hidden">
            <a
              href="tel:03478913290"
              className="flex items-center gap-1.5 text-zinc-400 hover:text-zinc-200 transition-colors whitespace-nowrap"
            >
              <Phone className="h-3 w-3 shrink-0" />
              <span className="hidden sm:inline">0347-891-3290</span>
              <span className="sm:hidden">Call Us</span>
            </a>
            <div className="hidden sm:block h-3 w-px bg-zinc-700" />
            <Link
              href="/shop/track-order"
              className="hidden sm:flex items-center gap-1.5 text-zinc-400 hover:text-zinc-200 transition-colors whitespace-nowrap"
            >
              <MapPin className="h-3 w-3" />
              Track Order
            </Link>
            <div className="hidden md:block h-3 w-px bg-zinc-700" />
            <Link
              href="/shop/contact"
              className="hidden md:flex items-center gap-1.5 text-zinc-400 hover:text-zinc-200 transition-colors whitespace-nowrap"
            >
              Contact Us
            </Link>
          </div>

          {/* Right: account + help */}
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/shop/help"
              className="hidden md:flex items-center gap-1.5 text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              <HelpCircle className="h-3 w-3" />
              Help Center
            </Link>
            <div className="hidden md:block h-3 w-px bg-zinc-700" />

            {user ? (
              <span className="text-zinc-300 whitespace-nowrap">
                Hi, <span className="text-zinc-200 font-semibold">{user.name?.split(" ")[0]}</span>
              </span>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="text-zinc-400 hover:text-zinc-200 transition-colors whitespace-nowrap"
                >
                  Sign In
                </Link>
                <span className="text-zinc-700">|</span>
                <Link
                  href="/register/customer"
                  className="text-zinc-400 hover:text-zinc-200 transition-colors whitespace-nowrap"
                >
                  Register
                </Link>
              </div>
            )}

            <div className="hidden sm:block h-3 w-px bg-zinc-700" />
            <Link
              href="/register/vendor"
              className="hidden sm:block text-brand-400 hover:text-brand-300 transition-colors font-medium whitespace-nowrap"
            >
              Sell on ZainStore
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
