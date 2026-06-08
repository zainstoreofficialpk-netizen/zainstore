import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { StorefrontHeader } from "@/components/storefront/storefront-header";
import { StorefrontProviders } from "@/components/storefront/storefront-providers";

export const metadata = { title: { template: "%s | ZainStore.pk", default: "ZainStore.pk — Pakistan's Premier Marketplace" } };

export default async function StorefrontLayout({ children }: { children: React.ReactNode }) {
  const [session, categories, brands, announcementSetting] = await Promise.all([
    getServerSession(authOptions),
    db.category.findMany({
      where: { parentId: null },
      select: {
        id: true,
        name: true,
        slug: true,
        imageUrl: true,
        children: {
          select: { id: true, name: true, slug: true },
          take: 12,
          orderBy: { name: "asc" },
        },
      },
      take: 12,
      orderBy: { name: "asc" },
    }),
    db.brand.findMany({ take: 8, orderBy: { name: "asc" } }),
    db.settings.findFirst({ where: { key: "system.announcement" } }),
  ]);

  const announcement = announcementSetting?.value
    ? String(announcementSetting.value).replace(/^"|"$/g, "")
    : "🚚 FREE SHIPPING on orders over PKR 2,000! Shop the best deals now.";

  const user = session?.user
    ? {
        id: (session.user as { id: string }).id,
        name: session.user.name ?? null,
        email: session.user.email ?? null,
        image: session.user.image ?? null,
        role: (session.user as { role: string }).role,
      }
    : null;

  // Wishlist count for logged-in customers
  let wishlistCount = 0;
  if (user?.role === "CUSTOMER") {
    wishlistCount = await db.wishlist.count({ where: { userId: user.id } });
  }

  return (
  <StorefrontProviders>
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      <StorefrontHeader
        categories={categories}
        brands={brands}
        user={user}
        announcement={announcement}
        wishlistCount={wishlistCount}
      />
      <main className="flex-1 pb-20 md:pb-0">{children}</main>
      <footer className="bg-zinc-900 text-zinc-400 mt-auto">
        <div className="container mx-auto px-4 max-w-7xl py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
            <div>
              <p className="font-black text-white text-base mb-3">Zain<span className="text-brand-400">Store</span>.pk</p>
              <p className="text-zinc-500 text-xs leading-relaxed">Pakistan&apos;s trusted multi-vendor marketplace with thousands of products.</p>
            </div>
            {[
              { title: "Shop", links: ["New Arrivals", "Sale", "Top Brands", "Categories"] },
              { title: "Account", links: ["Sign In", "Register", "My Orders", "Wishlist"] },
              { title: "Help", links: ["Contact Us", "FAQ", "Returns Policy", "Track Order"] },
            ].map(({ title, links }) => (
              <div key={title}>
                <p className="font-semibold text-white mb-3 text-xs uppercase tracking-wider">{title}</p>
                <ul className="space-y-2">
                  {links.map((l) => (
                    <li key={l}><a href="#" className="text-zinc-500 hover:text-zinc-300 text-xs transition-colors">{l}</a></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-zinc-800 mt-8 pt-6 text-center text-xs text-zinc-600">
            © {new Date().getFullYear()} ZainStore.pk — All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  </StorefrontProviders>
  );
}
