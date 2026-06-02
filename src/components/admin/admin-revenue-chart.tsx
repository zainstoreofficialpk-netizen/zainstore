"use client";

import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Period = "daily" | "weekly" | "monthly" | "yearly";
type DataPoint = { label: string; revenue: number; orders: number };

const PERIODS: { key: Period; label: string }[] = [
  { key: "daily", label: "Daily" },
  { key: "weekly", label: "Weekly" },
  { key: "monthly", label: "Monthly" },
  { key: "yearly", label: "Yearly" },
];

export function AdminRevenueChart() {
  const [period, setPeriod] = useState<Period>("monthly");
  const [data, setData] = useState<DataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/revenue-chart?period=${period}`)
      .then((r) => r.json())
      .then((json) => {
        setData(json.data ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [period]);

  const totalRevenue = data.reduce((s, d) => s + d.revenue, 0);
  const totalOrders = data.reduce((s, d) => s + d.orders, 0);

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>Revenue Analytics</CardTitle>
            <p className="mt-1 text-sm text-zinc-400">
              {loading
                ? "Loading…"
                : `PKR ${totalRevenue.toLocaleString("en-PK")} · ${totalOrders.toLocaleString()} orders`}
            </p>
          </div>
          {/* Period toggle */}
          <div className="flex gap-1 rounded-lg border border-zinc-200 p-0.5">
            {PERIODS.map((p) => (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  period === p.key
                    ? "bg-brand-500 text-white"
                    : "text-zinc-500 hover:bg-zinc-100"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="h-72">
          {loading ? (
            <div className="flex h-full items-center justify-center text-sm text-zinc-400">
              Loading chart…
            </div>
          ) : data.every((d) => d.revenue === 0) ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-zinc-400">
              <span className="text-4xl">📊</span>
              <p className="text-sm">No revenue data yet for this period.</p>
              <p className="text-xs text-zinc-300">Create some orders to see data here.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="brandGrad" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="#faa42d" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#faa42d" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#f4f4f5" strokeDasharray="4 4" vertical={false} />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "#a1a1aa" }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={58}
                  tick={{ fontSize: 11, fill: "#a1a1aa" }}
                  tickFormatter={(v) =>
                    v >= 1_000_000
                      ? `${(v / 1_000_000).toFixed(1)}M`
                      : v >= 1000
                        ? `${(v / 1000).toFixed(0)}K`
                        : String(v)
                  }
                />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: "1px solid #e4e4e7", fontSize: 12 }}
                  formatter={(value, name) => [
                    name === "revenue"
                      ? `PKR ${Number(value).toLocaleString("en-PK")}`
                      : value,
                    name === "revenue" ? "Revenue" : "Orders",
                  ]}
                />
                <Area
                  dataKey="revenue"
                  type="monotone"
                  stroke="#faa42d"
                  strokeWidth={2.5}
                  fill="url(#brandGrad)"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
