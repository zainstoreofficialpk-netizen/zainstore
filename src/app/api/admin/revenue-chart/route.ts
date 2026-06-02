import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth/config";
import { getRevenueChartData, type RevenuePeriod } from "@/lib/admin/dashboard-data";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const period = (searchParams.get("period") ?? "monthly") as RevenuePeriod;

  if (!["daily", "weekly", "monthly", "yearly"].includes(period)) {
    return NextResponse.json({ error: "Invalid period" }, { status: 400 });
  }

  const data = await getRevenueChartData(period);
  return NextResponse.json({ data });
}
