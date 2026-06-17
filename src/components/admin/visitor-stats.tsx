"use client";

import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Users, Wifi, TrendingUp, Calendar, BarChart2, Globe } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type VisitorStats = {
  online: number;
  today: number;
  yesterday: number;
  lastWeek: number;
  lastMonth: number;
  hourlyData: { hour: string; visitors: number }[];
  topPages: { path: string; visits: number }[];
};

export function VisitorStats({ stats }: { stats: VisitorStats }) {
  const [liveOnline, setLiveOnline] = useState(stats.online);

  // Refresh online count every 30 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/admin/visitor-online");
        if (res.ok) {
          const data = await res.json();
          setLiveOnline(data.online ?? stats.online);
        }
      } catch { /* silent */ }
    }, 30_000);
    return () => clearInterval(interval);
  }, [stats.online]);

  const cards = [
    { label: "Online Now", value: liveOnline, icon: Wifi, color: "text-emerald-600", bg: "bg-emerald-50", pulse: true },
    { label: "Today", value: stats.today, icon: TrendingUp, color: "text-brand-600", bg: "bg-brand-50", pulse: false },
    { label: "Yesterday", value: stats.yesterday, icon: Calendar, color: "text-blue-600", bg: "bg-blue-50", pulse: false },
    { label: "Last 7 Days", value: stats.lastWeek, icon: BarChart2, color: "text-violet-600", bg: "bg-violet-50", pulse: false },
    { label: "Last 30 Days", value: stats.lastMonth, icon: Users, color: "text-zinc-600", bg: "bg-zinc-100", pulse: false },
  ];

  return (
    <div className="space-y-5">
      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {cards.map(({ label, value, icon: Icon, color, bg, pulse }) => (
          <Card key={label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center shrink-0 relative`}>
                <Icon className={`w-4 h-4 ${color}`} />
                {pulse && value > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white animate-pulse" />
                )}
              </div>
              <div>
                <p className="text-xs text-zinc-500">{label}</p>
                <p className="text-lg font-black text-zinc-900">{value.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Hourly chart */}
        <Card>
          <CardHeader><CardTitle>Today&apos;s Visitors by Hour</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={stats.hourlyData} margin={{ top: 0, right: 4, left: -20, bottom: 0 }}>
                <XAxis
                  dataKey="hour"
                  tick={{ fontSize: 10, fill: "#a1a1aa" }}
                  tickLine={false}
                  axisLine={false}
                  interval={3}
                />
                <Tooltip
                  formatter={(v) => [`${v} visitors`, ""]}
                  contentStyle={{ fontSize: 11, borderRadius: 6, border: "1px solid #e4e4e7" }}
                  labelStyle={{ color: "#3f3f46", fontWeight: 600 }}
                  cursor={{ fill: "#f4f4f5" }}
                />
                <Bar dataKey="visitors" fill="#faa42d" radius={[3, 3, 0, 0]} maxBarSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top pages */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Globe className="w-4 h-4" /> Top Pages Today</CardTitle></CardHeader>
          <CardContent className="p-0">
            {stats.topPages.length === 0 ? (
              <p className="px-4 py-8 text-sm text-zinc-400 text-center">No page visits yet today</p>
            ) : (
              <div className="divide-y divide-zinc-50">
                {stats.topPages.map((p, i) => {
                  const maxVisits = stats.topPages[0]?.visits ?? 1;
                  const pct = Math.round((p.visits / maxVisits) * 100);
                  return (
                    <div key={p.path} className="px-4 py-2.5 flex items-center gap-3">
                      <span className="text-xs font-bold text-zinc-400 w-4">#{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-zinc-700 truncate">{p.path}</p>
                        <div className="mt-1 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                          <div className="h-full bg-brand-400 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-zinc-500 shrink-0">{p.visits}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
