/**
 * Status badge component — color-codes booking and mechanic statuses.
 */
import { cn } from "@/lib/utils";

type BookingStatus = "PENDING" | "ASSIGNED" | "MECHANIC_ON_THE_WAY" | "COMPLETED" | "CANCELLED";
type MechanicStatus = "AVAILABLE" | "BUSY" | "OFF_DUTY";

const BOOKING_STATUS_CONFIG: Record<
  BookingStatus,
  { label: string; className: string }
> = {
  PENDING: {
    label: "Pending",
    className: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  },
  ASSIGNED: {
    label: "Assigned",
    className: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  },
  MECHANIC_ON_THE_WAY: {
    label: "On The Way",
    className: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  },
  COMPLETED: {
    label: "Completed",
    className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  },
  CANCELLED: {
    label: "Cancelled",
    className: "bg-red-500/15 text-red-400 border-red-500/30",
  },
};

const MECHANIC_STATUS_CONFIG: Record<
  MechanicStatus,
  { label: string; className: string; dotClass: string }
> = {
  AVAILABLE: {
    label: "Available",
    className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    dotClass: "bg-emerald-400",
  },
  BUSY: {
    label: "Busy",
    className: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    dotClass: "bg-amber-400",
  },
  OFF_DUTY: {
    label: "Off Duty",
    className: "bg-slate-500/15 text-slate-400 border-slate-500/30",
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
      <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium", className)}>
        {status}
      </span>
    );
  }

  const mechanicConfig = type === "mechanic" ? MECHANIC_STATUS_CONFIG[status as MechanicStatus] : null;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        config.className,
        className
      )}
    >
      {mechanicConfig && (
        <span className={cn("h-1.5 w-1.5 rounded-full animate-pulse", mechanicConfig.dotClass)} />
      )}
      {config.label}
    </span>
  );
}
