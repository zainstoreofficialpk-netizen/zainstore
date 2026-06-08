/**
 * WooCommerce → ZainStore migration script
 * Imports categories, vendors, products, and images from the old WC site.
 *
 * Usage:
 *   npx tsx scripts/migrate-woocommerce.ts            # import first 100 products
 *   npx tsx scripts/migrate-woocommerce.ts --all      # import all 6000+ products
 *   npx tsx scripts/migrate-woocommerce.ts --page 2   # import page 2 (products 101-200)
 */

import { PrismaClient, ProductStatus, StockStatus, VendorStatus } from "@prisma/client";

const db = new PrismaClient();

// ── Config ──────────────────────────────────────────────────────────────────

const WC_BASE = "https://zainstore.pk/wp-json/wc/v3";
const WC_KEY  = "ck_163335cce6d5471af4236ab9b12f1afe2e44cc07";
const WC_SEC  = "cs_e028892a8e8cb9b72d581f62d6142180607f7f7e";
const PER_PAGE = 100;
const REQUEST_DELAY_MS = 300; // be kind to the old server

// ── WC API types ─────────────────────────────────────────────────────────────

interface WcCategory {
  id: number;
  name: string;
  slug: string;
  parent: number;
  description: string;
  image: { src: string } | null;
  count: number;
}

interface WcImage {
  id: number;
  src: string;
  name: string;
  alt: string;
}

interface WcMeta {
  key: string;
  value: unknown;
}

interface WcProduct {
  id: number;
  name: string;
  slug: string;
  description: string;
  short_description: string;
  sku: string;
  price: string;
  regular_price: string;
  sale_price: string;
  on_sale: boolean;
  status: string;
  featured: boolean;
  categories: { id: number; name: string; slug: string }[];
  images: WcImage[];
  tags: { id: number; name: string }[];
  stock_quantity: number | null;
  stock_status: string;
  manage_stock: boolean;
  weight: string;
  dimensions: { length: string; width: string; height: string };
  average_rating: string;
  rating_count: number;
  meta_data: WcMeta[];
  date_created: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function wcUrl(path: string, params: Record<string, string | number> = {}) {
  const u = new URL(`${WC_BASE}${path}`);
  u.searchParams.set("consumer_key", WC_KEY);
  u.searchParams.set("consumer_secret", WC_SEC);
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, String(v));
  return u.toString();
}

async function wcGet<T>(path: string, params: Record<string, string | number> = {}): Promise<{ data: T; total: number; totalPages: number }> {
  const url = wcUrl(path, params);
  let lastErr: unknown;
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const res = await fetch(url);
      if (!res.ok) {
        const body = await res.text();
        throw new Error(`WC API ${path} → HTTP ${res.status}: ${body.substring(0, 200)}`);
      }
      const data = await res.json() as T;
      return {
        data,
        total:      Number(res.headers.get("x-wp-total")      ?? 0),
        totalPages: Number(res.headers.get("x-wp-totalpages") ?? 1),
      };
    } catch (err) {
      lastErr = err;
      const delay = attempt * 1500;
      console.warn(`  ↻ Retry ${attempt}/4 for ${path} (${(err as Error).message?.substring(0, 60)}) — wait ${delay}ms`);
      await sleep(delay);
    }
  }
  throw lastErr;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function slugify(str: string) {
  return str.toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 120);
}

function htmlToText(html: string) {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&#?[a-z0-9]+;/gi, "")
    .trim();
}

function getVendorId(meta: WcMeta[]) {
  const entry = meta.find((m) => m.key === "_wcfm_product_author");
  return entry ? String(entry.value) : "1"; // fallback to first wp user
}

// ── Category import ───────────────────────────────────────────────────────────

async function importCategories() {
  console.log("\n── Importing categories ──");
  const { data: wcs } = await wcGet<WcCategory[]>("/products/categories", {
    per_page: 100,
    orderby: "id",
    order: "asc",
  });

  // wcId → prisma id map (for parent links)
  const idMap = new Map<number, string>();

  // Two-pass: parents first, then children
  const sorted = [...wcs].sort((a, b) => a.parent - b.parent);

  let created = 0;
  let skipped = 0;

  for (const wc of sorted) {
    if (wc.count === 0) { skipped++; continue; } // skip empty cats
    const name = htmlToText(wc.name);
    if (!name) { skipped++; continue; }

    const slug = wc.slug || slugify(name);
    const parentId = wc.parent ? idMap.get(wc.parent) ?? null : null;

    try {
      const cat = await db.category.upsert({
        where: { slug },
        create: {
          name,
          slug,
          imageUrl: wc.image?.src ?? null,
          parentId,
        },
        update: {
          name,
          imageUrl: wc.image?.src ?? null,
          parentId,
        },
      });
      idMap.set(wc.id, cat.id);
      created++;
    } catch (err) {
      console.warn(`  ⚠ category "${name}" (${slug}):`, (err as Error).message);
    }
  }

  console.log(`  ✓ ${created} categories upserted, ${skipped} empty skipped`);
  return idMap;
}

// ── Fetch real vendor data from WC API ────────────────────────────────────────

interface WcVendorData {
  email: string;
  displayName: string;
  storeName: string;
  phone: string;
  address: string;
  city: string;
}

async function fetchVendorFromWC(wcUserId: string): Promise<WcVendorData | null> {
  try {
    const { data } = await wcGet<Record<string, unknown>>(`/customers/${wcUserId}`);
    const meta = (data.meta_data as { key: string; value: unknown }[]) ?? [];
    const get = (k: string) => String(meta.find((m) => m.key === k)?.value ?? "").trim();
    const billing = (data.billing as Record<string, string>) ?? {};
    const settings = get("wcfmmp_profile_settings");
    let settingsObj: Record<string, string> = {};
    try { settingsObj = JSON.parse(settings); } catch { /* no settings */ }

    const storeName =
      settingsObj.store_name ||
      get("wcfmmp_store_name") ||
      get("store_name") ||
      String(data.first_name ?? "").trim() ||
      String(data.username ?? wcUserId);

    return {
      email:       String(data.email ?? ""),
      displayName: String(data.first_name ?? data.username ?? storeName),
      storeName,
      phone:       get("contact-number") || billing.phone || "",
      address:     get("full-address") || billing.address_1 || "",
      city:        billing.city || "",
    };
  } catch {
    return null;
  }
}

// ── Vendor import ─────────────────────────────────────────────────────────────

async function ensureVendor(wcVendorId: string): Promise<{ vendorId: string; storeId: string }> {
  // Try to get real vendor data from WC API
  const wcData = await fetchVendorFromWC(wcVendorId);

  const email     = wcData?.email     || `vendor-wc${wcVendorId}@zainstore.pk`;
  const storeName = wcData?.storeName || `Vendor #${wcVendorId}`;
  const storeSlug = `vendor-wc${wcVendorId}`;

  // Find existing or create
  let user = await db.user.findUnique({ where: { email } });
  if (!user) {
    user = await db.user.create({
      data: {
        name: wcData?.displayName || storeName,
        email,
        role: "VENDOR",
        emailVerified: new Date(),
        passwordHash: "$2b$12$TqFMkqTaUUKRrgh5yICKIuG/rUJNOfTuN3qq0u1k6K6H.cE9IKDke", // ZainStore@2024
      },
    });
  } else {
    // Update name if it's still a placeholder
    if (user.name?.startsWith("Vendor #") && wcData?.displayName) {
      await db.user.update({ where: { id: user.id }, data: { name: wcData.displayName } });
    }
  }

  let vendorProfile = await db.vendorProfile.findUnique({ where: { userId: user.id } });
  if (!vendorProfile) {
    vendorProfile = await db.vendorProfile.create({
      data: {
        userId: user.id,
        status: VendorStatus.ACTIVE,
        approvedAt: new Date(),
        verificationBadge: true,
      },
    });
  }

  let store = await db.store.findUnique({ where: { vendorId: vendorProfile.id } });
  if (!store) {
    // ensure slug uniqueness
    let slug = storeSlug;
    let attempt = 0;
    while (await db.store.findUnique({ where: { slug } })) {
      slug = `${storeSlug}-${++attempt}`;
    }
    store = await db.store.create({
      data: {
        vendorId: vendorProfile.id,
        name: storeName,
        slug,
        description: `Imported from WooCommerce store #${wcVendorId}`,
        phone:   wcData?.phone   || null,
        address: wcData?.address ? `${wcData.address}${wcData.city ? ", " + wcData.city : ""}` : null,
      },
    });
  }

  return { vendorId: vendorProfile.id, storeId: store.id };
}

// ── Product import ────────────────────────────────────────────────────────────

async function importProducts(
  catIdMap: Map<number, string>,
  vendorCache: Map<string, { vendorId: string; storeId: string }>,
  page: number,
) {
  console.log(`\n── Importing products page ${page} ──`);
  const { data: products, total } = await wcGet<WcProduct[]>("/products", {
    per_page: PER_PAGE,
    page,
    status: "publish",
    orderby: "date",
    order: "desc",
  });

  console.log(`  Fetched ${products.length} of ${total} total published products`);

  let imported = 0;
  let failed = 0;

  for (const p of products) {
    try {
      // ── Vendor ──
      const wcVendorId = getVendorId(p.meta_data);
      if (!vendorCache.has(wcVendorId)) {
        const v = await ensureVendor(wcVendorId);
        vendorCache.set(wcVendorId, v);
      }
      const { vendorId, storeId } = vendorCache.get(wcVendorId)!;

      // ── Category ──
      const wcCat = p.categories[0];
      const categoryId = wcCat ? catIdMap.get(wcCat.id) ?? null : null;

      // ── Pricing ──
      const price       = parseFloat(p.regular_price || p.price || "0") || 0;
      const salePrice   = p.on_sale && p.sale_price ? parseFloat(p.sale_price) || null : null;

      // ── Stock ──
      const stock = p.stock_quantity ?? (p.stock_status === "instock" ? 10 : 0);
      const stockStatus: StockStatus =
        p.stock_status === "outofstock" ? StockStatus.OUT_OF_STOCK :
        p.stock_status === "onbackorder" ? StockStatus.BACKORDER :
        StockStatus.IN_STOCK;

      // ── Slug dedup ──
      let slug = p.slug || slugify(p.name);
      if (!slug) slug = `product-wc${p.id}`;
      const existing = await db.product.findUnique({ where: { slug } });
      if (existing) {
        // check if it's the same WC product (by sku or name similarity)
        if (existing.sku === (p.sku || null)) {
          // same product, will upsert by sku below
        } else {
          slug = `${slug}-wc${p.id}`;
        }
      }

      // ── SKU ──
      let sku: string | null = p.sku || null;
      if (sku) {
        const existingSku = await db.product.findUnique({ where: { sku } });
        if (existingSku && existingSku.slug !== slug) sku = `${sku}-wc${p.id}`;
      }

      // ── Description ──
      const description     = htmlToText(p.description) || p.name;
      const shortDescription = htmlToText(p.short_description) || null;

      // ── Tags ──
      const tags = p.tags.map((t) => t.name).filter(Boolean);

      // ── Weight / dims ──
      const weight = p.weight ? parseFloat(p.weight) || null : null;
      const length = p.dimensions?.length ? parseFloat(p.dimensions.length) || null : null;
      const width  = p.dimensions?.width  ? parseFloat(p.dimensions.width)  || null : null;
      const height = p.dimensions?.height ? parseFloat(p.dimensions.height) || null : null;

      // ── Upsert product ──
      const product = await db.product.upsert({
        where: { slug },
        create: {
          vendorId,
          storeId,
          categoryId,
          name: p.name,
          slug,
          sku,
          shortDescription,
          description,
          tags,
          price,
          salePrice,
          stock,
          stockStatus,
          trackInventory: p.manage_stock,
          weight,
          length,
          width,
          height,
          status: ProductStatus.ACTIVE,
          featured: p.featured,
          createdAt: new Date(p.date_created),
        },
        update: {
          vendorId,
          storeId,
          categoryId,
          name: p.name,
          sku,
          shortDescription,
          description,
          tags,
          price,
          salePrice,
          stock,
          stockStatus,
          trackInventory: p.manage_stock,
          weight,
          length,
          width,
          height,
          status: ProductStatus.ACTIVE,
          featured: p.featured,
        },
      });

      // ── Images ──
      if (p.images.length > 0) {
        // delete old images and re-insert (idempotent)
        await db.productImage.deleteMany({ where: { productId: product.id } });
        await db.productImage.createMany({
          data: p.images.map((img, i) => ({
            productId: product.id,
            url: img.src,
            alt: img.alt || p.name,
            sortOrder: i,
          })),
        });
      }

      imported++;
      process.stdout.write(`  ✓ [${imported}] ${p.name.substring(0, 50)}\n`);
    } catch (err) {
      failed++;
      console.warn(`  ✗ product ${p.id} "${p.name.substring(0, 40)}": ${(err as Error).message}`);
    }
  }

  console.log(`\n  Page ${page} done: ${imported} imported, ${failed} failed`);
  return { imported, failed, total };
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const importAll  = args.includes("--all");
  const pageArg    = args.indexOf("--page");
  const startPage  = pageArg >= 0 ? parseInt(args[pageArg + 1] ?? "1", 10) : 1;

  console.log("┌─────────────────────────────────────────────────");
  console.log("│ ZainStore ← WooCommerce migration");
  console.log(`│ Mode: ${importAll ? "ALL pages" : `page ${startPage} only (${PER_PAGE} products)`}`);
  console.log("└─────────────────────────────────────────────────");

  // 1. Import categories
  const catIdMap = await importCategories();

  // 2. Vendor cache (wcId → {vendorId, storeId})
  const vendorCache = new Map<string, { vendorId: string; storeId: string }>();

  // 3. Import products
  let totalImported = 0;
  let totalFailed   = 0;

  if (importAll) {
    const { total: firstTotal } = await wcGet<WcProduct[]>("/products", {
      per_page: PER_PAGE, page: 1, status: "publish",
    });
    const totalPages = Math.ceil(firstTotal / PER_PAGE);
    console.log(`\nTotal products: ${firstTotal} across ${totalPages} pages`);

    for (let page = startPage; page <= totalPages; page++) {
      const { imported, failed } = await importProducts(catIdMap, vendorCache, page);
      totalImported += imported;
      totalFailed   += failed;
      if (page < totalPages) await sleep(REQUEST_DELAY_MS);
    }
  } else {
    const { imported, failed } = await importProducts(catIdMap, vendorCache, startPage);
    totalImported = imported;
    totalFailed   = failed;
  }

  console.log("\n┌─────────────────────────────────────────────────");
  console.log("│ Migration complete");
  console.log(`│ ✓ Imported: ${totalImported} products`);
  console.log(`│ ✗ Failed:   ${totalFailed} products`);
  console.log(`│ Vendors:    ${vendorCache.size} unique vendor(s) created/found`);
  console.log("└─────────────────────────────────────────────────");

  await db.$disconnect();
}

main().catch((e) => {
  console.error("Fatal:", e);
  db.$disconnect();
  process.exit(1);
});
