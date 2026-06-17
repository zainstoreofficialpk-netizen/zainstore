import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Store } from "lucide-react";
import { db } from "@/lib/db";
import { getAllStores } from "@/lib/storefront/store-data";
import { StoresDirectory } from "@/components/storefront/stores-directory";

export const metadata: Metadata = {
  title: "All Stores — ZainStore.pk",
  description: "Browse all verified vendor stores on ZainStore.pk — Pakistan's premier multi-vendor marketplace.",
  alternates: { canonical: "https://zainstore.pk/shop/stores" },
  openGraph: {
    title: "All Stores — ZainStore.pk",
    description: "Browse all verified vendor stores on ZainStore.pk — Pakistan's premier multi-vendor marketplace.",
    url: "https://zainstore.pk/shop/stores",
    siteName: "ZainStore.pk",
    type: "website",
  },
};

export default async function StoresPage() {
  const [{ stores, total }, categories] = await Promise.all([
    getAllStores({ sort: "featured", page: 1, limit: 24 }),
    db.category.findMany({
      where: { parentId: null },
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true },
    }),
  ]);

  // Stats for hero
  const [activeVendors, totalProducts] = await Promise.all([
    db.store.count({ where: { vacationMode: false, vendor: { status: "ACTIVE" } } }),
    db.product.count({ where: { status: "ACTIVE" } }),
  ]);

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Hero Banner */}
      <div className="bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 text-white">
        <div className="container mx-auto px-4 max-w-7xl py-12 md:py-16">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs text-zinc-400 mb-6">
            <Link href="/shop" className="hover:text-white transition-colors">Home</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-zinc-200 font-semibold">All Stores</span>
          </nav>

          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-xl bg-brand-500 flex items-center justify-center shrink-0">
                  <Store className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-xs font-bold text-brand-400 uppercase tracking-widest">Vendor Directory</p>
                  <h1 className="text-3xl font-black leading-tight">All Stores</h1>
                </div>
              </div>
              <p className="text-zinc-400 text-sm max-w-lg leading-relaxed">
                Discover verified vendors selling authentic products across Pakistan. Every store is reviewed and approved before going live.
              </p>
            </div>

            {/* Stats */}
            <div className="flex gap-6 shrink-0">
              {[
                { value: activeVendors, label: "Active Stores" },
                { value: `${totalProducts.toLocaleString()}+`, label: "Products" },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <p className="text-2xl font-black text-brand-400">{s.value}</p>
                  <p className="text-xs text-zinc-400 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Directory */}
      <StoresDirectory
        initialStores={stores}
        initialTotal={total}
        categories={categories}
      />

      {/* Become a Vendor CTA */}
      <div className="bg-gradient-to-r from-brand-500 to-brand-400 py-12">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <h2 className="text-2xl font-black text-white mb-2">Ready to Start Selling?</h2>
          <p className="text-white/80 text-sm mb-6">
            Join thousands of vendors on Pakistan&apos;s fastest growing marketplace. Set up your store in minutes.
          </p>
          <Link
            href="/register/vendor"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-brand-600 font-black text-sm rounded-xl hover:bg-zinc-50 shadow-lg hover:shadow-xl transition-all"
          >
            Open Your Store — It&apos;s Free
          </Link>
        </div>
      </div>
    </div>
  );
}
