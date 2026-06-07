import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const placement = req.nextUrl.searchParams.get("placement") ?? "slider";
  const now = new Date();

  const banners = await db.banner.findMany({
    where: {
      placement,
      active: true,
      OR: [{ startsAt: null }, { startsAt: { lte: now } }],
      AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }],
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(banners);
}
