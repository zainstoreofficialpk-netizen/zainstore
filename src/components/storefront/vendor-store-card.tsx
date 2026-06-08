import Link from "next/link";
import { Store, ShieldCheck, Star, Package, ArrowRight } from "lucide-react";

export type VendorCardData = {
  storeName: string;
  storeSlug: string;
  storeDescription: string | null;
  storeLogo: string | null;
  storeRating: number | null;
  productCount: number;
  trustScore: number | null;
};

export function VendorStoreCard({ vendor }: { vendor: VendorCardData }) {
  return (
    <div className="bg-white rounded-2xl border border-zinc-100 p-5 md:p-6">
      <h3 className="text-sm font-black text-zinc-400 uppercase tracking-wider mb-4">Sold By</h3>

      <div className="flex items-start gap-4">
        {/* Logo */}
        <div className="h-14 w-14 rounded-xl border border-zinc-100 overflow-hidden bg-zinc-50 shrink-0 flex items-center justify-center">
          {vendor.storeLogo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={vendor.storeLogo} alt={vendor.storeName} className="w-full h-full object-cover" />
          ) : (
            <Store className="h-6 w-6 text-zinc-300" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-black text-zinc-900 text-base leading-tight">{vendor.storeName}</p>

          <div className="flex items-center flex-wrap gap-3 mt-1.5 text-xs text-zinc-500">
            {vendor.storeRating !== null && vendor.storeRating > 0 && (
              <span className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                {vendor.storeRating.toFixed(1)} store rating
              </span>
            )}
            <span className="flex items-center gap-1">
              <Package className="h-3 w-3 text-zinc-400" />
              {vendor.productCount} products
            </span>
            {vendor.trustScore !== null && vendor.trustScore >= 80 && (
              <span className="flex items-center gap-1 text-green-600 font-semibold">
                <ShieldCheck className="h-3 w-3" />
                Trusted Seller
              </span>
            )}
          </div>

          {vendor.storeDescription && (
            <p className="text-xs text-zinc-500 mt-2 line-clamp-2 leading-relaxed">
              {vendor.storeDescription}
            </p>
          )}
        </div>
      </div>

      <Link
        href={`/shop/store/${vendor.storeSlug}`}
        className="mt-4 flex items-center justify-center gap-2 w-full h-10 rounded-xl border border-zinc-200 hover:border-brand-300 hover:bg-brand-50 text-sm font-semibold text-zinc-700 hover:text-brand-700 transition-all duration-200"
      >
        Visit Store
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}
