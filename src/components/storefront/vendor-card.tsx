import Link from "next/link";
import { Package, Star } from "lucide-react";

export type VendorCardData = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  description: string | null;
  productCount: number;
  rating: number;
};

const INITIAL_COLORS = [
  "from-brand-100 to-brand-50 text-brand-700 border-brand-100",
  "from-blue-100 to-blue-50 text-blue-700 border-blue-100",
  "from-violet-100 to-violet-50 text-violet-700 border-violet-100",
  "from-green-100 to-green-50 text-green-700 border-green-100",
  "from-rose-100 to-rose-50 text-rose-700 border-rose-100",
  "from-cyan-100 to-cyan-50 text-cyan-700 border-cyan-100",
];

function colorForName(name: string): string {
  const idx = name.charCodeAt(0) % INITIAL_COLORS.length;
  return INITIAL_COLORS[idx];
}

export function VendorCard({ vendor }: { vendor: VendorCardData }) {
  const color = colorForName(vendor.name);

  return (
    <Link
      href={`/shop/store/${vendor.slug}`}
      className="group block bg-white rounded-2xl border border-zinc-100 hover:border-brand-200 hover:shadow-lg transition-all duration-200 p-5"
    >
      <div className="flex items-start gap-3.5 mb-3">
        {vendor.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={vendor.logoUrl}
            alt={vendor.name}
            className="h-12 w-12 rounded-xl object-cover border border-zinc-100 shrink-0"
          />
        ) : (
          <div
            className={`h-12 w-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center border shrink-0`}
          >
            <span className="text-lg font-black">{vendor.name[0].toUpperCase()}</span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-bold text-zinc-900 text-sm leading-tight truncate group-hover:text-brand-600 transition-colors">
            {vendor.name}
          </p>
          {vendor.rating > 0 ? (
            <div className="flex items-center gap-1 mt-1">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 shrink-0" />
              <span className="text-xs font-semibold text-zinc-600">{vendor.rating.toFixed(1)}</span>
              <span className="text-xs text-zinc-400">rating</span>
            </div>
          ) : (
            <p className="text-xs text-zinc-400 mt-1">New Seller</p>
          )}
        </div>
      </div>

      {vendor.description && (
        <p className="text-xs text-zinc-500 line-clamp-2 mb-3 leading-relaxed">{vendor.description}</p>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-zinc-50">
        <span className="flex items-center gap-1.5 text-xs text-zinc-400 font-medium">
          <Package className="h-3.5 w-3.5" />
          {vendor.productCount} {vendor.productCount === 1 ? "product" : "products"}
        </span>
        <span className="text-xs font-bold text-brand-500 group-hover:gap-1.5 flex items-center gap-1 transition-all">
          Visit Store
          <span className="group-hover:translate-x-0.5 transition-transform inline-block">→</span>
        </span>
      </div>
    </Link>
  );
}
