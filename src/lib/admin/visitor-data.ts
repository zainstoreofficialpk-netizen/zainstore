import { db } from "@/lib/db";

export async function getVisitorStats() {
  const now = new Date();

  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);

  const startOfWeek = new Date(now);
  startOfWeek.setDate(startOfWeek.getDate() - 7);

  const startOfMonth = new Date(now);
  startOfMonth.setDate(startOfMonth.getDate() - 30);

  const onlineThreshold = new Date(now.getTime() - 5 * 60 * 1000); // 5 minutes

  const [onlineRaw, todayRaw, yesterdayRaw, weekRaw, monthRaw, hourlyRaw] = await Promise.all([
    // Unique sessions in last 5 min = "online"
    db.pageVisit.findMany({
      where: { createdAt: { gte: onlineThreshold } },
      select: { sessionId: true },
      distinct: ["sessionId"],
    }),
    // Today unique sessions
    db.pageVisit.findMany({
      where: { createdAt: { gte: startOfToday } },
      select: { sessionId: true },
      distinct: ["sessionId"],
    }),
    // Yesterday unique sessions
    db.pageVisit.findMany({
      where: { createdAt: { gte: startOfYesterday, lt: startOfToday } },
      select: { sessionId: true },
      distinct: ["sessionId"],
    }),
    // Last 7 days unique sessions
    db.pageVisit.findMany({
      where: { createdAt: { gte: startOfWeek } },
      select: { sessionId: true },
      distinct: ["sessionId"],
    }),
    // Last 30 days unique sessions
    db.pageVisit.findMany({
      where: { createdAt: { gte: startOfMonth } },
      select: { sessionId: true },
      distinct: ["sessionId"],
    }),
    // Hourly breakdown for today (for mini chart)
    db.pageVisit.findMany({
      where: { createdAt: { gte: startOfToday } },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  // Build hourly breakdown
  const hourlyMap: Record<number, number> = {};
  for (let h = 0; h < 24; h++) hourlyMap[h] = 0;
  for (const v of hourlyRaw) {
    const hour = v.createdAt.getHours();
    hourlyMap[hour]++;
  }
  const hourlyData = Object.entries(hourlyMap).map(([hour, count]) => ({
    hour: `${hour.padStart(2, "0")}:00`,
    visitors: count,
  }));

  // Top pages today
  const topPages = await db.pageVisit.groupBy({
    by: ["path"],
    _count: { id: true },
    where: { createdAt: { gte: startOfToday } },
    orderBy: { _count: { id: "desc" } },
    take: 10,
  });

  return {
    online: onlineRaw.length,
    today: todayRaw.length,
    yesterday: yesterdayRaw.length,
    lastWeek: weekRaw.length,
    lastMonth: monthRaw.length,
    hourlyData,
    topPages: topPages.map(p => ({ path: p.path, visits: p._count.id })),
  };
}
