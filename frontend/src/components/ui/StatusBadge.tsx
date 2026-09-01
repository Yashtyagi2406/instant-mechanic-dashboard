/**
 * Status badge component — color-codes booking and mechanic statuses with high visibility and contrast.
 */
import { cn } from "@/lib/utils";

type BookingStatus = "PENDING" | "ASSIGNED" | "MECHANIC_ON_THE_WAY" | "COMPLETED" | "CANCELLED";
type MechanicStatus = "AVAILABLE" | "BUSY" | "OFF_DUTY";

const BOOKING_STATUS_CONFIG: Record<
  BookingStatus,
  { label: string; className: string; dotClass?: string }
> = {
  PENDING: {
    label: "Pending",
    className: "bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm shadow-amber-500/10",
    dotClass: "bg-amber-400",
  },
  ASSIGNED: {
    label: "Assigned",
    className: "bg-blue-500/20 text-blue-300 border-blue-500/40 shadow-sm shadow-blue-500/10",
    dotClass: "bg-blue-400",
  },
  MECHANIC_ON_THE_WAY: {
    label: "On The Way",
    className: "bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-sm shadow-purple-500/10",
    dotClass: "bg-purple-400",
  },
  COMPLETED: {
    label: "Completed",
    className: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm shadow-emerald-500/10",
    dotClass: "bg-emerald-400",
  },
  CANCELLED: {
    label: "Cancelled",
    className: "bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-sm shadow-rose-500/10",
    dotClass: "bg-rose-400",
  },
};

const MECHANIC_STATUS_CONFIG: Record<
  MechanicStatus,
  { label: string; className: string; dotClass: string }
> = {
  AVAILABLE: {
    label: "Available",
    className: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm shadow-emerald-500/10",
    dotClass: "bg-emerald-400",
  },
  BUSY: {
    label: "Busy",
    className: "bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm shadow-amber-500/10",
    dotClass: "bg-amber-400",
  },
  OFF_DUTY: {
    label: "Off Duty",
    className: "bg-slate-700/50 text-slate-300 border-slate-600/50 shadow-sm shadow-slate-500/10",
    dotClass: "bg-slate-400",
  },
};

interface StatusBadgeProps {
  status: string;
  type?: "booking" | "mechanic";
  className?: string;
}

export function StatusBadge({ status, type = "booking", className }: StatusBadgeProps) {
  const config =
    type === "mechanic"
      ? MECHANIC_STATUS_CONFIG[status as MechanicStatus]
      : BOOKING_STATUS_CONFIG[status as BookingStatus];

  if (!config) {
    return (
      <span
        className={cn(
          "inline-flex shrink-0 items-center rounded-full border border-slate-700 bg-slate-800/60 px-2.5 py-0.5 text-xs font-semibold text-slate-300 whitespace-nowrap",
          className
        )}
      >
        {status}
      </span>
    );
  }

  const dotColor = config.dotClass;

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold tracking-wide whitespace-nowrap",
        config.className,
        className
      )}
    >
      {dotColor && (
        <span className={cn("h-2 w-2 shrink-0 rounded-full animate-pulse", dotColor)} />
      )}
      <span>{config.label}</span>
    </span>
  );
}
