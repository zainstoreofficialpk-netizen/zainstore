import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const categories = await db.category.findMany({
    where: { parentId: null },
    include: {
      children: {
        select: { id: true, name: true, slug: true },
        take: 12,
        orderBy: { name: "asc" },
      },
    },
    take: 12,
    orderBy: { name: "asc" },
  });
  return NextResponse.json(categories);
}
