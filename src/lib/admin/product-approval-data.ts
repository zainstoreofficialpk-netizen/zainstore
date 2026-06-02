import { db } from "@/lib/db";
import { ProductStatus } from "@prisma/client";

export async function getProductsForApproval(filter: {
  status?: string;
  search?: string;
  page?: number;
}) {
  const { status = "PENDING_REVIEW", search = "", page = 1 } = filter;
  const LIMIT = 25;

  const where = {
    ...(status !== "ALL" ? { status: status as ProductStatus } : {}),
    ...(search.trim()
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { vendor: { store: { name: { contains: search, mode: "insensitive" as const } } } },
          ],
        }
      : {}),
  };

  const [products, total] = await Promise.all([
    db.product.findMany({
      where,
      skip: (page - 1) * LIMIT,
      take: LIMIT,
      orderBy: { updatedAt: "desc" },
      include: {
        images: { take: 1, orderBy: { sortOrder: "asc" } },
        category: { select: { name: true } },
        vendor: {
          include: {
            user: { select: { name: true, email: true } },
            store: { select: { name: true } },
          },
        },
        _count: { select: { variants: true } },
      },
    }),
    db.product.count({ where }),
  ]);

  return { products, total, page, totalPages: Math.ceil(total / LIMIT) };
}

export async function getAdminProductStats() {
  const [pending, active, rejected, total] = await Promise.all([
    db.product.count({ where: { status: ProductStatus.PENDING_REVIEW } }),
    db.product.count({ where: { status: ProductStatus.ACTIVE } }),
    db.product.count({ where: { status: ProductStatus.REJECTED } }),
    db.product.count(),
  ]);
  return { pending, active, rejected, total };
}
