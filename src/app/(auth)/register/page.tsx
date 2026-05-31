import Link from "next/link";
import { ShoppingBag, Store } from "lucide-react";

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-2xl">

        <div className="mb-10 text-center">
          <div className="mb-4 flex justify-center">
            <span className="grid size-12 place-items-center rounded-xl bg-brand-500 text-white">
              <Store size={24} aria-hidden />
            </span>
          </div>
          <h1 className="text-2xl font-bold text-zinc-950">Join ZainStore.pk</h1>
          <p className="mt-2 text-sm text-zinc-500">Choose how you want to use the platform</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Customer */}
          <Link
            href="/register/customer"
            className="group flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:border-brand-400 hover:shadow-md"
          >
            <div className="grid size-12 place-items-center rounded-xl bg-brand-50 text-brand-600 transition group-hover:bg-brand-100">
              <ShoppingBag size={24} aria-hidden />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-zinc-950">Shop on ZainStore</h2>
              <p className="mt-1 text-sm leading-6 text-zinc-500">
                Create a buyer account to browse products, place orders, manage your wishlist, and track deliveries.
              </p>
            </div>
            <span className="mt-auto inline-flex items-center text-sm font-semibold text-brand-600 group-hover:underline">
              Create customer account →
            </span>
          </Link>

          {/* Vendor */}
          <Link
            href="/register/vendor"
            className="group flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:border-brand-400 hover:shadow-md"
          >
            <div className="grid size-12 place-items-center rounded-xl bg-amber-50 text-amber-700 transition group-hover:bg-amber-100">
              <Store size={24} aria-hidden />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-zinc-950">Sell on ZainStore</h2>
              <p className="mt-1 text-sm leading-6 text-zinc-500">
                Apply as a vendor to list products, manage your store, process orders, and receive payouts.
              </p>
            </div>
            <span className="mt-auto inline-flex items-center text-sm font-semibold text-brand-600 group-hover:underline">
              Apply as a vendor →
            </span>
          </Link>
        </div>

        <p className="mt-8 text-center text-sm text-zinc-500">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-brand-600 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
