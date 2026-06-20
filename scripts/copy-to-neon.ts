import { PrismaClient } from "@prisma/client";

const local = new PrismaClient({
  datasources: { db: { url: "postgresql://zainstore:zainstore@localhost:5432/zainstore?schema=public" } },
});

const neon = new PrismaClient({
  datasources: { db: { url: "postgresql://neondb_owner:npg_iKfO1JaGbld7@ep-aged-rain-aid3ccz4.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require" } },
});

async function main() {
  console.log("🚀 Copying local database to Neon...\n");

  // Clear Neon tables in correct order
  console.log("🗑️  Clearing Neon data...");
  await neon.reviewImage.deleteMany({}).catch(() => {});
  await neon.review.deleteMany({}).catch(() => {});
  await neon.couponUsage.deleteMany({}).catch(() => {});
  await neon.couponVendor.deleteMany({}).catch(() => {});
  await neon.coupon.deleteMany({}).catch(() => {});
  await neon.refundRequest.deleteMany({}).catch(() => {});
  await neon.vendorLedgerEntry.deleteMany({}).catch(() => {});
  await neon.withdrawal.deleteMany({}).catch(() => {});
  await neon.commissionHistory.deleteMany({}).catch(() => {});
  await neon.vendorTrustScore.deleteMany({}).catch(() => {});
  await neon.orderTimeline.deleteMany({}).catch(() => {});
  await neon.orderItem.deleteMany({}).catch(() => {});
  await neon.order.deleteMany({}).catch(() => {});
  await neon.productImage.deleteMany({}).catch(() => {});
  await neon.productVariant.deleteMany({}).catch(() => {});
  await neon.wishlist.deleteMany({}).catch(() => {});
  await neon.product.deleteMany({}).catch(() => {});
  await neon.banner.deleteMany({}).catch(() => {});
  await neon.address.deleteMany({}).catch(() => {});
  await neon.storeCategory.deleteMany({}).catch(() => {});
  await neon.store.deleteMany({}).catch(() => {});
  await neon.vendorTrustScore.deleteMany({}).catch(() => {});
  await neon.vendorProfile.deleteMany({}).catch(() => {});
  await neon.category.deleteMany({}).catch(() => {});
  await neon.brand.deleteMany({}).catch(() => {});
  await neon.settings.deleteMany({}).catch(() => {});
  await neon.verificationToken.deleteMany({}).catch(() => {});
  await neon.session.deleteMany({}).catch(() => {});
  await neon.account.deleteMany({}).catch(() => {});
  await neon.user.deleteMany({}).catch(() => {});
  console.log("✅ Cleared\n");

  // Users
  const users = await local.user.findMany();
  console.log(`👤 Users: ${users.length}`);
  for (const u of users) await neon.user.create({ data: u }).catch(() => {});
  console.log("✅ Done");

  // Categories
  const cats = await local.category.findMany({ orderBy: { createdAt: "asc" } });
  console.log(`\n📁 Categories: ${cats.length}`);
  // Insert parents first
  const parents = cats.filter((c) => !c.parentId);
  const children = cats.filter((c) => c.parentId);
  for (const c of parents) await neon.category.create({ data: c }).catch(() => {});
  for (const c of children) await neon.category.create({ data: c }).catch(() => {});
  console.log("✅ Done");

  // Brands
  const brands = await local.brand.findMany();
  console.log(`\n🏷️  Brands: ${brands.length}`);
  for (const b of brands) await neon.brand.create({ data: b }).catch(() => {});
  console.log("✅ Done");

  // Settings
  const settings = await local.settings.findMany();
  console.log(`\n⚙️  Settings: ${settings.length}`);
  for (const s of settings) await neon.settings.create({ data: s }).catch(() => {});
  console.log("✅ Done");

  // Vendor Profiles
  const vendors = await local.vendorProfile.findMany();
  console.log(`\n🏪 Vendor Profiles: ${vendors.length}`);
  for (const v of vendors) await neon.vendorProfile.create({ data: v }).catch(() => {});
  console.log("✅ Done");

  // Stores
  const stores = await local.store.findMany();
  console.log(`\n🏬 Stores: ${stores.length}`);
  for (const s of stores) await neon.store.create({ data: s }).catch(() => {});
  console.log("✅ Done");

  // Trust Scores
  const trustScores = await local.vendorTrustScore.findMany();
  console.log(`\n⭐ Trust Scores: ${trustScores.length}`);
  for (const t of trustScores) await neon.vendorTrustScore.create({ data: t }).catch(() => {});
  console.log("✅ Done");

  // Products (in batches)
  const products = await local.product.findMany();
  console.log(`\n📦 Products: ${products.length}`);
  const BATCH = 50;
  for (let i = 0; i < products.length; i += BATCH) {
    await Promise.all(products.slice(i, i + BATCH).map((p) => neon.product.create({ data: p }).catch(() => {})));
    if ((i + BATCH) % 500 === 0) console.log(`  ${i + BATCH}/${products.length}...`);
  }
  console.log("✅ Done");

  // Product Images (in batches)
  const images = await local.productImage.findMany();
  console.log(`\n🖼️  Product Images: ${images.length}`);
  for (let i = 0; i < images.length; i += BATCH) {
    await Promise.all(images.slice(i, i + BATCH).map((img) => neon.productImage.create({ data: img }).catch(() => {})));
    if ((i + BATCH) % 500 === 0) console.log(`  ${i + BATCH}/${images.length}...`);
  }
  console.log("✅ Done");

  // Addresses
  const addresses = await local.address.findMany();
  console.log(`\n📍 Addresses: ${addresses.length}`);
  for (const a of addresses) await neon.address.create({ data: a }).catch(() => {});
  console.log("✅ Done");

  // Orders
  const orders = await local.order.findMany();
  console.log(`\n🛒 Orders: ${orders.length}`);
  for (const o of orders) await neon.order.create({ data: o }).catch(() => {});
  console.log("✅ Done");

  // Order Items
  const items = await local.orderItem.findMany();
  console.log(`\n📋 Order Items: ${items.length}`);
  for (const item of items) await neon.orderItem.create({ data: item }).catch(() => {});
  console.log("✅ Done");

  // Order Timeline
  const timelines = await local.orderTimeline.findMany();
  console.log(`\n📅 Order Timelines: ${timelines.length}`);
  for (const t of timelines) await neon.orderTimeline.create({ data: t }).catch(() => {});
  console.log("✅ Done");

  // Banners
  const banners = await local.banner.findMany();
  console.log(`\n🎯 Banners: ${banners.length}`);
  for (const b of banners) await neon.banner.create({ data: b }).catch(() => {});
  console.log("✅ Done");

  // Coupons
  const coupons = await local.coupon.findMany();
  console.log(`\n🎟️  Coupons: ${coupons.length}`);
  for (const c of coupons) await neon.coupon.create({ data: c }).catch(() => {});
  console.log("✅ Done");

  // Withdrawals
  const withdrawals = await local.withdrawal.findMany();
  console.log(`\n💰 Withdrawals: ${withdrawals.length}`);
  for (const w of withdrawals) await neon.withdrawal.create({ data: w }).catch(() => {});
  console.log("✅ Done");

  // Ledger Entries
  const ledger = await local.vendorLedgerEntry.findMany();
  console.log(`\n📒 Ledger Entries: ${ledger.length}`);
  for (const l of ledger) await neon.vendorLedgerEntry.create({ data: l }).catch(() => {});
  console.log("✅ Done");

  // Wishlists
  const wishlists = await local.wishlist.findMany();
  console.log(`\n❤️  Wishlists: ${wishlists.length}`);
  for (const w of wishlists) await neon.wishlist.create({ data: w }).catch(() => {});
  console.log("✅ Done");

  // Reviews
  const reviews = await local.review.findMany();
  console.log(`\n⭐ Reviews: ${reviews.length}`);
  for (const r of reviews) await neon.review.create({ data: r }).catch(() => {});
  console.log("✅ Done");

  console.log("\n\n🎉 ALL DATA COPIED TO NEON SUCCESSFULLY!");
  await local.$disconnect();
  await neon.$disconnect();
}

main().catch(console.error);
