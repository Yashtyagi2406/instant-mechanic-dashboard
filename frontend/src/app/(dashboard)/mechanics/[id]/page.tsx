"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { api, MechanicDetail } from "@/lib/api";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function MechanicDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [mechanic, setMechanic] = useState<MechanicDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.mechanics.get(id)
      .then((res) => setMechanic(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-4">
        <CardSkeleton className="h-40" />
        <CardSkeleton className="h-64" />
      </div>
    );
  }

  if (!mechanic) {
    return (
      <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-8 text-center">
        <p className="text-sm text-red-400">Mechanic not found.</p>
        <Link href="/mechanics" className="mt-4 block text-xs text-sky-400 hover:underline">
          ← Back to mechanics
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link href="/mechanics" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200">
        <ArrowLeft className="h-4 w-4" />
        Back to Mechanics
      </Link>

      {/* Profile card */}
      <div className="glass-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-500/20 text-2xl font-bold text-sky-400">
              {mechanic.name.charAt(0)}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-100">{mechanic.name}</h2>
              <p className="text-sm text-slate-400">{mechanic.email}</p>
              <p className="text-sm text-slate-400">{mechanic.phone}</p>
            </div>
          </div>
          <StatusBadge status={mechanic.status} type="mechanic" className="text-sm px-4 py-1.5" />
        </div>

        <div className="mt-6 flex items-center gap-2 text-sm text-emerald-400">
          <CheckCircle2 className="h-4 w-4" />
          <span className="font-semibold">{mechanic.jobsCompleted}</span>
          <span className="text-slate-400">jobs completed</span>
        </div>
      </div>

      {/* Recent bookings */}
      <div className="glass-card overflow-hidden">
        <div className="border-b border-white/10 px-6 py-4">
          <h3 className="text-sm font-semibold text-slate-200">Recent Bookings</h3>
        </div>
        <div className="divide-y divide-white/5">
          {mechanic.bookings.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-slate-500">No bookings yet.</p>
          ) : (
            mechanic.bookings.map((booking) => (
              <Link
                key={booking.id}
                href={`/bookings/${booking.id}`}
                className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-white/3"
              >
                <div>
                  <p className="text-sm font-medium text-slate-200">
                    {booking.vehicleMake} {booking.vehicleModel}
                  </p>
                  <p className="text-xs text-slate-500">
                    {booking.service.name} · {booking.customer.name}
                  </p>
                </div>
                <StatusBadge status={booking.status} />
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
