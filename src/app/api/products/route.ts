import { ProductStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";

const createProductSchema = z.object({
  vendorId: z.string().min(1),
  categoryId: z.string().optional(),
  name: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().min(10),
  price: z.coerce.number().positive(),
  compareAt: z.coerce.number().positive().optional(),
  stock: z.coerce.number().int().min(0).default(0),
});

export async function GET() {
  const products = await db.product.findMany({
    where: { status: ProductStatus.ACTIVE },
    include: {
      vendor: true,
      category: true,
      images: { orderBy: { sortOrder: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ products });
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = createProductSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid product payload", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const product = await db.product.create({
    data: {
      ...parsed.data,
      price: parsed.data.price.toString(),
      compareAt: parsed.data.compareAt?.toString(),
      status: ProductStatus.DRAFT,
    },
  });

  return NextResponse.json({ product }, { status: 201 });
}
