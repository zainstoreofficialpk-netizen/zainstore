import type { Metadata } from "next";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { StorefrontHeader } from "@/components/storefront/storefront-header";
import { StorefrontProviders } from "@/components/storefront/storefront-providers";
import { VisitorTracker } from "@/components/shared/visitor-tracker";
import { UtmTracker } from "@/components/shared/utm-tracker";
import { WhatsAppButton } from "@/components/storefront/whatsapp-button";

export const metadata: Metadata = {
  metadataBase: new URL("https://zainstore.pk"),
  title: {
    template: "%s | ZainStore.pk",
    default: "ZainStore.pk — Pakistan's Premier Online Marketplace",
  },
  description:
    "Shop the best deals on electronics, fashion, beauty, home & more from verified sellers across Pakistan. Fast delivery, secure payments.",
  keywords: ["online shopping Pakistan", "buy online Pakistan", "ZainStore", "electronics Pakistan", "fashion Pakistan", "best deals Pakistan"],
  authors: [{ name: "ZainStore.pk", url: "https://zainstore.pk" }],
  creator: "ZainStore.pk",
  publisher: "ZainStore.pk",
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
  verification: { google: "Zzl3pu3dHEWc79lq_cja_In7SltY0P7X7nejmUFbXwk" },
  openGraph: {
    type: "website",
    locale: "en_PK",
    url: "https://zainstore.pk",
    siteName: "ZainStore.pk",
    title: "ZainStore.pk — Pakistan's Premier Online Marketplace",
    description: "Shop the best deals on electronics, fashion, beauty, home & more from verified sellers across Pakistan.",
    images: [{ url: "/og-default.jpg", width: 1200, height: 630, alt: "ZainStore.pk — Shop Online in Pakistan" }],
  },
  twitter: {
    card: "summary_large_image",
    site: "@ZainStorePK",
    creator: "@ZainStorePK",
    title: "ZainStore.pk — Pakistan's Premier Online Marketplace",
    description: "Shop the best deals on electronics, fashion, beauty & more from verified sellers across Pakistan.",
    images: ["/og-default.jpg"],
  },
  alternates: { canonical: "https://zainstore.pk" },
};

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
    : "🛍️ New arrivals daily · Shop thousands of products from verified sellers across Pakistan!";

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

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "ZainStore.pk",
    url: "https://zainstore.pk",
    description: "Pakistan's premier multi-vendor marketplace",
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: "https://zainstore.pk/shop/browse?search={search_term_string}" },
      "query-input": "required name=search_term_string",
    },
  };

  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "ZainStore.pk",
    url: "https://zainstore.pk",
    logo: "https://zainstore.pk/logo-icon.svg",
    sameAs: [],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      availableLanguage: ["English", "Urdu"],
    },
  };

  return (
  <StorefrontProviders>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }} />
    <VisitorTracker />
    <UtmTracker />
    <div className="min-h-screen bg-zinc-50 flex flex-col overflow-x-hidden w-full">
      <StorefrontHeader
        categories={categories}
        brands={brands}
        user={user}
        announcement={announcement}
        wishlistCount={wishlistCount}
      />
      <main className="flex-1 pb-20 md:pb-0">{children}</main>
      <WhatsAppButton />
      <footer className="bg-zinc-900 text-zinc-400 mt-auto">

        {/* ── Desktop footer ── */}
        <div className="hidden sm:block">
          <div className="container mx-auto px-4 max-w-7xl py-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">

              {/* Brand */}
              <div className="col-span-2 md:col-span-1">
                <div className="flex items-center gap-2 mb-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/logo-icon.svg" alt="ZainStore.pk" className="h-9 w-9 object-contain" />
                  <p className="font-black text-white text-base">Zain<span className="text-brand-400">Store</span>.pk</p>
                </div>
                <p className="text-zinc-500 text-xs leading-relaxed mb-4">
                  Pakistan&apos;s trusted multi-vendor marketplace with thousands of verified products.
                </p>
                <div className="space-y-2">
                  <a href="tel:03478913290" className="flex items-center gap-2 text-xs text-zinc-400 hover:text-brand-400 transition-colors">
                    <span className="text-zinc-600">📞</span> 0347-891-3290
                  </a>
                  <a href="mailto:support@zainstore.pk" className="flex items-center gap-2 text-xs text-zinc-400 hover:text-brand-400 transition-colors">
                    <span className="text-zinc-600">✉️</span> support@zainstore.pk
                  </a>
                </div>
              </div>

              {/* Shop */}
              <div>
                <p className="font-semibold text-white mb-3 text-xs uppercase tracking-wider">Shop</p>
                <ul className="space-y-2">
                  {[
                    { label: "New Arrivals",  href: "/shop/browse?sort=newest"  },
                    { label: "Sale Deals",    href: "/shop/sale"                },
                    { label: "All Products",  href: "/shop/browse"              },
                    { label: "All Stores",    href: "/shop/stores"              },
                    { label: "Categories",    href: "/shop/categories"          },
                  ].map(({ label, href }) => (
                    <li key={label}>
                      <Link href={href} className="text-zinc-500 hover:text-zinc-200 text-xs transition-colors">
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Account */}
              <div>
                <p className="font-semibold text-white mb-3 text-xs uppercase tracking-wider">Account</p>
                <ul className="space-y-2">
                  {[
                    { label: "Sign In",           href: "/login"             },
                    { label: "Register",          href: "/register/customer" },
                    { label: "My Orders",         href: "/customer/orders"   },
                    { label: "Wishlist",          href: "/customer/wishlist" },
                    { label: "Sell on ZainStore", href: "/register/vendor"   },
                  ].map(({ label, href }) => (
                    <li key={label}>
                      <Link href={href} className="text-zinc-500 hover:text-zinc-200 text-xs transition-colors">
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Help */}
              <div>
                <p className="font-semibold text-white mb-3 text-xs uppercase tracking-wider">Help & Legal</p>
                <ul className="space-y-2">
                  {[
                    { label: "Contact Us",     href: "/shop/contact"    },
                    { label: "FAQs",           href: "/shop/faq"        },
                    { label: "Return Policy",  href: "/shop/returns"    },
                    { label: "Privacy Policy", href: "/shop/privacy"    },
                    { label: "Track Order",    href: "/customer/orders" },
                  ].map(({ label, href }) => (
                    <li key={label}>
                      <Link href={href} className="text-zinc-500 hover:text-zinc-200 text-xs transition-colors">
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

            </div>

            {/* ── Download App banner ── */}
            <div className="border-t border-zinc-800 mt-8 pt-8 pb-2">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-zinc-800 rounded-2xl px-6 py-5">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-brand-500 flex items-center justify-center shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/logo-icon.svg" alt="ZainStore" className="h-7 w-7 object-contain" />
                  </div>
                  <div>
                    <p className="text-white font-black text-sm">Get the ZainStore App</p>
                    <p className="text-zinc-400 text-xs mt-0.5">Shop faster · Track orders · Exclusive app deals</p>
                  </div>
                </div>
                <a
                  href="/zainstore-app.apk"
                  download
                  className="flex items-center gap-2.5 bg-white hover:bg-zinc-100 text-zinc-900 font-black text-sm px-5 py-3 rounded-xl transition-colors shrink-0 shadow-sm"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5 fill-[#3DDC84]" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.523 15.341 13 9.64V4h1a1 1 0 0 0 0-2H10a1 1 0 0 0 0 2h1v5.64l-4.523 5.701A1 1 0 0 0 7.24 17H10v3a1 1 0 0 0 2 0v-3h2.76a1 1 0 0 0 .763-1.659Z"/>
                  </svg>
                  Download for Android
                </a>
              </div>
            </div>

            <div className="pt-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-600">
              <p>© {new Date().getFullYear()} ZainStore.pk — All rights reserved.</p>
              <div className="flex items-center gap-4">
                <Link href="/shop/privacy" className="hover:text-zinc-400 transition-colors">Privacy Policy</Link>
                <Link href="/shop/returns" className="hover:text-zinc-400 transition-colors">Returns</Link>
                <Link href="/shop/contact" className="hover:text-zinc-400 transition-colors">Contact</Link>
              </div>
            </div>
          </div>
        </div>

        {/* ── Mobile footer — compact ── */}
        <div className="sm:hidden px-4 py-5">
          {/* Logo */}
          <div className="flex items-center gap-2 mb-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-icon.svg" alt="ZainStore.pk" className="h-7 w-7 object-contain" />
            <p className="font-black text-white text-sm">Zain<span className="text-brand-400">Store</span>.pk</p>
          </div>

          {/* Quick links */}
          <div className="flex flex-wrap gap-x-4 gap-y-2 mb-4">
            {[
              { label: "Shop",         href: "/shop/browse"     },
              { label: "Sale Deals",   href: "/shop/sale"       },
              { label: "My Orders",    href: "/customer/orders" },
              { label: "Contact Us",   href: "/shop/contact"    },
              { label: "Sell With Us", href: "/register/vendor" },
            ].map(({ label, href }) => (
              <Link key={label} href={href} className="text-zinc-500 hover:text-zinc-300 text-xs transition-colors">
                {label}
              </Link>
            ))}
          </div>

          {/* App download — mobile */}
          <a
            href="/zainstore-app.apk"
            download
            className="flex items-center justify-center gap-2 w-full bg-brand-500 hover:bg-brand-600 text-white font-black text-sm py-3 rounded-xl mb-4 transition-colors"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-white" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.523 15.341 13 9.64V4h1a1 1 0 0 0 0-2H10a1 1 0 0 0 0 2h1v5.64l-4.523 5.701A1 1 0 0 0 7.24 17H10v3a1 1 0 0 0 2 0v-3h2.76a1 1 0 0 0 .763-1.659Z"/>
            </svg>
            Download Android App
          </a>

          <div className="border-t border-zinc-800 pt-3 flex items-center justify-between text-[10px] text-zinc-600">
            <p>© {new Date().getFullYear()} ZainStore.pk</p>
            <div className="flex gap-3">
              <Link href="/shop/privacy" className="hover:text-zinc-400 transition-colors">Privacy</Link>
              <Link href="/shop/returns" className="hover:text-zinc-400 transition-colors">Returns</Link>
            </div>
          </div>
        </div>

      </footer>
    </div>
  </StorefrontProviders>
  );
}
