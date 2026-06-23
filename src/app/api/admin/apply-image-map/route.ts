import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import data from "../../../../../scripts/cloudinary-image-map.json";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let updated = 0;
  let skipped = 0;

  for (const img of data as { id: string; url: string }[]) {
    try {
      await db.productImage.update({
        where: { id: img.id },
        data: { url: img.url },
      });
      updated++;
    } catch {
      skipped++;
    }
  }

  return NextResponse.json({ updated, skipped, total: data.length });
}
