import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const stores = await db.store.findMany({
      where: { vendor: { status: "ACTIVE" } },
      select: {
        id: true,
        name: true,
        slug: true,
        logoUrl: true,
        description: true,
        _count: {
          select: { products: { where: { status: "ACTIVE" } } },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ stores });
  } catch (e) {
    console.error("[mobile/stores]", e);
    return NextResponse.json({ error: "Failed to fetch stores." }, { status: 500 });
  }
}
