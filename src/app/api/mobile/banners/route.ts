import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const now = new Date();
    const banners = await db.banner.findMany({
      where: {
        placement: "slider",
        active: true,
        OR: [{ startsAt: null }, { startsAt: { lte: now } }],
        AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }],
      },
      select: { id: true, title: true, imageUrl: true, linkUrl: true },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json({ banners });
  } catch (e) {
    console.error("[mobile/banners]", e);
    return NextResponse.json({ banners: [] });
  }
}
