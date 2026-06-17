"use client";

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

interface ChartPoint {
  date: string;
  revenue: number;
}

export function VendorSalesChart({ data }: { data: ChartPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 4, right: 4, left: 8, bottom: 0 }}>
        <defs>
          <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#faa42d" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#faa42d" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: "#a1a1aa" }}
          tickLine={false}
          axisLine={false}
          interval={4}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "#a1a1aa" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={v => `PKR ${(v / 1000).toFixed(0)}k`}
        />
        <Tooltip
          formatter={(value) => [`PKR ${Number(value ?? 0).toLocaleString()}`, "Revenue"]}
          contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e4e4e7" }}
          labelStyle={{ color: "#3f3f46", fontWeight: 600 }}
        />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="#faa42d"
          strokeWidth={2}
          fill="url(#revGrad)"
          dot={false}
          activeDot={{ r: 4, fill: "#faa42d" }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
