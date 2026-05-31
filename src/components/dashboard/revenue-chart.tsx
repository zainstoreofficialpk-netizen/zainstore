"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { revenueSeries } from "@/lib/dashboard/sample-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function RevenueChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue Analytics</CardTitle>
        <p className="mt-1 text-sm text-zinc-400">Monthly marketplace gross revenue</p>
      </CardHeader>
      <CardContent>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueSeries} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
              <defs>
                <linearGradient id="brandGrad" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="5%"  stopColor="#faa42d" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#faa42d" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="accentGrad" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="5%"  stopColor="#f1672e" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#f1672e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#f4f4f5" strokeDasharray="4 4" vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#a1a1aa" }} />
              <YAxis tickLine={false} axisLine={false} width={52} tick={{ fontSize: 12, fill: "#a1a1aa" }} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: "1px solid #e4e4e7", fontSize: 12 }}
                formatter={(value) => [`PKR ${Number(value).toLocaleString("en-PK")}`, "Revenue"]}
              />
              <Area dataKey="revenue" type="monotone" stroke="#faa42d" strokeWidth={2.5} fill="url(#brandGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
