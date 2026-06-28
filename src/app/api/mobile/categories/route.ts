import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const categories = await db.category.findMany({
      where: { parentId: null },
      select: {
        id: true,
        name: true,
        slug: true,
        imageUrl: true,
        _count: { select: { products: { where: { status: "ACTIVE" } } } },
      },
      orderBy: { name: "asc" },
      take: 20,
    });

    return NextResponse.json({ categories });
  } catch (e) {
    console.error("[mobile/categories]", e);
    return NextResponse.json({ error: "Failed to fetch categories." }, { status: 500 });
  }
}
