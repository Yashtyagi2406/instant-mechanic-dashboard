"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Wrench, CheckCircle2 } from "lucide-react";
import { api, Mechanic } from "@/lib/api";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";

const FILTER_LABELS: Record<string, string> = {
  "": "All",
  AVAILABLE: "Available",
  BUSY: "Busy",
  OFF_DUTY: "Off Duty",
};

export default function MechanicsPage() {
  const [mechanics, setMechanics] = useState<Mechanic[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    api.mechanics.list()
      .then((res) => setMechanics(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter
    ? mechanics.filter((m) => m.status === filter)
    : mechanics;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-100">Mechanics</h2>
          <p className="text-sm text-slate-400">{mechanics.length} mechanics on the team</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {["", "AVAILABLE", "BUSY", "OFF_DUTY"].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={cn(
                "rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all duration-150",
                filter === s
                  ? "bg-sky-500 text-white font-semibold shadow-md shadow-sky-500/20"
                  : "border border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200"
              )}
            >
              {FILTER_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-500">
          <Wrench className="mb-3 h-10 w-10 opacity-40" />
          <p className="text-sm">No mechanics found for this filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((mechanic) => {
            const lastBooking = mechanic.bookings[0];
            return (
              <Link
                key={mechanic.id}
                href={`/mechanics/${mechanic.id}`}
                className="glass-card flex flex-col justify-between p-5 transition-all duration-200 hover:border-sky-500/40 hover:bg-white/[0.07] hover:shadow-lg hover:shadow-sky-500/10 group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-500/20 text-sm font-bold text-sky-400 group-hover:bg-sky-500/30 transition-colors">
                        {mechanic.name.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-slate-200 truncate group-hover:text-sky-300 transition-colors">
                          {mechanic.name}
                        </p>
                        <p className="text-xs text-slate-400 truncate mt-0.5" title={mechanic.email}>
                          {mechanic.email}
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={mechanic.status} type="mechanic" className="shrink-0" />
                  </div>

                  <div className="mt-4 flex items-center gap-2 text-xs text-slate-300">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span><strong className="font-semibold text-slate-100">{mechanic.jobsCompleted}</strong> jobs completed</span>
                  </div>
                </div>

                {lastBooking && (
                  <div className="mt-4 rounded-lg border border-white/5 bg-white/5 p-3">
                    <p className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">Last / Current Job</p>
                    <p className="truncate text-xs font-semibold text-slate-200 mt-1">
                      {lastBooking.vehicleMake} {lastBooking.vehicleModel}
                    </p>
                    <p className="truncate text-xs text-sky-400 font-medium">
                      {lastBooking.service.name}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5 truncate">Customer: {lastBooking.customer.name}</p>
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
