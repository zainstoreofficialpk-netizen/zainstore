import Link from "next/link";
import { ArrowRight, Star, Package, Medal, ShoppingBag, Shield } from "lucide-react";
import type { getFeaturedStores } from "@/lib/storefront/store-data";

type Store = Awaited<ReturnType<typeof getFeaturedStores>>[number];

const BANNER_GRADIENTS = [
  "from-violet-500 via-purple-500 to-indigo-600",
  "from-rose-400 via-pink-500 to-fuchsia-600",
  "from-amber-400 via-orange-500 to-red-500",
  "from-emerald-400 via-teal-500 to-cyan-600",
  "from-blue-400 via-indigo-500 to-violet-600",
  "from-pink-400 via-rose-500 to-orange-400",
  "from-teal-400 via-cyan-500 to-blue-500",
  "from-orange-400 via-amber-500 to-yellow-400",
  "from-indigo-500 via-blue-500 to-cyan-400",
  "from-fuchsia-500 via-violet-500 to-purple-600",
  "from-green-400 via-emerald-500 to-teal-500",
  "from-cyan-400 via-sky-500 to-blue-600",
];

const LOGO_GRADIENTS = [
  "from-violet-500 to-indigo-600",
  "from-rose-500 to-fuchsia-600",
  "from-amber-500 to-orange-600",
  "from-emerald-500 to-teal-600",
  "from-blue-500 to-violet-600",
  "from-pink-500 to-rose-600",
  "from-teal-500 to-cyan-600",
  "from-orange-500 to-amber-600",
  "from-indigo-500 to-blue-600",
  "from-fuchsia-500 to-purple-600",
  "from-green-500 to-emerald-600",
  "from-cyan-500 to-sky-600",
];

function bannerFor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
  return BANNER_GRADIENTS[h % BANNER_GRADIENTS.length];
}

function gradientFor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 17 + name.charCodeAt(i)) & 0xffff;
  return LOGO_GRADIENTS[h % LOGO_GRADIENTS.length];
}

function VendorCard({ store, rank }: { store: Store; rank: number }) {
  const banner = bannerFor(store.name);
  const grad = gradientFor(store.name);

  return (
    <Link
      href={`/shop/store/${store.slug}`}
      className="group relative block bg-white rounded-2xl border border-zinc-100 hover:border-brand-200 hover:shadow-xl transition-all duration-200 overflow-hidden"
    >
      {/* Banner — always a color gradient */}
      <div className={`relative h-24 bg-gradient-to-br ${banner}`}>
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />

        {/* Featured badge */}
        {store.featured && (
          <span className="absolute top-2 left-2 flex items-center gap-1 bg-brand-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow">
            <Medal className="h-2.5 w-2.5" /> Featured
          </span>
        )}

        {/* Rank */}
        {!store.featured && rank <= 3 && (
          <span className="absolute top-2 right-2 h-6 w-6 rounded-full bg-white/90 flex items-center justify-center text-xs font-black text-zinc-700 shadow">
            #{rank}
          </span>
        )}
      </div>

      {/* Logo + name */}
      <div className="flex items-start gap-3 px-4 pt-2 pb-4">
        <div className="h-11 w-11 rounded-xl border-2 border-white shadow-md overflow-hidden bg-white shrink-0 -mt-7">
          {store.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={store.logoUrl} alt={store.name} className="w-full h-full object-cover" />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${grad} flex items-center justify-center`}>
              <span className="text-white font-black text-base">{store.name[0].toUpperCase()}</span>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0 pt-1">
          <p className="font-black text-zinc-900 text-sm leading-tight truncate group-hover:text-brand-600 transition-colors">
            {store.name}
          </p>
          <div className="flex items-center gap-1 mt-0.5">
            <Star className={`h-3 w-3 ${store.avgRating > 0 ? "fill-yellow-400 text-yellow-400" : "fill-zinc-200 text-zinc-200"}`} />
            <span className="text-xs font-semibold text-zinc-600">
              {store.avgRating > 0 ? store.avgRating.toFixed(1) : "New"}
            </span>
            {store.totalReviews > 0 && <span className="text-xs text-zinc-400">({store.totalReviews})</span>}
          </div>
        </div>
      </div>

      {store.description && (
        <p className="px-4 pb-3 text-xs text-zinc-500 line-clamp-1 leading-relaxed">{store.description}</p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between px-4 pb-3.5 pt-2 border-t border-zinc-50">
        <span className="flex items-center gap-1.5 text-xs text-zinc-400 font-medium">
          <Package className="h-3.5 w-3.5" />
          {store.productCount} products
        </span>
        <span className="flex items-center gap-1 text-xs font-bold text-brand-500 group-hover:gap-1.5 transition-all">
          Visit <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
        </span>
      </div>
    </Link>
  );
}

export function HomepageVendorSection({ stores }: { stores: Store[] }) {
  if (stores.length === 0) return null;

  const featured = stores.filter((s) => s.featured);
  const topRated = [...stores].sort((a, b) => b.avgRating - a.avgRating || b.totalReviews - a.totalReviews).slice(0, 4);
  const newest = [...stores].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 4);

  return (
    <section className="bg-zinc-50 border-t border-zinc-100">
      <div className="container mx-auto px-4 max-w-7xl py-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-0.5">Our Sellers</p>
            <h2 className="text-2xl font-black text-zinc-900">Discover Vendor Stores</h2>
          </div>
          <Link
            href="/shop/stores"
            className="flex items-center gap-1.5 text-sm font-semibold text-brand-500 hover:text-brand-600 transition-colors"
          >
            View All Stores <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Featured Stores row */}
        {featured.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Medal className="h-4 w-4 text-brand-500" />
              <p className="text-sm font-black text-zinc-700">Featured Stores</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4">
              {featured.slice(0, 4).map((store, i) => (
                <VendorCard key={store.id} store={store} rank={i + 1} />
              ))}
            </div>
          </div>
        )}

        {/* Two-column: Top Rated + Newest */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Rated */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <p className="text-sm font-black text-zinc-700">Top Rated Stores</p>
              </div>
              <Link href="/shop/stores?sort=top_rated" className="text-xs font-semibold text-brand-500 hover:text-brand-600 transition-colors">
                See all →
              </Link>
            </div>
            <div className="space-y-2.5">
              {topRated.map((store, i) => (
                <Link
                  key={store.id}
                  href={`/shop/store/${store.slug}`}
                  className="group flex items-center gap-3 bg-white rounded-xl border border-zinc-100 hover:border-brand-200 hover:shadow-md p-3 transition-all"
                >
                  <span className="text-xs font-black text-zinc-300 w-5 text-center shrink-0">#{i + 1}</span>
                  <div className="h-10 w-10 rounded-xl overflow-hidden bg-zinc-100 shrink-0">
                    {store.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={store.logoUrl} alt={store.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className={`w-full h-full bg-gradient-to-br ${gradientFor(store.name)} flex items-center justify-center`}>
                        <span className="text-white font-black text-sm">{store.name[0].toUpperCase()}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-zinc-800 text-sm truncate group-hover:text-brand-600 transition-colors">{store.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="flex gap-0.5">
                        {[1,2,3,4,5].map((s) => (
                          <Star key={s} className={`h-2.5 w-2.5 ${s <= Math.round(store.avgRating) ? "fill-yellow-400 text-yellow-400" : "fill-zinc-200 text-zinc-200"}`} />
                        ))}
                      </div>
                      <span className="text-xs text-zinc-400">{store.totalReviews} reviews</span>
                    </div>
                  </div>
                  <span className="text-xs text-zinc-400 font-medium shrink-0">{store.productCount}p</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Newest */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-emerald-500" />
                <p className="text-sm font-black text-zinc-700">New Stores</p>
              </div>
              <Link href="/shop/stores?sort=newest" className="text-xs font-semibold text-brand-500 hover:text-brand-600 transition-colors">
                See all →
              </Link>
            </div>
            <div className="space-y-2.5">
              {newest.map((store, i) => (
                <Link
                  key={store.id}
                  href={`/shop/store/${store.slug}`}
                  className="group flex items-center gap-3 bg-white rounded-xl border border-zinc-100 hover:border-brand-200 hover:shadow-md p-3 transition-all"
                >
                  <div className="h-10 w-10 rounded-xl overflow-hidden bg-zinc-100 shrink-0">
                    {store.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={store.logoUrl} alt={store.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className={`w-full h-full bg-gradient-to-br ${gradientFor(store.name)} flex items-center justify-center`}>
                        <span className="text-white font-black text-sm">{store.name[0].toUpperCase()}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-zinc-800 text-sm truncate group-hover:text-brand-600 transition-colors">{store.name}</p>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {new Date(store.createdAt).toLocaleDateString("en-PK", { month: "short", year: "numeric" })} · {store.productCount} products
                    </p>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full shrink-0">New</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Become a Vendor CTA */}
        <div className="mt-8 group">
          <Link
            href="/register/vendor"
            className="flex flex-col sm:flex-row sm:items-center gap-4 bg-gradient-to-r from-brand-500 to-brand-400 rounded-2xl p-6 hover:shadow-xl transition-all"
          >
            <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <ShoppingBag className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-black text-white text-base leading-tight">Open Your Store on ZainStore.pk</p>
              <p className="text-white/75 text-sm mt-0.5">
                Join thousands of vendors — set up your store in minutes.
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 bg-white text-brand-600 text-sm font-black px-5 py-2.5 rounded-xl hover:bg-zinc-50 shrink-0 transition-colors">
              Start Selling Free <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
