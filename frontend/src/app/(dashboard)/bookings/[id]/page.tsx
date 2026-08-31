"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Circle } from "lucide-react";
import { api, BookingDetail } from "@/lib/api";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { formatCurrency, formatDate, formatRelativeTime } from "@/lib/utils";

export default function BookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.bookings.get(id)
      .then((res) => setBooking(res.data))
      .catch(() => setError("Booking not found"))
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

  if (error || !booking) {
    return (
      <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-8 text-center">
        <p className="text-sm text-red-400">{error ?? "Not found"}</p>
        <Link href="/bookings" className="mt-4 block text-xs text-sky-400 hover:underline">
          ← Back to bookings
        </Link>
      </div>
    );
  }

  const STATUS_ORDER = ["PENDING", "ASSIGNED", "MECHANIC_ON_THE_WAY", "COMPLETED"];
  const completedStatuses = booking.statusHistory.map((h) => h.newStatus);

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/bookings"
        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Bookings
      </Link>

      {/* Header */}
      <div className="glass-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-mono text-slate-500">#{booking.id}</p>
            <h2 className="mt-1 text-xl font-semibold text-slate-100">
              {booking.vehicleYear} {booking.vehicleMake} {booking.vehicleModel}
            </h2>
            <p className="text-sm text-slate-400">
              Plate: {booking.vehiclePlate} · {booking.service.name}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <StatusBadge status={booking.status} />
            <p className="text-2xl font-bold text-emerald-400">
              {formatCurrency(Number(booking.amount))}
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "Customer", value: booking.customer.name },
            { label: "Phone", value: booking.customer.phone },
            { label: "Mechanic", value: booking.mechanic?.name ?? "Unassigned" },
            { label: "Scheduled", value: formatDate(booking.scheduledAt) },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-xs text-slate-500">{label}</p>
              <p className="mt-0.5 text-sm font-medium text-slate-200">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Status history timeline */}
      <div className="glass-card p-6">
        <h3 className="mb-6 text-sm font-semibold text-slate-200">Status History</h3>

        {/* Progress bar */}
        {booking.status !== "CANCELLED" && (
          <div className="mb-8 flex items-center gap-0">
            {STATUS_ORDER.map((s, i) => {
              const done = completedStatuses.includes(s as any);
              const isCurrent = booking.status === s;
              return (
                <div key={s} className="flex flex-1 items-center">
                  <div className="flex flex-col items-center gap-1">
                    <div className={`flex h-7 w-7 items-center justify-center rounded-full border-2 transition-colors ${
                      done ? "border-sky-500 bg-sky-500/20" : "border-white/20 bg-transparent"
                    }`}>
                      {done
                        ? <CheckCircle2 className="h-4 w-4 text-sky-400" />
                        : <Circle className="h-4 w-4 text-slate-600" />
                      }
                    </div>
                    <span className={`text-xs ${done ? "text-sky-400" : "text-slate-600"}`}>
                      {s.replace(/_/g, " ")}
                    </span>
                  </div>
                  {i < STATUS_ORDER.length - 1 && (
                    <div className={`h-px flex-1 ${done ? "bg-sky-500/50" : "bg-white/10"}`} />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Timeline entries */}
        <div className="space-y-4">
          {booking.statusHistory.map((entry, i) => (
            <div key={entry.id} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="h-2.5 w-2.5 rounded-full bg-sky-500 flex-shrink-0 mt-1" />
                {i < booking.statusHistory.length - 1 && (
                  <div className="mt-1 w-px flex-1 bg-white/10" />
                )}
              </div>
              <div className="pb-4 flex-1">
                <div className="flex items-center gap-2">
                  <StatusBadge status={entry.newStatus} />
                  <span className="text-xs text-slate-500">
                    {formatRelativeTime(entry.changedAt)}
                  </span>
                </div>
                {entry.oldStatus && (
                  <p className="mt-1 text-xs text-slate-500">
                    From: {entry.oldStatus.replace(/_/g, " ")}
                  </p>
                )}
                {entry.note && (
                  <p className="mt-1 text-xs italic text-slate-400">{entry.note}</p>
                )}
                <p className="mt-0.5 text-xs text-slate-600">
                  {formatDate(entry.changedAt, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
