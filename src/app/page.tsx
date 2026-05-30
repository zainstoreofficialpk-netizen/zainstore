import Link from "next/link";
import { ArrowRight, BadgeCheck, Boxes, ShieldCheck, Store } from "lucide-react";

import { ProductCard } from "@/components/product-card";
import { getFeaturedProducts, getVendors } from "@/lib/products";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [products, vendors] = await Promise.all([getFeaturedProducts(), getVendors()]);

  return (
    <main>
      <section className="border-b border-[var(--line)] bg-[#fffdf8]">
        <div className="mx-auto grid min-h-[560px] max-w-6xl items-center gap-10 px-4 py-14 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="max-w-2xl">
            <p className="mb-4 inline-flex items-center gap-2 rounded-md bg-[#ecfdf5] px-3 py-1 text-sm font-semibold text-[var(--brand-strong)]">
              <BadgeCheck size={16} aria-hidden />
              Multi-vendor marketplace starter
            </p>
            <h1 className="text-4xl font-bold leading-tight text-[#172026] sm:text-5xl">
              ZainStore
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-[var(--muted)]">
              A modern ecommerce foundation for onboarding sellers, listing products, managing orders, and scaling a marketplace with one Next.js codebase.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link className="inline-flex items-center gap-2 rounded-md bg-[var(--brand)] px-5 py-3 font-semibold text-white hover:bg-[var(--brand-strong)]" href="/products">
                Browse products
                <ArrowRight size={18} aria-hidden />
              </Link>
              <Link className="inline-flex items-center gap-2 rounded-md border border-[var(--line)] bg-white px-5 py-3 font-semibold hover:bg-[#f2eee5]" href="/vendors">
                View vendors
              </Link>
            </div>
          </div>
          <div className="grid gap-4">
            <div className="rounded-md border border-[var(--line)] bg-white p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-[var(--muted)]">Marketplace health</p>
                  <p className="mt-2 text-3xl font-bold">{vendors.length} vendors</p>
                </div>
                <Store className="text-[var(--brand)]" size={28} aria-hidden />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-md border border-[var(--line)] bg-white p-5">
                <Boxes className="text-[var(--accent)]" size={24} aria-hidden />
                <p className="mt-4 text-2xl font-bold">{products.length}</p>
                <p className="text-sm text-[var(--muted)]">Active products</p>
              </div>
              <div className="rounded-md border border-[var(--line)] bg-white p-5">
                <ShieldCheck className="text-[var(--brand)]" size={24} aria-hidden />
                <p className="mt-4 text-2xl font-bold">Ready</p>
                <p className="text-sm text-[var(--muted)]">Prisma + Postgres</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Featured Products</h2>
            <p className="mt-1 text-[var(--muted)]">Seeded from real vendor records in Postgres.</p>
          </div>
          <Link className="hidden items-center gap-2 font-semibold text-[var(--brand-strong)] sm:inline-flex" href="/products">
            All products
            <ArrowRight size={16} aria-hidden />
          </Link>
        </div>
        {products.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="rounded-md border border-dashed border-[var(--line)] bg-white p-8 text-center text-[var(--muted)]">
            Products will appear here as vendors publish active listings.
          </div>
        )}
      </section>
    </main>
  );
}
