"use client";

import { useEffect, useState } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { api } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ChartSkeleton } from "@/components/ui/Skeleton";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "#f59e0b",
  ASSIGNED: "#3b82f6",
  MECHANIC_ON_THE_WAY: "#a855f7",
  COMPLETED: "#10b981",
  CANCELLED: "#ef4444",
};

const CATEGORY_COLORS = ["#0ea5e9", "#10b981", "#a855f7", "#f59e0b", "#ef4444", "#06b6d4"];

const TOOLTIP_STYLE = {
  backgroundColor: "#0f172a",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "8px",
  color: "#e2e8f0",
  fontSize: "12px",
};

function SectionHeader({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="mb-4">
      <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
      <p className="text-xs text-slate-500">{sub}</p>
    </div>
  );
}

export default function AnalyticsPage() {
  const [days, setDays] = useState(30);
  const [bookingsData, setBookingsData] = useState<Array<{ date: string; bookings: number }> | null>(null);
  const [revenueData, setRevenueData] = useState<Array<{ date: string; revenue: number }> | null>(null);
  const [statusData, setStatusData] = useState<Array<{ status: string; count: number }> | null>(null);
  const [categoryData, setCategoryData] = useState<Array<{ category: string; count: number; revenue: number }> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.analytics.bookingsOverTime(days),
      api.analytics.revenueOverTime(days),
      api.analytics.statusBreakdown(),
      api.analytics.categoryBreakdown(),
    ]).then(([b, r, s, c]) => {
      setBookingsData(b.data);
      setRevenueData(r.data);
      setStatusData(s.data);
      setCategoryData(c.data);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, [days]);

  const dateFormatter = (d: string) =>
    formatDate(d, { month: "short", day: "numeric" });

  return (
    <div className="space-y-6">
      {/* Header + day selector */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-100">Analytics</h2>
          <p className="text-sm text-slate-400">Historical performance metrics</p>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 p-1">
          {[7, 30, 60, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                days === d
                  ? "bg-sky-500 text-white shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* Bookings over time */}
      <div className="glass-card p-6">
        <SectionHeader title="Bookings Over Time" sub={`Last ${days} days`} />
        {loading ? (
          <ChartSkeleton />
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={bookingsData ?? []}>
              <defs>
                <linearGradient id="bookingsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="date"
                tickFormatter={dateFormatter}
                tick={{ fill: "#64748b", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Area type="monotone" dataKey="bookings" stroke="#0ea5e9" fill="url(#bookingsGrad)" strokeWidth={2} name="Bookings" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Revenue over time */}
      <div className="glass-card p-6">
        <SectionHeader title="Revenue Over Time" sub="From completed bookings" />
        {loading ? (
          <ChartSkeleton />
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={revenueData ?? []}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="date"
                tickFormatter={dateFormatter}
                tick={{ fill: "#64748b", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
                tick={{ fill: "#64748b", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                formatter={(value: unknown) => [formatCurrency(Number(value ?? 0)), "Revenue"]}
              />
              <Area type="monotone" dataKey="revenue" stroke="#10b981" fill="url(#revenueGrad)" strokeWidth={2} name="Revenue" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Status breakdown (donut) */}
        <div className="glass-card p-6">
          <SectionHeader title="Status Breakdown" sub="All-time distribution" />
          {loading ? (
            <ChartSkeleton height="h-52" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={statusData ?? []}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                >
                  {(statusData ?? []).map((entry) => (
                    <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? "#64748b"} />
                  ))}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend
                  formatter={(val: unknown) => (
                    <span className="text-xs text-slate-400">
                      {String(val).replace(/_/g, " ")}
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Category breakdown (bar) */}
        <div className="glass-card p-6">
          <SectionHeader title="Category Breakdown" sub="Bookings per service category" />
          {loading ? (
            <ChartSkeleton height="h-52" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={categoryData ?? []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                <XAxis type="number" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis
                  dataKey="category"
                  type="category"
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={100}
                />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} name="Bookings">
                  {(categoryData ?? []).map((_, i) => (
                    <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
