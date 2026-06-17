import { PrismaClient } from "@prisma/client";
import { v2 as cloudinary } from "cloudinary";
import { readFile } from "fs/promises";
import { join, extname } from "path";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const db = new PrismaClient();

async function uploadFile(localPath: string, folder: string): Promise<string> {
  const buffer = await readFile(localPath);
  const ext = extname(localPath).toLowerCase();
  const resourceType = [".mp4", ".webm"].includes(ext) ? "video" : "image";

  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { folder: `zainstore/${folder}`, resource_type: resourceType },
      (err, result) => {
        if (err || !result) return reject(err ?? new Error("Upload failed"));
        resolve(result.secure_url);
      }
    ).end(buffer);
  });
}

async function main() {
  const publicDir = join(process.cwd(), "public");

  // ── Product images ────────────────────────────────────────────
  const productImages = await db.productImage.findMany({
    where: { url: { startsWith: "/uploads/" } },
  });

  console.log(`Migrating ${productImages.length} product images...`);
  for (const img of productImages) {
    const localPath = join(publicDir, img.url);
    try {
      const cloudUrl = await uploadFile(localPath, "products");
      await db.productImage.update({ where: { id: img.id }, data: { url: cloudUrl } });
      console.log(`  ✅ ${img.url} → ${cloudUrl}`);
    } catch (e) {
      console.log(`  ❌ ${img.url} — ${e}`);
    }
  }

  // ── Banner images ─────────────────────────────────────────────
  const banners = await db.banner.findMany({
    where: { imageUrl: { startsWith: "/banners/" } },
  });

  console.log(`\nMigrating ${banners.length} banner images...`);
  for (const banner of banners) {
    const localPath = join(publicDir, banner.imageUrl);
    try {
      const cloudUrl = await uploadFile(localPath, "banners");
      await db.banner.update({ where: { id: banner.id }, data: { imageUrl: cloudUrl } });
      console.log(`  ✅ ${banner.imageUrl} → ${cloudUrl}`);
    } catch (e) {
      console.log(`  ❌ ${banner.imageUrl} — ${e}`);
    }
  }

  console.log("\n✅ Migration complete!");
  await db.$disconnect();
}

main().catch(console.error);
