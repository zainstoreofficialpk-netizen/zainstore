import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/shop/", "/"],
        disallow: [
          "/admin/",
          "/vendor/",
          "/customer/",
          "/api/",
          "/login",
          "/register",
          "/forgot-password",
          "/reset-password",
          "/verify-email",
          "/checkout",
        ],
      },
    ],
    sitemap: "https://zainstore.pk/sitemap.xml",
    host: "https://zainstore.pk",
  };
}
