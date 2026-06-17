import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getStoreReviews } from "@/lib/storefront/store-data";

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const store = await db.store.findUnique({
      where: { slug: params.slug },
      select: { id: true },
    });
    if (!store) return NextResponse.json({ error: "Store not found" }, { status: 404 });

    const page = Number(req.nextUrl.searchParams.get("page") ?? "1");
    const result = await getStoreReviews(store.id, page);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
  }
}
