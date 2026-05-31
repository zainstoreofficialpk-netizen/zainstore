import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { ProductStatus } from "@prisma/client";
import { z } from "zod";

import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";

const createProductSchema = z.object({
  vendorId: z.string().min(1),
  storeId: z.string().min(1),
  categoryId: z.string().optional(),
  brandId: z.string().optional(),
  name: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  sku: z.string().optional(),
  description: z.string().min(10),
  price: z.coerce.number().positive(),
  salePrice: z.coerce.number().positive().optional(),
  stock: z.coerce.number().int().min(0).default(0),
});

export async function GET() {
  const products = await db.product.findMany({
    where: { status: ProductStatus.ACTIVE },
    include: {
      vendor: true,
      store: true,
      category: true,
      brand: true,
      images: { orderBy: { sortOrder: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ products });
}

export async function POST(request: Request) {
  // ── Auth guard ──────────────────────────────────────────────────────────────
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  if (session.user.role !== "VENDOR" && session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Only vendors and admins can create products." }, { status: 403 });
  }

  // ── Validate payload ────────────────────────────────────────────────────────
  const body = await request.json();
  const parsed = createProductSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid product payload", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  // ── Ownership check (vendor can only create under their own store) ──────────
  if (session.user.role === "VENDOR") {
    const vendorProfile = await db.vendorProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true, store: { select: { id: true } } },
    });

    if (!vendorProfile) {
      return NextResponse.json({ error: "Vendor profile not found." }, { status: 403 });
    }

    if (parsed.data.vendorId !== vendorProfile.id) {
      return NextResponse.json({ error: "Cannot create products for another vendor." }, { status: 403 });
    }

    if (parsed.data.storeId !== vendorProfile.store?.id) {
      return NextResponse.json({ error: "Cannot create products in another vendor's store." }, { status: 403 });
    }
  }

  // ── Create ──────────────────────────────────────────────────────────────────
  const product = await db.product.create({
    data: {
      ...parsed.data,
      price: parsed.data.price.toString(),
      salePrice: parsed.data.salePrice?.toString(),
      status: ProductStatus.DRAFT,
    },
  });

  return NextResponse.json({ product }, { status: 201 });
}
