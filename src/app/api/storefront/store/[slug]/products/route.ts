import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getStoreProducts, type GetStoreProductsOptions } from "@/lib/storefront/store-data";

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const store = await db.store.findUnique({
      where: { slug: params.slug },
      select: { id: true },
    });
    if (!store) return NextResponse.json({ error: "Store not found" }, { status: 404 });

    const { searchParams } = req.nextUrl;
    const opts: GetStoreProductsOptions = {
      storeId: store.id,
      categoryId: searchParams.get("categoryId") ?? undefined,
      search: searchParams.get("search") ?? undefined,
      sort: (searchParams.get("sort") ?? "newest") as GetStoreProductsOptions["sort"],
      minPrice: searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : undefined,
      maxPrice: searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined,
      minRating: searchParams.get("minRating") ? Number(searchParams.get("minRating")) : undefined,
      page: Number(searchParams.get("page") ?? "1"),
      limit: Number(searchParams.get("limit") ?? "24"),
    };

    const result = await getStoreProducts(opts);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}
