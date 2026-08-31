"use client";

import { useEffect, useState, useRef } from "react";
import {
  Calendar, CheckCircle2, Clock, XCircle, DollarSign,
  Wrench, Users, TrendingUp, ArrowUpRight
} from "lucide-react";
import { api, DashboardStats } from "@/lib/api";
import { useSocket } from "@/contexts/SocketContext";
import { KpiCardSkeleton } from "@/components/ui/Skeleton";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

// ── KPI Card ──────────────────────────────────────────────────────────────────

interface KpiCardProps {
  title: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  iconBg: string;
  highlight?: boolean;
}

function KpiCard({ title, value, sub, icon, iconBg, highlight }: KpiCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (highlight && cardRef.current) {
      cardRef.current.classList.add("live-highlight");
      const t = setTimeout(() => cardRef.current?.classList.remove("live-highlight"), 1100);
      return () => clearTimeout(t);
    }
  }, [highlight, value]);

  return (
    <div
      ref={cardRef}
      className="glass-card p-5 transition-shadow duration-300 hover:shadow-lg hover:shadow-sky-500/5"
    >
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-slate-400">{title}</p>
        <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl", iconBg)}>
          {icon}
        </div>
      </div>
      <p className="mt-3 text-3xl font-bold tracking-tight text-slate-100 count-animate">
        {value}
      </p>
      {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
    </div>
  );
}

// ── Overview Page ──────────────────────────────────────────────────────────────

export default function OverviewPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [highlightedKeys, setHighlightedKeys] = useState<Set<string>>(new Set());
  const { socket } = useSocket();

  const prevStatsRef = useRef<DashboardStats | null>(null);

  async function fetchStats() {
    try {
      setError(null);
      const res = await api.dashboard.stats();
      setStats(res.data);
    } catch (e) {
      setError("Failed to load dashboard stats. Check your API connection.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchStats();
  }, []);

  // Subscribe to live Socket.io dashboard updates
  useEffect(() => {
    if (!socket) return;

    socket.on("dashboard:stats-updated", (newStats: DashboardStats) => {
      // Compute which keys changed so we can flash them
      if (prevStatsRef.current) {
        const changed = new Set<string>();
        (Object.keys(newStats) as (keyof DashboardStats)[]).forEach((k) => {
          if (JSON.stringify(newStats[k]) !== JSON.stringify(prevStatsRef.current![k])) {
            changed.add(k as string);
          }
        });
        setHighlightedKeys(changed);
        setTimeout(() => setHighlightedKeys(new Set()), 1200);
      }
      prevStatsRef.current = newStats;
      setStats(newStats);
    });

    return () => {
      socket.off("dashboard:stats-updated");
    };
  }, [socket]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <KpiCardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-red-500/20 bg-red-500/5 p-12 text-center">
        <XCircle className="mb-3 h-10 w-10 text-red-400" />
        <p className="text-sm text-red-400">{error}</p>
        <button
          onClick={fetchStats}
          className="mt-4 rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400 transition-colors hover:bg-red-500/20"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!stats) return null;

  const cards: KpiCardProps[] = [
    {
      title: "Total Bookings",
      value: stats.totalBookings.toLocaleString(),
      icon: <Calendar className="h-4 w-4 text-sky-400" />,
      iconBg: "bg-sky-500/15",
      highlight: highlightedKeys.has("totalBookings"),
    },
    {
      title: "Today's Bookings",
      value: stats.todaysBookings,
      sub: "Scheduled for today",
      icon: <TrendingUp className="h-4 w-4 text-violet-400" />,
      iconBg: "bg-violet-500/15",
      highlight: highlightedKeys.has("todaysBookings"),
    },
    {
      title: "Completed",
      value: stats.completedBookings.toLocaleString(),
      icon: <CheckCircle2 className="h-4 w-4 text-emerald-400" />,
      iconBg: "bg-emerald-500/15",
      highlight: highlightedKeys.has("completedBookings"),
    },
    {
      title: "Pending",
      value: stats.pendingBookings,
      icon: <Clock className="h-4 w-4 text-amber-400" />,
      iconBg: "bg-amber-500/15",
      highlight: highlightedKeys.has("pendingBookings"),
    },
    {
      title: "Cancelled",
      value: stats.cancelledBookings,
      icon: <XCircle className="h-4 w-4 text-red-400" />,
      iconBg: "bg-red-500/15",
      highlight: highlightedKeys.has("cancelledBookings"),
    },
    {
      title: "Total Revenue",
      value: formatCurrency(stats.totalRevenue),
      sub: "From completed bookings",
      icon: <DollarSign className="h-4 w-4 text-emerald-400" />,
      iconBg: "bg-emerald-500/15",
      highlight: highlightedKeys.has("totalRevenue"),
    },
    {
      title: "Active Mechanics",
      value: stats.activeMechanics,
      sub: "Available + busy",
      icon: <Wrench className="h-4 w-4 text-sky-400" />,
      iconBg: "bg-sky-500/15",
      highlight: highlightedKeys.has("activeMechanics"),
    },
    {
      title: "New Customers",
      value: stats.newCustomers.last30Days,
      sub: "Past 30 days",
      icon: <Users className="h-4 w-4 text-purple-400" />,
      iconBg: "bg-purple-500/15",
      highlight: highlightedKeys.has("newCustomers"),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-100">Overview</h2>
          <p className="text-sm text-slate-400">Live operational metrics — updates automatically</p>
        </div>
        <a
          href="/analytics"
          className="flex items-center gap-1 rounded-lg bg-sky-500/10 px-3 py-1.5 text-xs font-medium text-sky-400 transition-colors hover:bg-sky-500/20"
        >
          View analytics <ArrowUpRight className="h-3 w-3" />
        </a>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <KpiCard key={card.title} {...card} />
        ))}
      </div>

      {/* Status pipeline summary */}
      <div className="glass-card p-5">
        <h3 className="mb-4 text-sm font-semibold text-slate-300">Active Pipeline</h3>
        <div className="flex items-center gap-3">
          {[
            { label: "Pending", value: stats.pendingBookings, color: "bg-amber-500" },
            { label: "Assigned", value: stats.assignedBookings, color: "bg-blue-500" },
            { label: "On The Way", value: stats.onTheWayBookings, color: "bg-purple-500" },
          ].map((step, i) => (
            <div key={step.label} className="flex flex-1 items-center gap-2">
              {i > 0 && <div className="h-px flex-1 bg-white/10" />}
              <div className="flex flex-col items-center gap-1">
                <div className={cn("h-2 w-2 rounded-full", step.color)} />
                <span className="text-lg font-bold text-slate-100">{step.value}</span>
                <span className="text-xs text-slate-500">{step.label}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
