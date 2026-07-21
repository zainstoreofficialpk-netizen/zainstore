import { db } from "@/lib/db";

const BASE = "https://zainstore.pk";

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const products = await db.product.findMany({
    where: { status: "ACTIVE" },
    select: {
      slug: true,
      name: true,
      description: true,
      price: true,
      salePrice: true,
      stockStatus: true,
      sku: true,
      barcode: true,
      brand: { select: { name: true } },
      category: { select: { name: true } },
      images: { select: { url: true }, orderBy: { sortOrder: "asc" }, take: 1 },
    },
  });

  const availability: Record<string, string> = {
    IN_STOCK: "in stock",
    OUT_OF_STOCK: "out of stock",
    ON_BACKORDER: "preorder",
  };

  const items = products
    .filter((p) => p.images[0]?.url)
    .map((p) => {
      const price = p.salePrice ?? p.price;
      const priceStr = `${Number(price).toFixed(2)} PKR`;
      const regularPriceStr = `${Number(p.price).toFixed(2)} PKR`;

      return `
    <item>
      <g:id>${escapeXml(p.sku ?? p.slug)}</g:id>
      <title>${escapeXml(p.name)}</title>
      <description>${escapeXml(p.description.replace(/<[^>]*>/g, "").slice(0, 5000))}</description>
      <link>${BASE}/shop/product/${p.slug}</link>
      <g:image_link>${escapeXml(p.images[0].url)}</g:image_link>
      <g:availability>${availability[p.stockStatus] ?? "in stock"}</g:availability>
      <g:price>${regularPriceStr}</g:price>
      ${p.salePrice ? `<g:sale_price>${priceStr}</g:sale_price>` : ""}
      <g:condition>new</g:condition>
      <g:brand>${escapeXml(p.brand?.name ?? "ZainStore.pk")}</g:brand>
      ${p.category ? `<g:product_type>${escapeXml(p.category.name)}</g:product_type>` : ""}
      ${p.barcode ? `<g:gtin>${escapeXml(p.barcode)}</g:gtin>` : ""}
      <g:identifier_exists>${p.barcode ? "true" : "false"}</g:identifier_exists>
    </item>`;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>ZainStore.pk Product Feed</title>
    <link>${BASE}</link>
    <description>All active products from ZainStore.pk</description>
    ${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
