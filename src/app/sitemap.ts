import type { MetadataRoute } from "next";
import { db } from "@/lib/db";

const BASE = "https://zainstore.pk";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: now, changeFrequency: "daily", priority: 1.0 },
    { url: `${BASE}/shop`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE}/shop/browse`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE}/shop/sale`, lastModified: now, changeFrequency: "hourly", priority: 0.9 },
    { url: `${BASE}/shop/stores`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: `${BASE}/shop/categories`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: `${BASE}/shop/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE}/shop/help`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE}/shop/returns`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE}/shop/privacy`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
  ];

  try {
    const [products, categories, stores] = await Promise.all([
      db.product.findMany({
        where: { status: "ACTIVE" },
        select: { slug: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
      }),
      db.category.findMany({
        select: { slug: true, updatedAt: true },
      }),
      db.store.findMany({
        where: { vacationMode: false, vendor: { status: "ACTIVE" } },
        select: { slug: true, updatedAt: true },
      }),
    ]);

    const productPages: MetadataRoute.Sitemap = products.map((p) => ({
      url: `${BASE}/shop/product/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "weekly",
      priority: 0.8,
    }));

    const categoryPages: MetadataRoute.Sitemap = categories.map((c) => ({
      url: `${BASE}/shop/category/${c.slug}`,
      lastModified: c.updatedAt,
      changeFrequency: "daily",
      priority: 0.7,
    }));

    const storePages: MetadataRoute.Sitemap = stores.map((s) => ({
      url: `${BASE}/shop/store/${s.slug}`,
      lastModified: s.updatedAt,
      changeFrequency: "weekly",
      priority: 0.6,
    }));

    return [...staticPages, ...productPages, ...categoryPages, ...storePages];
  } catch {
    return staticPages;
  }
}
