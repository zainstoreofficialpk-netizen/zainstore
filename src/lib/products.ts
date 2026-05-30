import { ProductStatus } from "@prisma/client";

import { db } from "@/lib/db";

export async function getFeaturedProducts() {
  try {
    return await db.product.findMany({
      where: { status: ProductStatus.ACTIVE },
      include: {
        vendor: true,
        category: true,
        images: { orderBy: { sortOrder: "asc" }, take: 1 },
      },
      orderBy: { createdAt: "desc" },
      take: 8,
    });
  } catch {
    return [];
  }
}

export async function getVendors() {
  try {
    return await db.vendor.findMany({
      include: {
        products: {
          where: { status: ProductStatus.ACTIVE },
          take: 4,
          include: { images: { take: 1 } },
        },
        _count: {
          select: { products: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  } catch {
    return [];
  }
}
