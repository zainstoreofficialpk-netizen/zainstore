import { PrismaClient, ProductStatus, UserRole, VendorStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("zainstore123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@zainstore.local" },
    update: {},
    create: {
      name: "ZainStore Admin",
      email: "admin@zainstore.local",
      passwordHash,
      role: UserRole.ADMIN,
    },
  });

  const fashion = await prisma.category.upsert({
    where: { slug: "fashion" },
    update: {},
    create: { name: "Fashion", slug: "fashion" },
  });

  const electronics = await prisma.category.upsert({
    where: { slug: "electronics" },
    update: {},
    create: { name: "Electronics", slug: "electronics" },
  });

  const vendors = [
    {
      ownerEmail: "seller-one@zainstore.local",
      ownerName: "Ayesha Khan",
      storeName: "Urban Loom",
      slug: "urban-loom",
      description: "Everyday apparel and accessories from local makers.",
      products: [
        {
          categoryId: fashion.id,
          name: "Cotton Overshirt",
          slug: "cotton-overshirt",
          description: "Breathable cotton overshirt designed for daily wear.",
          price: "3499.00",
          compareAt: "4299.00",
          stock: 42,
          image: "https://images.unsplash.com/photo-1523398002811-999ca8dec234?auto=format&fit=crop&w=900&q=80",
        },
      ],
    },
    {
      ownerEmail: "seller-two@zainstore.local",
      ownerName: "Hamza Malik",
      storeName: "Gadget Yard",
      slug: "gadget-yard",
      description: "Smart accessories, chargers, and practical tech.",
      products: [
        {
          categoryId: electronics.id,
          name: "Fast Charge Power Bank",
          slug: "fast-charge-power-bank",
          description: "Compact 20,000mAh power bank with dual USB-C output.",
          price: "6999.00",
          compareAt: null,
          stock: 25,
          image: "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&w=900&q=80",
        },
      ],
    },
  ];

  for (const vendorSeed of vendors) {
    const owner = await prisma.user.upsert({
      where: { email: vendorSeed.ownerEmail },
      update: {},
      create: {
        name: vendorSeed.ownerName,
        email: vendorSeed.ownerEmail,
        passwordHash,
        role: UserRole.VENDOR,
      },
    });

    const vendor = await prisma.vendor.upsert({
      where: { slug: vendorSeed.slug },
      update: {},
      create: {
        ownerId: owner.id,
        storeName: vendorSeed.storeName,
        slug: vendorSeed.slug,
        description: vendorSeed.description,
        status: VendorStatus.ACTIVE,
      },
    });

    for (const productSeed of vendorSeed.products) {
      const product = await prisma.product.upsert({
        where: { slug: productSeed.slug },
        update: {},
        create: {
          vendorId: vendor.id,
          categoryId: productSeed.categoryId,
          name: productSeed.name,
          slug: productSeed.slug,
          description: productSeed.description,
          price: productSeed.price,
          compareAt: productSeed.compareAt,
          stock: productSeed.stock,
          status: ProductStatus.ACTIVE,
        },
      });

      await prisma.productImage.upsert({
        where: { id: `${product.id}-hero` },
        update: {},
        create: {
          id: `${product.id}-hero`,
          productId: product.id,
          url: productSeed.image,
          alt: productSeed.name,
        },
      });
    }
  }

  console.log(`Seeded ZainStore with admin ${admin.email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
