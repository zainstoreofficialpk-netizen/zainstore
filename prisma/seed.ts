import {
  CommissionType,
  CouponType,
  PayoutMethod,
  PrismaClient,
  ProductStatus,
  SubscriptionStatus,
  UserRole,
  VendorStatus,
  WithdrawalStatus,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("zainstore123", 10);

  await Promise.all([
    prisma.role.upsert({
      where: { key: UserRole.SUPER_ADMIN },
      update: {},
      create: { key: UserRole.SUPER_ADMIN, name: "Super Admin", permissions: ["*"] },
    }),
    prisma.role.upsert({
      where: { key: UserRole.VENDOR },
      update: {},
      create: { key: UserRole.VENDOR, name: "Vendor", permissions: ["vendor:*"] },
    }),
    prisma.role.upsert({
      where: { key: UserRole.CUSTOMER },
      update: {},
      create: { key: UserRole.CUSTOMER, name: "Customer", permissions: ["customer:*"] },
    }),
  ]);

  const admin = await prisma.user.upsert({
    where: { email: "admin@zainstore.local" },
    update: {},
    create: {
      name: "ZainStore Admin",
      email: "admin@zainstore.local",
      emailVerified: new Date(),
      passwordHash,
      role: UserRole.SUPER_ADMIN,
    },
  });

  const customer = await prisma.user.upsert({
    where: { email: "customer@zainstore.local" },
    update: {},
    create: {
      name: "Mina Shah",
      email: "customer@zainstore.local",
      emailVerified: new Date(),
      passwordHash,
      role: UserRole.CUSTOMER,
      customerProfile: { create: {} },
    },
  });

  const freePlan = await prisma.membershipPlan.upsert({
    where: { slug: "free" },
    update: {},
    create: {
      name: "Free",
      slug: "free",
      description: "Starter plan for new vendors.",
      maxProducts: 50,
      commissionRate: "12.00",
      trialDays: 0,
      features: ["Basic listings", "Standard support"],
    },
  });

  const fashion = await prisma.category.upsert({
    where: { slug: "fashion" },
    update: {},
    create: { name: "Fashion", slug: "fashion", commissionType: CommissionType.PERCENTAGE_OF_SALE, commissionValue: "10.00" },
  });

  const electronics = await prisma.category.upsert({
    where: { slug: "electronics" },
    update: {},
    create: { name: "Electronics", slug: "electronics", commissionType: CommissionType.PERCENTAGE_OF_SALE, commissionValue: "12.00" },
  });

  const brand = await prisma.brand.upsert({
    where: { slug: "zain-select" },
    update: {},
    create: { name: "Zain Select", slug: "zain-select" },
  });

  const vendorSeeds = [
    {
      email: "seller-one@zainstore.local",
      ownerName: "Ayesha Khan",
      storeName: "Urban Loom",
      slug: "urban-loom",
      categoryId: fashion.id,
      product: {
        name: "Cotton Overshirt",
        slug: "cotton-overshirt",
        sku: "UL-COTTON-OVERSHIRT",
        description: "Breathable cotton overshirt designed for daily wear.",
        price: "3499.00",
        stock: 42,
        image: "https://images.unsplash.com/photo-1523398002811-999ca8dec234?auto=format&fit=crop&w=900&q=80",
      },
    },
    {
      email: "seller-two@zainstore.local",
      ownerName: "Hamza Malik",
      storeName: "Gadget Yard",
      slug: "gadget-yard",
      categoryId: electronics.id,
      product: {
        name: "Fast Charge Power Bank",
        slug: "fast-charge-power-bank",
        sku: "GY-POWER-BANK-20K",
        description: "Compact 20,000mAh power bank with dual USB-C output.",
        price: "6999.00",
        stock: 25,
        image: "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&w=900&q=80",
      },
    },
  ];

  for (const seed of vendorSeeds) {
    const owner = await prisma.user.upsert({
      where: { email: seed.email },
      update: {},
      create: {
        name: seed.ownerName,
        email: seed.email,
        emailVerified: new Date(),
        passwordHash,
        role: UserRole.VENDOR,
      },
    });

    const vendor = await prisma.vendorProfile.upsert({
      where: { userId: owner.id },
      update: {},
      create: {
        userId: owner.id,
        status: VendorStatus.ACTIVE,
        approvedAt: new Date(),
        bankName: "Meezan Bank",
        accountTitle: seed.ownerName,
        accountNumber: "00011223344",
        iban: "PK00MEZN00011223344",
        commissionType: CommissionType.PERCENTAGE_OF_SALE,
        commissionValue: "10.00",
      },
    });

    const store = await prisma.store.upsert({
      where: { slug: seed.slug },
      update: {},
      create: {
        vendorId: vendor.id,
        name: seed.storeName,
        slug: seed.slug,
        description: "Approved ZainStore.pk seller account.",
        email: seed.email,
        phone: "+92 300 0000000",
        address: "Karachi, Pakistan",
      },
    });

    await prisma.vendorSubscription.upsert({
      where: { id: `${vendor.id}-free-plan` },
      update: {},
      create: {
        id: `${vendor.id}-free-plan`,
        vendorId: vendor.id,
        planId: freePlan.id,
        status: SubscriptionStatus.ACTIVE,
      },
    });

    const product = await prisma.product.upsert({
      where: { slug: seed.product.slug },
      update: {},
      create: {
        vendorId: vendor.id,
        storeId: store.id,
        categoryId: seed.categoryId,
        brandId: brand.id,
        name: seed.product.name,
        slug: seed.product.slug,
        sku: seed.product.sku,
        description: seed.product.description,
        price: seed.product.price,
        stock: seed.product.stock,
        status: ProductStatus.ACTIVE,
        featured: true,
      },
    });

    await prisma.productImage.upsert({
      where: { id: `${product.id}-hero` },
      update: {},
      create: {
        id: `${product.id}-hero`,
        productId: product.id,
        url: seed.product.image,
        alt: seed.product.name,
      },
    });

    await prisma.withdrawal.upsert({
      where: { id: `${vendor.id}-opening-withdrawal` },
      update: {},
      create: {
        id: `${vendor.id}-opening-withdrawal`,
        vendorId: vendor.id,
        amount: "250000.00",
        method: PayoutMethod.BANK_TRANSFER,
        status: WithdrawalStatus.REQUESTED,
      },
    });
  }

  await prisma.coupon.upsert({
    where: { code: "WELCOME10" },
    update: {},
    create: {
      code: "WELCOME10",
      name: "Welcome Discount",
      type: CouponType.PERCENTAGE,
      value: "10.00",
      usageLimit: 5000,
      minOrderAmount: "2500.00",
    },
  });

  await prisma.address.create({
    data: {
      userId: customer.id,
      label: "Home",
      line1: "House 12, Clifton",
      city: "Karachi",
      region: "Sindh",
    },
  });

  console.log(`Seeded ZainStore.pk dashboard data with admin ${admin.email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
