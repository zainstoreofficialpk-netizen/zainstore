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
      {
        source: "/product/:slug/",
        destination: "/shop/product/:slug",
        permanent: true,
      },
      {
        source: "/product-category/:slug/",
        destination: "/shop/category/:slug",
        permanent: true,
      },
      // Old WooCommerce vendor-store product URLs: /shops/{any-category}/{product-slug}/
      {
        source: "/shops/:category/:slug/",
        destination: "/shop/product/:slug",
        permanent: true,
      },
      {
        source: "/store/:slug/",
        destination: "/shop/store/:slug",
        permanent: true,
      },
      {
        source: "/shops",
        destination: "/shop/stores",
        permanent: true,
      },
      {
        source: "/shops/",
        destination: "/shop/stores",
        permanent: true,
      },
      {
        source: "/shops/page/:num",
        destination: "/shop/stores",
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
