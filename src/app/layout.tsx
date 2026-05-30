import type { Metadata } from "next";
import Link from "next/link";
import { PackageSearch, Store, UserRound } from "lucide-react";

import "./globals.css";

export const metadata: Metadata = {
  title: "ZainStore",
  description: "Multi-vendor ecommerce marketplace built with Next.js.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <header className="border-b border-[var(--line)] bg-[#fffdf8]/90 backdrop-blur">
          <div className="mx-auto flex min-h-16 w-full max-w-6xl items-center justify-between gap-4 px-4">
            <Link className="flex items-center gap-2 text-lg font-bold" href="/">
              <span className="grid size-9 place-items-center rounded-md bg-[var(--brand)] text-white">
                <Store size={20} aria-hidden />
              </span>
              ZainStore
            </Link>
            <nav className="flex items-center gap-1 text-sm font-medium text-[var(--muted)]">
              <Link className="rounded-md px-3 py-2 hover:bg-[#ece7dc] hover:text-[var(--foreground)]" href="/products">
                Products
              </Link>
              <Link className="rounded-md px-3 py-2 hover:bg-[#ece7dc] hover:text-[var(--foreground)]" href="/vendors">
                Vendors
              </Link>
            </nav>
            <div className="flex items-center gap-2">
              <button className="grid size-9 place-items-center rounded-md border border-[var(--line)] bg-white text-[var(--muted)]" type="button" aria-label="Search products">
                <PackageSearch size={18} aria-hidden />
              </button>
              <button className="grid size-9 place-items-center rounded-md border border-[var(--line)] bg-white text-[var(--muted)]" type="button" aria-label="Account">
                <UserRound size={18} aria-hidden />
              </button>
            </div>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
