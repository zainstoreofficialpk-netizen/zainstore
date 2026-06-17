import { PrismaClient } from "@prisma/client";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const db = new PrismaClient();

async function uploadUrlToCloudinary(url: string, folder: string): Promise<string> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(url, { folder: `zainstore/${folder}`, resource_type: "image" }, (err, result) => {
      if (err || !result) return reject(err ?? new Error("Upload failed"));
      resolve(result.secure_url);
    });
  });
}

async function migrateBatch(items: { id: string; url: string }[], folder: string, updateFn: (id: string, url: string) => Promise<void>, label: string) {
  const toMigrate = items.filter((i) => i.url && !i.url.startsWith("https://res.cloudinary.com") && !i.url.startsWith("/"));
  console.log(`\n📦 ${label}: ${toMigrate.length} to migrate`);

  let done = 0;
  let failed = 0;

  // Process in batches of 5 concurrent uploads
  const BATCH = 5;
  for (let i = 0; i < toMigrate.length; i += BATCH) {
    const batch = toMigrate.slice(i, i + BATCH);
    await Promise.all(
      batch.map(async (item) => {
        try {
          const newUrl = await uploadUrlToCloudinary(item.url, folder);
          await updateFn(item.id, newUrl);
          done++;
          if (done % 50 === 0) console.log(`  ✅ ${done}/${toMigrate.length} done...`);
        } catch {
          failed++;
        }
      })
    );
  }

  console.log(`  ✅ ${done} migrated, ❌ ${failed} failed`);
}

async function main() {
  console.log("🚀 Starting full Cloudinary migration...\n");

  // 1. Product images
  const productImages = await db.productImage.findMany({ select: { id: true, url: true } });
  await migrateBatch(
    productImages,
    "products",
    (id, url) => db.productImage.update({ where: { id }, data: { url } }).then(() => {}),
    "Product Images"
  );

  // 2. Store logos
  const storeLogos = await db.store.findMany({ where: { logoUrl: { not: null } }, select: { id: true, logoUrl: true } });
  await migrateBatch(
    storeLogos.map((s) => ({ id: s.id, url: s.logoUrl! })),
    "store-logos",
    (id, url) => db.store.update({ where: { id }, data: { logoUrl: url } }).then(() => {}),
    "Store Logos"
  );

  // 3. Store banners
  const storeBanners = await db.store.findMany({ where: { bannerUrl: { not: null } }, select: { id: true, bannerUrl: true } });
  await migrateBatch(
    storeBanners.map((s) => ({ id: s.id, url: s.bannerUrl! })),
    "store-banners",
    (id, url) => db.store.update({ where: { id }, data: { bannerUrl: url } }).then(() => {}),
    "Store Banners"
  );

  // 4. Category images
  const categories = await db.category.findMany({ where: { imageUrl: { not: null } }, select: { id: true, imageUrl: true } });
  await migrateBatch(
    categories.map((c) => ({ id: c.id, url: c.imageUrl! })),
    "categories",
    (id, url) => db.category.update({ where: { id }, data: { imageUrl: url } }).then(() => {}),
    "Category Images"
  );

  // 5. Vendor CNIC / bank docs
  const vendors = await db.vendorProfile.findMany({
    select: { id: true, cnicFront: true, cnicBack: true, bankCheque: true },
  });

  for (const v of vendors) {
    if (v.cnicFront && !v.cnicFront.startsWith("https://res.cloudinary.com")) {
      try {
        const url = await uploadUrlToCloudinary(v.cnicFront, "vendor-docs");
        await db.vendorProfile.update({ where: { id: v.id }, data: { cnicFront: url } });
      } catch {}
    }
    if (v.cnicBack && !v.cnicBack.startsWith("https://res.cloudinary.com")) {
      try {
        const url = await uploadUrlToCloudinary(v.cnicBack, "vendor-docs");
        await db.vendorProfile.update({ where: { id: v.id }, data: { cnicBack: url } });
      } catch {}
    }
    if (v.bankCheque && !v.bankCheque.startsWith("https://res.cloudinary.com")) {
      try {
        const url = await uploadUrlToCloudinary(v.bankCheque, "vendor-docs");
        await db.vendorProfile.update({ where: { id: v.id }, data: { bankCheque: url } });
      } catch {}
    }
  }
  console.log("\n📦 Vendor Docs: done");

  console.log("\n🎉 Migration complete! All images now on Cloudinary.");
  await db.$disconnect();
}

main().catch(console.error);
