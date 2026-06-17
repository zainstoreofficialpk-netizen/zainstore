/**
 * Migrate products from zainstore.pk (WooCommerce/WCFM) into the Prisma DB.
 * Only imports products from the 25 approved vendors. Skips deleted vendors.
 * Safe to re-run — uses slug uniqueness to skip already-imported products.
 */

import { PrismaClient } from "@prisma/client";
import https from "https";

const CK = "ck_52d4ed37e3bbcd2e22235ed5e311acc382d7b88f";
const CS = "cs_0d8841ca522eb63e41858bf65c0ff475839837f1";
const AUTH = Buffer.from(`${CK}:${CS}`).toString("base64");
const BASE = "https://zainstore.pk/wp-json/wc/v3";

// WP user ID → email for the 25 APPROVED vendors only
const APPROVED = {
  159: "zebshperstore@gmail.com",
  140: "shahzaib558556@gmail.com",
  53:  "swatkhan@gmail.com",
  2786:"kashiftanha513@gmail.com",
  2669:"Waspbarikot@gmail.com",
  101: "hjani4534@gmail.Com",
  14:  "productsherbal288@gmail.com",
  15:  "thebodycare8@gmail.com",
  144: "marisherry9@gmail.com",
  9:   "hyperall139@gmail.com",
  96:  "rovaidking911@gmail.com",
  95:  "hassanidrees836@gmail.com",
  77:  "nabeel@telemall.com.pk",
  64:  "muhammadhamza55777@gmail.com",
  67:  "usmanshams234@gmail.com",
  55:  "waseemkashan24@gmail.com",
  49:  "saudalik95@gmail.com",
  43:  "redigul321@gmail.com",
  33:  "aljannat4488@gmail.com",
  40:  "shehzadmian426@gmail.com",
  38:  "k.zooha@yahoo.com",
  35:  "ummehanifatima6@gmail.com",
  27:  "Yousafshah698@gmail.com",
  16:  "sheikhfaraz121@gmail.com",
  17:  "themarkhors.pk@gmail.com",
};

// ── HTTP helper ─────────────────────────────────────────────────
function wcGet(path) {
  return new Promise((resolve, reject) => {
    const url = `${BASE}${path}`;
    https.get(url, { headers: { Authorization: "Basic " + AUTH } }, (res) => {
      let raw = "";
      res.on("data", (d) => (raw += d));
      res.on("end", () => {
        try {
          resolve({ data: JSON.parse(raw), headers: res.headers });
        } catch {
          resolve({ data: [], headers: res.headers });
        }
      });
    }).on("error", reject);
  });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function stripHtml(html) {
  return (html || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[&]/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// ── Main ────────────────────────────────────────────────────────
const db = new PrismaClient();

async function main() {
  console.log("=== ZainStore.pk → Prisma Migration ===\n");

  // 1. Build email → { userId, storeId } map from DB
  console.log("Loading vendor accounts from DB...");
  const vendorUsers = await db.user.findMany({
    where: { role: "VENDOR" },
    include: { vendorProfile: { include: { store: { select: { id: true } } } } },
  });

  const vendorMap = {}; // email (lower) → { userId, vendorProfileId, storeId }
  for (const u of vendorUsers) {
    const vp = u.vendorProfile;
    if (!vp || !vp.store) continue;
    vendorMap[u.email.toLowerCase()] = {
      userId: u.id,
      vendorProfileId: vp.id,
      storeId: vp.store.id,
    };
  }
  console.log(`  DB vendors with stores: ${Object.keys(vendorMap).length}`);

  // 2. Build category slug → id map (creates missing categories)
  const allCats = await db.category.findMany();
  const catMap = {}; // slug → id
  for (const c of allCats) catMap[c.slug] = c.id;

  async function ensureCategory(wcCat) {
    const slug = wcCat.slug || slugify(wcCat.name);
    if (catMap[slug]) return catMap[slug];
    // create it
    const name = stripHtml(wcCat.name).replace(/&amp;/g, "&").replace(/&#8217;/g, "'");
    const cat = await db.category.create({
      data: { name, slug },
    });
    catMap[slug] = cat.id;
    console.log(`  Created category: ${name} (${slug})`);
    return cat.id;
  }

  // 3. Fetch all products from WC in pages of 100
  console.log("\nFetching products from zainstore.pk...");
  const first = await wcGet("/products?per_page=100&page=1&status=publish");
  const totalPages = parseInt(first.headers["x-wp-totalpages"] || "1");
  const totalProducts = parseInt(first.headers["x-wp-total"] || "0");
  console.log(`  Total WC products: ${totalProducts} across ${totalPages} pages\n`);

  let imported = 0;
  let skipped = 0;
  let skippedNoMeta = 0;
  let skippedNotApproved = 0;
  let skippedNoPrice = 0;
  let alreadyExists = 0;
  let noVendor = 0;

  async function processPage(products) {
    for (const wc of products) {
      // Find vendor WP ID from meta
      let wpVendorId = null;
      let rawDesc = "";
      for (const m of wc.meta_data || []) {
        if (m.key === "_wcfm_product_author") wpVendorId = String(m.value);
      }

      // Skip if not approved
      if (!wpVendorId) { skipped++; skippedNoMeta++; continue; }
      if (!APPROVED[wpVendorId]) { skipped++; skippedNotApproved++; continue; }

      const email = APPROVED[wpVendorId].toLowerCase();
      const vendor = vendorMap[email];
      if (!vendor) {
        noVendor++;
        continue;
      }

      // Skip if already imported (by slug)
      const slug = wc.slug || slugify(wc.name);
      const existing = await db.product.findFirst({ where: { slug } });
      if (existing) {
        alreadyExists++;
        continue;
      }

      // Resolve category
      let categoryId = null;
      const primaryCat = (wc.categories || []).find((c) => c.slug !== "uncategorized") || wc.categories?.[0];
      if (primaryCat) {
        categoryId = await ensureCategory(primaryCat);
      }

      // Price
      const price = parseFloat(wc.regular_price || wc.price || "0");
      const salePrice = wc.sale_price ? parseFloat(wc.sale_price) : null;
      if (!price || price <= 0) { skipped++; skippedNoPrice++; continue; }

      // Stock
      let stockStatus = "IN_STOCK";
      if (wc.stock_status === "outofstock") stockStatus = "OUT_OF_STOCK";
      else if (wc.stock_status === "onbackorder") stockStatus = "BACKORDER";

      // Description — strip HTML
      const description = stripHtml(wc.description || wc.short_description || "");

      // Images
      const images = (wc.images || []).filter((img) => img.src).map((img, i) => ({
        url: img.src,
        alt: img.alt || null,
        sortOrder: i,
      }));

      // Build a unique SKU: use WC sku if set, else null (Prisma unique nullable allows multiple nulls)
      const sku = wc.sku && wc.sku.trim() ? wc.sku.trim() : null;

      // Create product
      try {
        await db.product.create({
          data: {
            name: wc.name,
            slug,
            description: description || "",
            price,
            salePrice,
            sku,
            stockStatus,
            status: "ACTIVE",
            featured: wc.featured || false,
            vendorId: vendor.vendorProfileId,   // VendorProfile.id, not User.id
            storeId: vendor.storeId,
            categoryId,
            images: images.length > 0 ? { create: images } : undefined,
          },
        });
        imported++;
      } catch (err) {
        // Log the actual error so we can diagnose
        if (imported + skipped < 5) console.error("\nCreate error:", err.message, "| product:", wc.name);
        skipped++;
      }
    }
  }

  // Process first page
  await processPage(first.data);
  process.stdout.write(`\r  Progress: page 1/${totalPages} | imported: ${imported} | skipped: ${skipped}`);

  // Process remaining pages with small delay to avoid hammering the API
  for (let page = 2; page <= totalPages; page++) {
    const res = await wcGet(`/products?per_page=100&page=${page}&status=publish`);
    await processPage(res.data);
    process.stdout.write(
      `\r  Progress: page ${page}/${totalPages} | imported: ${imported} | skipped: ${skipped} | exists: ${alreadyExists}`
    );
    if (page % 5 === 0) await sleep(200); // small pause every 5 pages
  }

  console.log("\n\n=== Migration Complete ===");
  console.log(`  ✅ Imported:              ${imported}`);
  console.log(`  ⏭  Already exists:        ${alreadyExists}`);
  console.log(`  ❌ Skipped total:          ${skipped}`);
  console.log(`     - no meta/vendor id:   ${skippedNoMeta}`);
  console.log(`     - not approved vendor: ${skippedNotApproved}`);
  console.log(`     - no/zero price:       ${skippedNoPrice}`);
  console.log(`  ⚠️  No DB vendor match:   ${noVendor}`);

  await db.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await db.$disconnect();
  process.exit(1);
});
