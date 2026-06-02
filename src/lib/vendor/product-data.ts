import { db } from "@/lib/db";
import { ProductStatus } from "@prisma/client";

export const PRODUCTS_PER_PAGE = 20;

export type ProductFilter = {
  search?: string;
  status?: ProductStatus | "ALL";
  page?: number;
};

// ── Vendor product list ───────────────────────────────────────────────────────

export async function getVendorProducts(vendorId: string, filter: ProductFilter = {}) {
  const { search = "", status = "ALL", page = 1 } = filter;
  const skip = (page - 1) * PRODUCTS_PER_PAGE;

  const where = {
    vendorId,
    ...(status !== "ALL" ? { status: status as ProductStatus } : {}),
    ...(search.trim()
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { sku: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [products, total] = await Promise.all([
    db.product.findMany({
      where,
      skip,
      take: PRODUCTS_PER_PAGE,
      orderBy: { updatedAt: "desc" },
      include: {
        images: { take: 1, orderBy: { sortOrder: "asc" } },
        category: { select: { name: true } },
        _count: { select: { orderItems: true, variants: true } },
      },
    }),
    db.product.count({ where }),
  ]);

  return { products, total, page, totalPages: Math.ceil(total / PRODUCTS_PER_PAGE) };
}

// ── Single product for edit ───────────────────────────────────────────────────

export async function getProductForEdit(productId: string, vendorId: string) {
  return db.product.findFirst({
    where: { id: productId, vendorId },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      variants: { orderBy: { createdAt: "asc" } },
      category: { select: { id: true, name: true } },
      brand: { select: { id: true, name: true } },
    },
  });
}

// ── Categories & brands for form selects ──────────────────────────────────────

export async function getCategoriesForSelect() {
  return db.category.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, parentId: true },
  });
}

export async function getBrandsForSelect() {
  return db.brand.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
}

// ── Vendor store info (needed to create product) ──────────────────────────────

export async function getVendorStore(userId: string) {
  return db.vendorProfile.findUnique({
    where: { userId },
    select: { id: true, store: { select: { id: true, name: true } } },
  });
}

// ── Product stats ─────────────────────────────────────────────────────────────

export async function getVendorProductStats(vendorId: string) {
  const [total, pending, active, rejected, lowStock] = await Promise.all([
    db.product.count({ where: { vendorId } }),
    db.product.count({ where: { vendorId, status: ProductStatus.PENDING_REVIEW } }),
    db.product.count({ where: { vendorId, status: ProductStatus.ACTIVE } }),
    db.product.count({ where: { vendorId, status: ProductStatus.REJECTED } }),
    db.product.count({ where: { vendorId, status: ProductStatus.ACTIVE, stock: { lte: 5 } } }),
  ]);
  return { total, pending, active, rejected, lowStock };
}
