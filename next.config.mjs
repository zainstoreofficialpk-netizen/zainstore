/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "zainstore.pk",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "8mb",
    },
  },
  async redirects() {
    return [
      // Legacy WordPress/WooCommerce URLs (site was on WP for 4 years before
      // the June 2026 Next.js rebuild). Product/category slugs carried over
      // 1:1 during migration, so these map directly to the new routes.
      //
      // `{/}?` makes the trailing slash optional — real-world links (browser
      // address bars, Google Search Console, WhatsApp previews) almost never
      // include the trailing slash WordPress used internally, so a plain
      // "/product/:slug/" pattern silently failed to match nearly every real
      // incoming URL and fell through to a 404 instead of redirecting.
      {
        source: "/product/:slug{/}?",
        destination: "/shop/product/:slug",
        permanent: true,
      },
      // Nested WooCommerce subcategories, e.g. /product-category/skin-care/hair-removal/
      {
        source: "/product-category/:parent/:slug{/}?",
        destination: "/shop/category/:slug",
        permanent: true,
      },
      {
        source: "/product-category/:slug{/}?",
        destination: "/shop/category/:slug",
        permanent: true,
      },
      // WordPress's own feed endpoint on a shop URL, e.g. /shops/hair-care/sunsillk/feed/
      // — not real content, send to the shop page rather than trying to treat
      // "feed" as a product slug.
      {
        source: "/shops/:category/:slug/feed{/}?",
        destination: "/shop",
        permanent: true,
      },
      // Pagination and the bare listing must be matched BEFORE the general
      // /shops/:category/:slug rule below — otherwise "/shops/page/8/" gets
      // parsed as category="page", slug="8" and wrongly redirected to a
      // product page instead of the shop listing (redirects() matches in
      // array order, first match wins).
      {
        source: "/shops/page/:num{/}?",
        destination: "/shop/stores",
        permanent: true,
      },
      {
        source: "/shops{/}?",
        destination: "/shop/stores",
        permanent: true,
      },
      // Old WooCommerce vendor-store product URLs: /shops/{any-category}/{product-slug}/
      {
        source: "/shops/:category/:slug{/}?",
        destination: "/shop/product/:slug",
        permanent: true,
      },
      // Vendor store category tab, e.g. /store/edlers/category/chocolates/
      {
        source: "/store/:slug/category/:cat{/}?",
        destination: "/shop/store/:slug",
        permanent: true,
      },
      // One-off slug fixups: the new site's slugify strips apostrophes
      // differently than the old WP site did, so a couple of store slugs
      // don't match their legacy WordPress URL 1:1.
      {
        source: "/store/rk-traders{/}?",
        destination: "/shop/store/rk-trader-s",
        permanent: true,
      },
      {
        source: "/store/:slug{/}?",
        destination: "/shop/store/:slug",
        permanent: true,
      },
      // Bare listing URLs with no slug — send to the general shop page
      // rather than 404, since there's no index route at these paths.
      {
        source: "/product{/}?",
        destination: "/shop",
        permanent: true,
      },
      {
        source: "/shop/product{/}?",
        destination: "/shop",
        permanent: true,
      },
      // NOTE: /video/*, /add/*, /category/?view=*, /product-brand/* are NOT
      // redirected on purpose — they're spam URLs injected via an old WP
      // vulnerability (Thai gambling keywords), never real content. Letting
      // them 404 is correct; they'll drop out of Google's index over time.
    ];
  },
};

export default nextConfig;
