import Link from "next/link";
import { ArrowRight, Store } from "lucide-react";

import { getVendors } from "@/lib/products";

export const dynamic = "force-dynamic";

export default async function VendorsPage() {
  const vendors = await getVendors();

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Vendors</h1>
        <p className="mt-2 text-[var(--muted)]">Seller storefronts ready for onboarding, moderation, and payouts.</p>
      </div>
      {vendors.length > 0 ? (
        <div className="grid gap-5 md:grid-cols-2">
          {vendors.map((vendor) => (
            <article className="rounded-md border border-[var(--line)] bg-white p-5" key={vendor.id}>
              <div className="flex items-start gap-4">
                <div className="grid size-12 shrink-0 place-items-center rounded-md bg-[#ecfdf5] text-[var(--brand-strong)]">
                  <Store size={24} aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-xl font-bold">{vendor.storeName}</h2>
                  <p className="mt-1 text-sm leading-6 text-[var(--muted)]">{vendor.description}</p>
                  <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
                    <span className="rounded-md bg-[#f2eee5] px-2 py-1 font-medium">{vendor._count.products} products</span>
                    <span className="rounded-md bg-[#ecfdf5] px-2 py-1 font-medium text-[var(--brand-strong)]">{vendor.status.toLowerCase()}</span>
                  </div>
                </div>
              </div>
              <Link className="mt-5 inline-flex items-center gap-2 font-semibold text-[var(--brand-strong)]" href={`/vendors/${vendor.slug}`}>
                Open storefront
                <ArrowRight size={16} aria-hidden />
              </Link>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-md border border-dashed border-[var(--line)] bg-white p-8 text-center text-[var(--muted)]">
          No vendors found.
        </div>
      )}
    </main>
  );
}
