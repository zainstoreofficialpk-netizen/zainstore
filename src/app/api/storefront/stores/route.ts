import { NextRequest, NextResponse } from "next/server";
import { getAllStores, type GetStoresOptions } from "@/lib/storefront/store-data";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const opts: GetStoresOptions = {
      search: searchParams.get("search") ?? "",
      categorySlug: searchParams.get("category") ?? undefined,
      sort: (searchParams.get("sort") ?? "featured") as GetStoresOptions["sort"],
      page: Number(searchParams.get("page") ?? "1"),
      limit: Number(searchParams.get("limit") ?? "24"),
    };
    const result = await getAllStores(opts);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Failed to fetch stores" }, { status: 500 });
  }
}
