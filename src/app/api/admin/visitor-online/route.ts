import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const threshold = new Date(Date.now() - 5 * 60 * 1000);
  const rows = await db.pageVisit.findMany({
    where: { createdAt: { gte: threshold } },
    select: { sessionId: true },
    distinct: ["sessionId"],
  });

  return NextResponse.json({ online: rows.length });
}
