"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Wrench, CheckCircle2 } from "lucide-react";
import { api, Mechanic } from "@/lib/api";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";

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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-100">Mechanics</h2>
          <p className="text-sm text-slate-400">{mechanics.length} mechanics on the team</p>
        </div>
        <div className="flex gap-2">
          {["", "AVAILABLE", "BUSY", "OFF_DUTY"].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                filter === s
                  ? "bg-sky-500/20 text-sky-400"
                  : "text-slate-500 hover:text-slate-300"
              )}
            >
              {s || "All"}
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
                className="glass-card p-5 transition-all duration-150 hover:border-sky-500/30 hover:shadow-lg hover:shadow-sky-500/5"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/20 text-sm font-bold text-sky-400">
                      {mechanic.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-200">{mechanic.name}</p>
                      <p className="text-xs text-slate-500">{mechanic.email}</p>
                    </div>
                  </div>
                  <StatusBadge status={mechanic.status} type="mechanic" />
                </div>

                <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  <span>{mechanic.jobsCompleted} jobs completed</span>
                </div>

                {lastBooking && (
                  <div className="mt-3 rounded-lg bg-white/5 px-3 py-2">
                    <p className="text-xs text-slate-500">Last / Current:</p>
                    <p className="truncate text-xs font-medium text-slate-300">
                      {lastBooking.vehicleMake} {lastBooking.vehicleModel} — {lastBooking.service.name}
                    </p>
                    <p className="text-xs text-slate-500">{lastBooking.customer.name}</p>
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
