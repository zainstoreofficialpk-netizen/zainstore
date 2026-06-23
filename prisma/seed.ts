import {
  CommissionType,
  CouponType,
  PayoutMethod,
  PrismaClient,
  ProductStatus,
  ReviewStatus,
  SubscriptionStatus,
  UserRole,
  VendorStatus,
  WithdrawalStatus,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// ─── Image helpers ────────────────────────────────────────────
const UNS = (id: string, w = 800, h = 600) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&h=${h}&q=80`;

async function main() {
  const passwordHash = await bcrypt.hash("zainstore123", 10);

  // ── Roles ──────────────────────────────────────────────────
  await Promise.all([
    prisma.role.upsert({ where: { key: UserRole.SUPER_ADMIN }, update: {}, create: { key: UserRole.SUPER_ADMIN, name: "Super Admin", permissions: ["*"] } }),
    prisma.role.upsert({ where: { key: UserRole.VENDOR }, update: {}, create: { key: UserRole.VENDOR, name: "Vendor", permissions: ["vendor:*"] } }),
    prisma.role.upsert({ where: { key: UserRole.CUSTOMER }, update: {}, create: { key: UserRole.CUSTOMER, name: "Customer", permissions: ["customer:*"] } }),
  ]);

  // ── Users ──────────────────────────────────────────────────
  const admin = await prisma.user.upsert({
    where: { email: "zainstoreofficial.pk@gmail.com" },
    update: { passwordHash },
    create: { name: "ZainStore Admin", email: "zainstoreofficial.pk@gmail.com", emailVerified: new Date(), passwordHash, role: UserRole.SUPER_ADMIN },
  });

  const customer = await prisma.user.upsert({
    where: { email: "customer@zainstore.local" },
    update: {},
    create: { name: "Mina Shah", email: "customer@zainstore.local", emailVerified: new Date(), passwordHash, role: UserRole.CUSTOMER, customerProfile: { create: {} } },
  });

  // ── Membership Plan ────────────────────────────────────────
  const freePlan = await prisma.membershipPlan.upsert({
    where: { slug: "free" },
    update: {},
    create: { name: "Free", slug: "free", description: "Starter plan for new vendors.", maxProducts: 50, commissionRate: "12.00", trialDays: 0, features: ["Basic listings", "Standard support"] },
  });

  // ── Categories ──────────────────────────────────────────────
  const catDefs = [
    { name: "Electronics",       slug: "electronics",    imageUrl: UNS("photo-1498049794561-7780e7231661", 600, 600), commissionValue: "12.00" },
    { name: "Fashion",           slug: "fashion",        imageUrl: UNS("photo-1445205170230-053b83016050", 600, 600), commissionValue: "10.00" },
    { name: "Home & Living",     slug: "home-living",    imageUrl: UNS("photo-1555041469-a586c61ea9bc", 600, 600),     commissionValue: "10.00" },
    { name: "Beauty & Care",     slug: "beauty-care",    imageUrl: UNS("photo-1522335789203-aabd1fc54bc9", 600, 600), commissionValue: "11.00" },
    { name: "Sports & Fitness",  slug: "sports-fitness", imageUrl: UNS("photo-1571019614242-c5c5dee9f50b", 600, 600), commissionValue: "10.00" },
    { name: "Books",             slug: "books",          imageUrl: UNS("photo-1481627834876-b7833e8f5570", 600, 600), commissionValue: "8.00"  },
    { name: "Baby & Kids",       slug: "baby-kids",      imageUrl: UNS("photo-1515488042361-ee00e0ddd4e4", 600, 600), commissionValue: "9.00"  },
    { name: "Mobile & Accessories", slug: "mobile-accessories", imageUrl: UNS("photo-1511707171634-5f897ff02aa9", 600, 600), commissionValue: "12.00" },
    { name: "Shoes & Bags",      slug: "shoes-bags",     imageUrl: UNS("photo-1542291026-7eec264c27ff", 600, 600),    commissionValue: "10.00" },
    { name: "Groceries",         slug: "groceries",      imageUrl: UNS("photo-1543352634-99a5d50ae78e", 600, 600),    commissionValue: "8.00"  },
  ] as const;

  const cats: Record<string, Awaited<ReturnType<typeof prisma.category.upsert>>> = {};
  for (const c of catDefs) {
    cats[c.slug] = await prisma.category.upsert({
      where: { slug: c.slug },
      update: { imageUrl: c.imageUrl },
      create: { name: c.name, slug: c.slug, imageUrl: c.imageUrl, commissionType: CommissionType.PERCENTAGE_OF_SALE, commissionValue: c.commissionValue },
    });
  }

  // Sub-categories
  const subCatDefs = [
    { name: "Smartphones",      slug: "smartphones",      parentSlug: "electronics" },
    { name: "Laptops & Tablets",slug: "laptops-tablets",  parentSlug: "electronics" },
    { name: "Audio & Wearables",slug: "audio-wearables",  parentSlug: "electronics" },
    { name: "Men's Wear",       slug: "mens-wear",         parentSlug: "fashion"     },
    { name: "Women's Wear",     slug: "womens-wear",       parentSlug: "fashion"     },
    { name: "Kids' Wear",       slug: "kids-wear",         parentSlug: "fashion"     },
    { name: "Furniture",        slug: "furniture",         parentSlug: "home-living" },
    { name: "Kitchen & Dining", slug: "kitchen-dining",    parentSlug: "home-living" },
    { name: "Running Shoes",    slug: "running-shoes",     parentSlug: "shoes-bags"  },
    { name: "Handbags",         slug: "handbags",          parentSlug: "shoes-bags"  },
  ];
  for (const sc of subCatDefs) {
    await prisma.category.upsert({
      where: { slug: sc.slug },
      update: {},
      create: { name: sc.name, slug: sc.slug, parentId: cats[sc.parentSlug].id },
    });
  }

  // ── Brands ─────────────────────────────────────────────────
  const brandDefs = [
    { name: "Zain Select",  slug: "zain-select",  logoUrl: null },
    { name: "TechPro",      slug: "techpro",       logoUrl: null },
    { name: "StyleHub",     slug: "stylehub",      logoUrl: null },
    { name: "NaturGlow",    slug: "naturglow",     logoUrl: null },
    { name: "FitLife",      slug: "fitlife",       logoUrl: null },
  ];
  const brands: Record<string, string> = {};
  for (const b of brandDefs) {
    const r = await prisma.brand.upsert({ where: { slug: b.slug }, update: {}, create: b });
    brands[b.slug] = r.id;
  }

  // ── Hero Slider Banners ─────────────────────────────────────
  const heroBanners = [
    {
      id: "banner-hero-01",
      title: "Summer Fashion Sale — Up to 60% Off",
      imageUrl: UNS("photo-1490481651871-ab68de25d43d", 1400, 560),
      linkUrl: "/shop/category/fashion",
      placement: "slider",
    },
    {
      id: "banner-hero-02",
      title: "Electronics Mega Deals — Top Brands",
      imageUrl: UNS("photo-1518770660439-4636190af475", 1400, 560),
      linkUrl: "/shop/category/electronics",
      placement: "slider",
    },
    {
      id: "banner-hero-03",
      title: "Home Makeover Sale — Transform Your Space",
      imageUrl: UNS("photo-1586023492125-27b2c045efd7", 1400, 560),
      linkUrl: "/shop/category/home-living",
      placement: "slider",
    },
    {
      id: "banner-hero-04",
      title: "Beauty Festival — Glow Up This Season",
      imageUrl: UNS("photo-1522335789203-aabd1fc54bc9", 1400, 560),
      linkUrl: "/shop/category/beauty-care",
      placement: "slider",
    },
    {
      id: "banner-hero-05",
      title: "New Arrivals — Fresh Styles Every Day",
      imageUrl: UNS("photo-1483985988355-763728e1935b", 1400, 560),
      linkUrl: "/shop",
      placement: "slider",
    },
  ];
  for (const b of heroBanners) {
    await prisma.banner.upsert({ where: { id: b.id }, update: { imageUrl: b.imageUrl, title: b.title }, create: { ...b, active: true } });
  }

  // Promo banners
  const promoBanners = [
    { id: "banner-promo-01", title: "Flash Sale — Prices Slashed", imageUrl: UNS("photo-1607082348824-0a96f2a4b9da", 600, 300), linkUrl: "/shop/sale", placement: "promo" },
    { id: "banner-promo-02", title: "Free Delivery on PKR 2,000+", imageUrl: UNS("photo-1566576912321-d58ddd7a6088", 600, 300), linkUrl: "/shop", placement: "promo" },
    { id: "banner-promo-03", title: "Top Vendor Picks", imageUrl: UNS("photo-1556742049-0cfed4f6a45d", 600, 300), linkUrl: "/shop/stores", placement: "promo" },
  ];
  for (const b of promoBanners) {
    await prisma.banner.upsert({ where: { id: b.id }, update: { imageUrl: b.imageUrl }, create: { ...b, active: true } });
  }

  // ── Vendor helper ───────────────────────────────────────────
  async function upsertVendor(opts: {
    email: string; ownerName: string; storeName: string; storeSlug: string;
    storeDesc: string; logoUrl: string; bannerUrl: string;
    phone: string; address: string; trustScore: number;
  }) {
    const owner = await prisma.user.upsert({
      where: { email: opts.email },
      update: {},
      create: { name: opts.ownerName, email: opts.email, emailVerified: new Date(), passwordHash, role: UserRole.VENDOR },
    });
    const vendor = await prisma.vendorProfile.upsert({
      where: { userId: owner.id },
      update: {},
      create: { userId: owner.id, status: VendorStatus.ACTIVE, approvedAt: new Date(), bankName: "HBL", accountTitle: opts.ownerName, accountNumber: "00011223344", iban: "PK00HBL00011223344", commissionType: CommissionType.PERCENTAGE_OF_SALE, commissionValue: "10.00" },
    });
    const store = await prisma.store.upsert({
      where: { slug: opts.storeSlug },
      update: { logoUrl: opts.logoUrl, bannerUrl: opts.bannerUrl, description: opts.storeDesc },
      create: { vendorId: vendor.id, name: opts.storeName, slug: opts.storeSlug, description: opts.storeDesc, logoUrl: opts.logoUrl, bannerUrl: opts.bannerUrl, email: opts.email, phone: opts.phone, address: opts.address },
    });
    await prisma.vendorSubscription.upsert({
      where: { id: `${vendor.id}-free-plan` },
      update: {},
      create: { id: `${vendor.id}-free-plan`, vendorId: vendor.id, planId: freePlan.id, status: SubscriptionStatus.ACTIVE },
    });
    await prisma.vendorTrustScore.upsert({
      where: { vendorId: vendor.id },
      update: { overallScore: opts.trustScore, avgRating: opts.trustScore, positivePercent: opts.trustScore * 20 },
      create: { vendorId: vendor.id, overallScore: opts.trustScore, avgRating: opts.trustScore, totalReviews: Math.floor(opts.trustScore * 40), positivePercent: opts.trustScore * 20, orderCompletionRate: 96, refundRate: 2 },
    });
    await prisma.withdrawal.upsert({
      where: { id: `${vendor.id}-opening-withdrawal` },
      update: {},
      create: { id: `${vendor.id}-opening-withdrawal`, vendorId: vendor.id, amount: "250000.00", method: PayoutMethod.BANK_TRANSFER, status: WithdrawalStatus.REQUESTED },
    });
    return { owner, vendor, store };
  }

  // ── Vendors ─────────────────────────────────────────────────
  const { vendor: vendorUL, store: storeUL } = await upsertVendor({
    email: "seller-one@zainstore.local",
    ownerName: "Ayesha Khan",
    storeName: "Urban Loom",
    storeSlug: "urban-loom",
    storeDesc: "Premium fashion store offering contemporary Pakistani and international styles.",
    logoUrl: UNS("photo-1472851294608-062f824d29cc", 200, 200),
    bannerUrl: UNS("photo-1490481651871-ab68de25d43d", 1200, 400),
    phone: "+92 300 1111111",
    address: "Gulshan-e-Iqbal, Karachi",
    trustScore: 4.7,
  });

  const { vendor: vendorGY, store: storeGY } = await upsertVendor({
    email: "seller-two@zainstore.local",
    ownerName: "Hamza Malik",
    storeName: "Gadget Yard",
    storeSlug: "gadget-yard",
    storeDesc: "Your one-stop shop for the latest electronics, gadgets, and accessories.",
    logoUrl: UNS("photo-1518770660439-4636190af475", 200, 200),
    bannerUrl: UNS("photo-1498049794561-7780e7231661", 1200, 400),
    phone: "+92 300 2222222",
    address: "DHA Phase 6, Lahore",
    trustScore: 4.8,
  });

  const { vendor: vendorHN, store: storeHN } = await upsertVendor({
    email: "seller-three@zainstore.local",
    ownerName: "Fatima Noor",
    storeName: "HomeNest",
    storeSlug: "homenest",
    storeDesc: "Curated home décor, furniture, and kitchen essentials for the modern Pakistani home.",
    logoUrl: UNS("photo-1556742049-0cfed4f6a45d", 200, 200),
    bannerUrl: UNS("photo-1586023492125-27b2c045efd7", 1200, 400),
    phone: "+92 300 3333333",
    address: "F-7 Markaz, Islamabad",
    trustScore: 4.5,
  });

  // ── Product helper ──────────────────────────────────────────
  async function upsertProduct(opts: {
    id: string; vendorId: string; storeId: string; categorySlug: string; brandSlug: string;
    name: string; slug: string; sku: string; shortDescription: string; description: string;
    price: string; salePrice?: string; stock: number; imageUrl: string;
    featured?: boolean; viewCount?: number;
  }) {
    const p = await prisma.product.upsert({
      where: { slug: opts.slug },
      update: { price: opts.price, salePrice: opts.salePrice ?? null, featured: opts.featured ?? false, viewCount: opts.viewCount ?? 0 },
      create: {
        id: opts.id,
        vendorId: opts.vendorId,
        storeId: opts.storeId,
        categoryId: cats[opts.categorySlug].id,
        brandId: brands[opts.brandSlug],
        name: opts.name,
        slug: opts.slug,
        sku: opts.sku,
        shortDescription: opts.shortDescription,
        description: opts.description,
        price: opts.price,
        salePrice: opts.salePrice,
        stock: opts.stock,
        status: ProductStatus.ACTIVE,
        featured: opts.featured ?? false,
        viewCount: opts.viewCount ?? 0,
      },
    });
    await prisma.productImage.upsert({
      where: { id: `${opts.id}-img` },
      update: { url: opts.imageUrl },
      create: { id: `${opts.id}-img`, productId: p.id, url: opts.imageUrl, alt: opts.name, sortOrder: 0 },
    });
    return p;
  }

  // ── Urban Loom Products ─────────────────────────────────────
  const pUL1 = await upsertProduct({ id: "seed_ul_001", vendorId: vendorUL.id, storeId: storeUL.id, categorySlug: "fashion", brandSlug: "stylehub", name: "Cotton Overshirt", slug: "cotton-overshirt", sku: "UL-COTTON-OS", shortDescription: "Breathable cotton overshirt for daily wear", description: "Premium cotton overshirt crafted for comfort. Perfect for Pakistani weather.", price: "3499.00", stock: 42, imageUrl: UNS("photo-1523398002811-999ca8dec234", 600, 600), featured: true, viewCount: 1240 });
  const pUL2 = await upsertProduct({ id: "seed_ul_002", vendorId: vendorUL.id, storeId: storeUL.id, categorySlug: "fashion", brandSlug: "stylehub", name: "Slim Fit Chinos", slug: "slim-fit-chinos", sku: "UL-CHINO-SLM", shortDescription: "Modern slim-fit chinos in premium cotton blend", description: "Versatile slim-fit chinos that transition effortlessly from office to evening wear.", price: "4299.00", salePrice: "2999.00", stock: 65, imageUrl: UNS("photo-1542272604-787c3835535d", 600, 600), featured: true, viewCount: 980 });
  const pUL3 = await upsertProduct({ id: "seed_ul_003", vendorId: vendorUL.id, storeId: storeUL.id, categorySlug: "fashion", brandSlug: "stylehub", name: "Embroidered Lawn Kurti", slug: "embroidered-lawn-kurti", sku: "UL-KURTI-EMB", shortDescription: "Hand-embroidered lawn kurti with intricate detailing", description: "Beautiful hand-crafted embroidered lawn kurti, perfect for eid and special occasions.", price: "2899.00", stock: 88, imageUrl: UNS("photo-1583391733956-6c78276477e2", 600, 600), viewCount: 2100 });
  const pUL4 = await upsertProduct({ id: "seed_ul_004", vendorId: vendorUL.id, storeId: storeUL.id, categorySlug: "fashion", brandSlug: "stylehub", name: "Floral Maxi Dress", slug: "floral-maxi-dress", sku: "UL-DRESS-FLR", shortDescription: "Elegant floral maxi dress for summer evenings", description: "Graceful floral maxi dress in breathable fabric, ideal for parties and gatherings.", price: "5499.00", salePrice: "3799.00", stock: 30, imageUrl: UNS("photo-1572804013309-59a88b7e92f1", 600, 600), featured: true, viewCount: 1560 });
  const pUL5 = await upsertProduct({ id: "seed_ul_005", vendorId: vendorUL.id, storeId: storeUL.id, categorySlug: "fashion", brandSlug: "stylehub", name: "Denim Jacket", slug: "denim-jacket", sku: "UL-DENIM-JKT", shortDescription: "Classic denim jacket with modern cut", description: "Timeless denim jacket with a contemporary silhouette. A wardrobe essential.", price: "6999.00", salePrice: "4999.00", stock: 50, imageUrl: UNS("photo-1551537482-f2075a1d41f2", 600, 600), viewCount: 870 });
  const pUL6 = await upsertProduct({ id: "seed_ul_006", vendorId: vendorUL.id, storeId: storeUL.id, categorySlug: "fashion", brandSlug: "stylehub", name: "Men's Casual T-Shirt Pack (3)", slug: "mens-casual-tshirt-pack", sku: "UL-TSHIRT-3PK", shortDescription: "Pack of 3 premium cotton t-shirts", description: "Comfortable everyday t-shirts in 3 versatile colors. 100% combed cotton.", price: "2499.00", stock: 120, imageUrl: UNS("photo-1521572163474-6864f9cf17ab", 600, 600), viewCount: 3200 });
  const pUL7 = await upsertProduct({ id: "seed_ul_007", vendorId: vendorUL.id, storeId: storeUL.id, categorySlug: "shoes-bags", brandSlug: "stylehub", name: "Structured Leather Handbag", slug: "structured-leather-handbag", sku: "UL-BAG-LEATH", shortDescription: "Premium structured handbag in genuine leather", description: "Sophisticated leather handbag with multiple compartments. Available in black, brown, tan.", price: "8999.00", salePrice: "6499.00", stock: 22, imageUrl: UNS("photo-1548036328-c9fa89d128fa", 600, 600), featured: true, viewCount: 1890 });
  const pUL8 = await upsertProduct({ id: "seed_ul_008", vendorId: vendorUL.id, storeId: storeUL.id, categorySlug: "shoes-bags", brandSlug: "stylehub", name: "Men's Oxford Formal Shoes", slug: "mens-oxford-formal-shoes", sku: "UL-SHOES-OXF", shortDescription: "Classic Oxford shoes in genuine leather", description: "Hand-crafted Oxford shoes with leather sole. Ideal for formal and semi-formal occasions.", price: "7499.00", salePrice: "5499.00", stock: 35, imageUrl: UNS("photo-1449505278894-297fdb3edbc1", 600, 600), viewCount: 1100 });

  // ── Gadget Yard Products ─────────────────────────────────────
  const pGY1 = await upsertProduct({ id: "seed_gy_001", vendorId: vendorGY.id, storeId: storeGY.id, categorySlug: "electronics", brandSlug: "techpro", name: "Fast Charge Power Bank 20000mAh", slug: "fast-charge-power-bank", sku: "GY-PB-20K", shortDescription: "20,000mAh power bank with 65W fast charging", description: "Compact yet powerful 20,000mAh power bank supporting 65W PD fast charging for laptops and phones.", price: "6999.00", salePrice: "4999.00", stock: 85, imageUrl: UNS("photo-1609091839311-d5365f9ff1c5", 600, 600), featured: true, viewCount: 4200 });
  const pGY2 = await upsertProduct({ id: "seed_gy_002", vendorId: vendorGY.id, storeId: storeGY.id, categorySlug: "electronics", brandSlug: "techpro", name: "True Wireless Earbuds Pro", slug: "true-wireless-earbuds-pro", sku: "GY-TWS-PRO", shortDescription: "Active noise cancelling wireless earbuds", description: "Premium TWS earbuds with ANC, 30-hour battery life, and IPX5 water resistance.", price: "9999.00", salePrice: "7499.00", stock: 60, imageUrl: UNS("photo-1590658268037-6bf12165a8df", 600, 600), featured: true, viewCount: 3800 });
  const pGY3 = await upsertProduct({ id: "seed_gy_003", vendorId: vendorGY.id, storeId: storeGY.id, categorySlug: "electronics", brandSlug: "techpro", name: "Smart Fitness Watch", slug: "smart-fitness-watch", sku: "GY-WATCH-FIT", shortDescription: "AMOLED smartwatch with health monitoring", description: "Feature-packed smartwatch with AMOLED display, SpO2, heart rate, and 7-day battery life.", price: "12999.00", salePrice: "9999.00", stock: 45, imageUrl: UNS("photo-1523275335684-37898b6baf30", 600, 600), featured: true, viewCount: 5100 });
  const pGY4 = await upsertProduct({ id: "seed_gy_004", vendorId: vendorGY.id, storeId: storeGY.id, categorySlug: "electronics", brandSlug: "techpro", name: "Slim Laptop Bag 15.6\"", slug: "slim-laptop-bag-15", sku: "GY-BAG-15IN", shortDescription: "Water-resistant slim laptop bag with organizer", description: "Premium water-resistant laptop bag with padded compartment and multiple organizer pockets.", price: "3999.00", stock: 110, imageUrl: UNS("photo-1553062407-98eeb64c6a62", 600, 600), viewCount: 920 });
  const pGY5 = await upsertProduct({ id: "seed_gy_005", vendorId: vendorGY.id, storeId: storeGY.id, categorySlug: "electronics", brandSlug: "techpro", name: "7-in-1 USB-C Hub", slug: "usb-c-hub-7in1", sku: "GY-HUB-7IN1", shortDescription: "Plug-and-play USB-C hub with HDMI 4K output", description: "Connect up to 7 devices simultaneously. Supports 4K HDMI, 100W PD, USB 3.0, SD card.", price: "4499.00", salePrice: "2999.00", stock: 75, imageUrl: UNS("photo-1625961332771-3f40b0e2bdcf", 600, 600), viewCount: 2300 });
  const pGY6 = await upsertProduct({ id: "seed_gy_006", vendorId: vendorGY.id, storeId: storeGY.id, categorySlug: "electronics", brandSlug: "techpro", name: "Mechanical Gaming Keyboard", slug: "mechanical-gaming-keyboard", sku: "GY-KB-MECH", shortDescription: "TKL mechanical keyboard with RGB backlight", description: "Compact TKL mechanical keyboard with Cherry MX Red switches and per-key RGB lighting.", price: "8999.00", salePrice: "6499.00", stock: 40, imageUrl: UNS("photo-1561883088-039e53143d73", 600, 600), featured: true, viewCount: 2750 });
  const pGY7 = await upsertProduct({ id: "seed_gy_007", vendorId: vendorGY.id, storeId: storeGY.id, categorySlug: "electronics", brandSlug: "techpro", name: "Full HD 1080p Webcam", slug: "full-hd-webcam-1080p", sku: "GY-CAM-1080", shortDescription: "Plug-and-play 1080p webcam with noise-cancelling mic", description: "Crystal-clear 1080p HD webcam with autofocus, low-light correction, and built-in mic.", price: "5499.00", stock: 55, imageUrl: UNS("photo-1593642632559-0c6d3fc62b89", 600, 600), viewCount: 1650 });
  const pGY8 = await upsertProduct({ id: "seed_gy_008", vendorId: vendorGY.id, storeId: storeGY.id, categorySlug: "electronics", brandSlug: "techpro", name: "Portable Bluetooth Speaker", slug: "portable-bluetooth-speaker", sku: "GY-SPK-BT", shortDescription: "360° waterproof Bluetooth speaker with 24hr battery", description: "Immersive 360° sound with deep bass. IPX7 waterproof, 24-hour battery, built-in microphone.", price: "7999.00", salePrice: "5999.00", stock: 90, imageUrl: UNS("photo-1608043152269-423dbba4e7e1", 600, 600), viewCount: 3400 });

  // ── HomeNest Products ───────────────────────────────────────
  const pHN1 = await upsertProduct({ id: "seed_hn_001", vendorId: vendorHN.id, storeId: storeHN.id, categorySlug: "home-living", brandSlug: "zain-select", name: "Ceramic LED Table Lamp", slug: "ceramic-led-table-lamp", sku: "HN-LAMP-CER", shortDescription: "Handcrafted ceramic lamp with warm LED bulb", description: "Artisan-crafted ceramic table lamp. Comes with a 6W warm white LED bulb. Perfect for bedside or desk.", price: "4999.00", salePrice: "3499.00", stock: 38, imageUrl: UNS("photo-1507473885765-e6ed057f782c", 600, 600), featured: true, viewCount: 1420 });
  const pHN2 = await upsertProduct({ id: "seed_hn_002", vendorId: vendorHN.id, storeId: storeHN.id, categorySlug: "home-living", brandSlug: "zain-select", name: "Egyptian Cotton Bedsheet Set", slug: "egyptian-cotton-bedsheet-set", sku: "HN-SHEET-EG", shortDescription: "500 thread count Egyptian cotton bedsheet set", description: "Luxurious 500 TC Egyptian cotton bedsheet set. Includes fitted sheet, flat sheet, 2 pillowcases.", price: "8999.00", salePrice: "5999.00", stock: 55, imageUrl: UNS("photo-1631049307264-da0ec9d70304", 600, 600), featured: true, viewCount: 2800 });
  const pHN3 = await upsertProduct({ id: "seed_hn_003", vendorId: vendorHN.id, storeId: storeHN.id, categorySlug: "home-living", brandSlug: "zain-select", name: "Bamboo Kitchen Organizer Set", slug: "bamboo-kitchen-organizer-set", sku: "HN-ORG-BAMB", shortDescription: "Eco-friendly bamboo kitchen organizer, 5-piece set", description: "Sustainable 5-piece bamboo organizer set for countertops, drawers, and shelves.", price: "3299.00", stock: 70, imageUrl: UNS("photo-1556909114-f6e7ad7d3136", 600, 600), viewCount: 890 });
  const pHN4 = await upsertProduct({ id: "seed_hn_004", vendorId: vendorHN.id, storeId: storeHN.id, categorySlug: "home-living", brandSlug: "zain-select", name: "Velvet Cushion Covers (Set of 4)", slug: "velvet-cushion-covers-set", sku: "HN-CUSH-VLV", shortDescription: "Premium velvet cushion covers in rich jewel tones", description: "Luxurious velvet cushion covers in a 4-piece set. Available in emerald, navy, burgundy, gold.", price: "2999.00", salePrice: "1999.00", stock: 95, imageUrl: UNS("photo-1555041469-a586c61ea9bc", 600, 600), viewCount: 2150 });
  const pHN5 = await upsertProduct({ id: "seed_hn_005", vendorId: vendorHN.id, storeId: storeHN.id, categorySlug: "home-living", brandSlug: "zain-select", name: "Minimalist Wall Clock", slug: "minimalist-wall-clock", sku: "HN-CLOCK-MIN", shortDescription: "Nordic minimalist 30cm wall clock", description: "Clean-lined Nordic-style wall clock in brushed steel. Silent sweep mechanism, 30cm diameter.", price: "3499.00", stock: 42, imageUrl: UNS("photo-1563861826100-9cb868fdbe1c", 600, 600), viewCount: 1100 });
  const pHN6 = await upsertProduct({ id: "seed_hn_006", vendorId: vendorHN.id, storeId: storeHN.id, categorySlug: "home-living", brandSlug: "zain-select", name: "Scented Soy Candle Collection", slug: "scented-soy-candle-collection", sku: "HN-CNDL-SOY", shortDescription: "Set of 3 hand-poured soy candles", description: "Beautifully packaged set of 3 hand-poured soy candles in rose, oud, and jasmine scents.", price: "2799.00", salePrice: "1899.00", stock: 80, imageUrl: UNS("photo-1602143407151-7111542de6e8", 600, 600), viewCount: 3200 });
  const pHN7 = await upsertProduct({ id: "seed_hn_007", vendorId: vendorHN.id, storeId: storeHN.id, categorySlug: "home-living", brandSlug: "zain-select", name: "Non-Stick Cookware Set (5-Piece)", slug: "nonstick-cookware-set-5piece", sku: "HN-COOK-5PC", shortDescription: "Granite-coated non-stick cookware set", description: "Premium 5-piece granite-coated non-stick cookware. Includes frying pan, 2 saucepans, casserole, wok.", price: "12999.00", salePrice: "8999.00", stock: 28, imageUrl: UNS("photo-1584986966882-fd93d8b7b459", 600, 600), featured: true, viewCount: 4100 });
  const pHN8 = await upsertProduct({ id: "seed_hn_008", vendorId: vendorHN.id, storeId: storeHN.id, categorySlug: "home-living", brandSlug: "zain-select", name: "Woven Storage Basket (Set of 3)", slug: "woven-storage-basket-set", sku: "HN-BSKT-WVN", shortDescription: "Handwoven seagrass baskets with lids", description: "Handcrafted seagrass baskets in 3 nesting sizes. Ideal for blankets, toys, laundry, or décor.", price: "4499.00", stock: 60, imageUrl: UNS("photo-1598300042247-d088f8ab3a91", 600, 600), viewCount: 760 });

  // ── Reviews ─────────────────────────────────────────────────
  // Each needs userId, productId, rating (1-5), status APPROVED
  const reviewData = [
    // Urban Loom
    { id: "rv_ul1_1", userId: customer.id, productId: pUL1.id, rating: 5, title: "Excellent quality!", comment: "The fabric is amazing and the fit is perfect. Highly recommend!" },
    { id: "rv_ul1_2", userId: admin.id, productId: pUL1.id, rating: 4, title: "Good purchase", comment: "Good quality shirt, comfortable for daily use." },
    { id: "rv_ul3_1", userId: customer.id, productId: pUL3.id, rating: 5, title: "Beautiful embroidery", comment: "The embroidery work is stunning. Got so many compliments!" },
    { id: "rv_ul4_1", userId: customer.id, productId: pUL4.id, rating: 5, title: "Perfect dress!", comment: "The fabric is breathable and the cut is so elegant." },
    { id: "rv_ul7_1", userId: customer.id, productId: pUL7.id, rating: 5, title: "Premium quality handbag", comment: "Worth every rupee. The leather quality is outstanding." },
    { id: "rv_ul7_2", userId: admin.id, productId: pUL7.id, rating: 4, title: "Stylish and spacious", comment: "Great bag, fits everything I need." },
    // Gadget Yard
    { id: "rv_gy1_1", userId: customer.id, productId: pGY1.id, rating: 5, title: "Best power bank!", comment: "Charges my laptop and phone simultaneously. Fast charging works great!" },
    { id: "rv_gy1_2", userId: admin.id, productId: pGY1.id, rating: 5, title: "Must have!", comment: "Extremely reliable. The 65W PD output is a game changer." },
    { id: "rv_gy2_1", userId: customer.id, productId: pGY2.id, rating: 5, title: "Incredible sound quality", comment: "The ANC is phenomenal. Bass is punchy and treble is crisp." },
    { id: "rv_gy2_2", userId: admin.id, productId: pGY2.id, rating: 4, title: "Great earbuds", comment: "Comfortable fit and long battery life. Very satisfied." },
    { id: "rv_gy3_1", userId: customer.id, productId: pGY3.id, rating: 5, title: "Superb smartwatch", comment: "AMOLED screen is gorgeous. The health tracking is accurate." },
    { id: "rv_gy6_1", userId: customer.id, productId: pGY6.id, rating: 5, title: "Gaming feels amazing", comment: "Tactile feedback is satisfying. RGB is beautiful." },
    { id: "rv_gy8_1", userId: customer.id, productId: pGY8.id, rating: 4, title: "Loud and clear", comment: "360 sound is impressive for the price. Waterproofing tested and confirmed!" },
    // HomeNest
    { id: "rv_hn1_1", userId: customer.id, productId: pHN1.id, rating: 5, title: "Adds so much warmth!", comment: "The ceramic is beautifully detailed. Creates a cozy atmosphere." },
    { id: "rv_hn2_1", userId: customer.id, productId: pHN2.id, rating: 5, title: "Hotel-quality sheets", comment: "Absolutely silky and cool. Best bedsheets I've ever owned." },
    { id: "rv_hn2_2", userId: admin.id, productId: pHN2.id, rating: 5, title: "Luxury at a great price", comment: "500 TC cotton feels incredible. Fast delivery too!" },
    { id: "rv_hn4_1", userId: customer.id, productId: pHN4.id, rating: 4, title: "Beautiful covers", comment: "The velvet is rich and the colors are exactly as shown." },
    { id: "rv_hn6_1", userId: customer.id, productId: pHN6.id, rating: 5, title: "Home smells amazing", comment: "The oud scent is divine. Burns clean and lasts long." },
    { id: "rv_hn7_1", userId: customer.id, productId: pHN7.id, rating: 5, title: "No more sticking!", comment: "Non-stick coating is flawless. Even distribution of heat." },
    { id: "rv_hn7_2", userId: admin.id, productId: pHN7.id, rating: 4, title: "Quality cookware", comment: "Solid set, handles are sturdy. Great value." },
  ];

  for (const r of reviewData) {
    await prisma.review.upsert({
      where: { id: r.id },
      update: {},
      create: {
        id: r.id,
        userId: r.userId,
        productId: r.productId,
        rating: r.rating,
        title: r.title,
        comment: r.comment,
        status: ReviewStatus.APPROVED,
        verifiedPurchase: true,
      },
    });
  }

  // ── Coupon ─────────────────────────────────────────────────
  await prisma.coupon.upsert({
    where: { code: "WELCOME10" },
    update: {},
    create: { code: "WELCOME10", name: "Welcome Discount", type: CouponType.PERCENTAGE, value: "10.00", usageLimit: 5000, minOrderAmount: "2500.00" },
  });
  await prisma.coupon.upsert({
    where: { code: "SUMMER25" },
    update: {},
    create: { code: "SUMMER25", name: "Summer Sale 25% Off", type: CouponType.PERCENTAGE, value: "25.00", usageLimit: 1000, minOrderAmount: "5000.00" },
  });

  // ── Customer address ────────────────────────────────────────
  const existingAddr = await prisma.address.findFirst({ where: { userId: customer.id } });
  if (!existingAddr) {
    await prisma.address.create({
      data: { userId: customer.id, label: "Home", line1: "House 12, Clifton Block 5", city: "Karachi", region: "Sindh" },
    });
  }

  console.log(`✅ ZainStore.pk — rich seed complete. Admin: ${admin.email}`);
}

main()
  .catch((error) => { console.error(error); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
