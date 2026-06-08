/**
 * WCFM Vendor Migration Script
 * Fetches all vendor profiles from the old zainstore.pk WooCommerce/WCFM site
 * and creates proper User + VendorProfile + Store records in ZainStore.
 *
 * Usage:
 *   npx tsx scripts/migrate-vendors.ts          # migrate all vendors
 *   npx tsx scripts/migrate-vendors.ts --dry    # preview without writing to DB
 */

import { PrismaClient, VendorStatus } from "@prisma/client";
import { createHash } from "crypto";

const db = new PrismaClient();

const WC_BASE = "https://zainstore.pk/wp-json/wc/v3";
const WC_KEY  = "ck_163335cce6d5471af4236ab9b12f1afe2e44cc07";
const WC_SEC  = "cs_e028892a8e8cb9b72d581f62d6142180607f7f7e";

// Temporary password given to all migrated vendors — they should reset it
const TEMP_PASSWORD_HASH = "$2b$12$TqFMkqTaUUKRrgh5yICKIuG/rUJNOfTuN3qq0u1k6K6H.cE9IKDke"; // ZainStore@2024

// All unique vendor WP user IDs found across 6,006 products
const ALL_VENDOR_IDS = [
  "1","7","9","12","14","15","16","17","21","25","27","31","33","35",
  "37","38","40","43","44","46","49","53","55","64","67","71","72","77",
  "95","96","101","140","144","155","159","164","185","2669","2786",
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function slugify(str: string) {
  return str.toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 80) || "store";
}

async function wcFetch(path: string): Promise<Record<string, unknown> | null> {
  const url = `${WC_BASE}${path}?consumer_key=${WC_KEY}&consumer_secret=${WC_SEC}`;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json() as Record<string, unknown>;
    } catch (err) {
      if (attempt === 3) return null;
      await sleep(attempt * 1000);
    }
  }
  return null;
}

// ── Parse WCFM vendor profile ─────────────────────────────────────────────────

interface VendorProfile {
  wcId: string;
  email: string;
  displayName: string;
  storeName: string;
  storeSlug: string;
  phone: string;
  address: string;
  city: string;
  logoUrl: string | null;
  bannerUrl: string | null;
  description: string;
}

function parseMeta(meta: { key: string; value: unknown }[], key: string): string {
  return String(meta.find((m) => m.key === key)?.value ?? "").trim();
}

function parseVendor(wcId: string, data: Record<string, unknown>): VendorProfile {
  const meta = (data.meta_data as { key: string; value: unknown }[]) ?? [];
  const billing = (data.billing as Record<string, string>) ?? {};

  // Parse wcfmmp_profile_settings JSON object
  let settings: Record<string, unknown> = {};
  const settingsRaw = meta.find((m) => m.key === "wcfmmp_profile_settings")?.value;
  if (settingsRaw && typeof settingsRaw === "object") {
    settings = settingsRaw as Record<string, unknown>;
  }

  const storeName =
    String(settings.store_name ?? "").trim() ||
    parseMeta(meta, "wcfmmp_store_name") ||
    parseMeta(meta, "store_name") ||
    String(data.first_name ?? "").trim() ||
    String(data.username ?? `Vendor #${wcId}`);

  const email = String(data.email ?? `vendor-wc${wcId}@zainstore.pk`);

  // Logo / banner from settings object
  const logoUrl  = String(settings.logo   ?? "").trim() || null;
  const bannerUrl = String(settings.banner ?? "").trim() || null;

  const phone =
    parseMeta(meta, "contact-number") ||
    String(settings.phone ?? "").trim() ||
    billing.phone || "";

  const addressParts = [
    parseMeta(meta, "full-address") || billing.address_1 || "",
    billing.address_2 || "",
  ].filter(Boolean);
  const city = billing.city || "";

  const description =
    parseMeta(meta, "_wcfm_store_tagline") ||
    String(settings.shop_description ?? "").trim() || "";

  return {
    wcId,
    email,
    displayName: String(data.first_name ?? storeName).trim() || storeName,
    storeName,
    storeSlug: slugify(storeName),
    phone,
    address: addressParts.join(", "),
    city,
    logoUrl,
    bannerUrl,
    description,
  };
}

// ── Upsert vendor in DB ───────────────────────────────────────────────────────

async function upsertVendor(profile: VendorProfile, dry: boolean): Promise<"created" | "updated" | "skipped"> {
  if (dry) return "created";

  // Check if this email already belongs to a real (non-placeholder) vendor
  const existingUser = await db.user.findUnique({ where: { email: profile.email } });

  if (existingUser) {
    // Already have this vendor — update name/store info if placeholder
    const vp = await db.vendorProfile.findUnique({ where: { userId: existingUser.id }, include: { store: true } });
    if (vp?.store) {
      await db.store.update({
        where: { id: vp.store.id },
        data: {
          name:       profile.storeName,
          phone:      profile.phone     || null,
          address:    profile.address   || null,
          logoUrl:    profile.logoUrl   || null,
          bannerUrl:  profile.bannerUrl || null,
          description: profile.description || null,
        },
      });
    }
    if (existingUser.name?.startsWith("Vendor #")) {
      await db.user.update({ where: { id: existingUser.id }, data: { name: profile.displayName } });
    }
    return "updated";
  }

  // New vendor — create User + VendorProfile + Store
  const user = await db.user.create({
    data: {
      name:          profile.displayName,
      email:         profile.email,
      role:          "VENDOR",
      emailVerified: new Date(),
      passwordHash:  TEMP_PASSWORD_HASH,
    },
  });

  const vp = await db.vendorProfile.create({
    data: {
      userId:           user.id,
      status:           VendorStatus.ACTIVE,
      approvedAt:       new Date(),
      verificationBadge: false,
    },
  });

  // Ensure slug uniqueness
  let slug = profile.storeSlug;
  let attempt = 0;
  while (await db.store.findUnique({ where: { slug } })) {
    slug = `${profile.storeSlug}-${++attempt}`;
  }

  await db.store.create({
    data: {
      vendorId:    vp.id,
      name:        profile.storeName,
      slug,
      phone:       profile.phone     || null,
      address:     profile.address ? `${profile.address}${profile.city ? ", " + profile.city : ""}` : null,
      logoUrl:     profile.logoUrl   || null,
      bannerUrl:   profile.bannerUrl || null,
      description: profile.description || null,
    },
  });

  return "created";
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const dry = process.argv.includes("--dry");

  console.log("┌─────────────────────────────────────────────────────");
  console.log("│ ZainStore ← WCFM Vendor Migration");
  console.log(`│ Vendors to process: ${ALL_VENDOR_IDS.length}`);
  console.log(`│ Mode: ${dry ? "DRY RUN (no DB writes)" : "LIVE"}`);
  console.log("└─────────────────────────────────────────────────────");

  let created = 0, updated = 0, skipped = 0, failed = 0;
  const results: { wcId: string; status: string; email: string; store: string }[] = [];

  for (const wcId of ALL_VENDOR_IDS) {
    await sleep(350); // be gentle on the old server
    process.stdout.write(`  Fetching vendor WP#${wcId}… `);

    const data = await wcFetch(`/customers/${wcId}`);

    if (!data || !data.email) {
      console.log("✗ not found / no email");
      failed++;
      results.push({ wcId, status: "failed", email: "—", store: "—" });
      continue;
    }

    const profile = parseVendor(wcId, data);

    try {
      const status = await upsertVendor(profile, dry);
      const icon = status === "created" ? "✓" : status === "updated" ? "↻" : "–";
      console.log(`${icon} [${status}] ${profile.storeName} <${profile.email}>`);
      if (status === "created") created++;
      else if (status === "updated") updated++;
      else skipped++;
      results.push({ wcId, status, email: profile.email, store: profile.storeName });
    } catch (err) {
      console.log(`✗ DB error: ${(err as Error).message.substring(0, 80)}`);
      failed++;
      results.push({ wcId, status: "failed", email: profile.email, store: profile.storeName });
    }
  }

  console.log("\n┌─────────────────────────────────────────────────────");
  console.log("│ Migration complete");
  console.log(`│ ✓ Created : ${created}`);
  console.log(`│ ↻ Updated : ${updated}`);
  console.log(`│ – Skipped : ${skipped}`);
  console.log(`│ ✗ Failed  : ${failed}`);
  if (!dry) {
    console.log("│");
    console.log("│ Temporary login password: ZainStore@2024");
    console.log("│ Share with vendors — they should reset on first login.");
  }
  console.log("└─────────────────────────────────────────────────────");

  if (!dry) {
    // Print final table
    console.log("\n=== All Vendors ===");
    console.log("WP ID | Status  | Store Name           | Email");
    console.log("------+---------+----------------------+---------------------------");
    results.forEach(r =>
      console.log(`${r.wcId.padEnd(5)} | ${r.status.padEnd(7)} | ${r.store.substring(0,20).padEnd(20)} | ${r.email}`)
    );
  }

  await db.$disconnect();
}

main().catch(async (e) => {
  console.error("Fatal:", e);
  await db.$disconnect();
  process.exit(1);
});
