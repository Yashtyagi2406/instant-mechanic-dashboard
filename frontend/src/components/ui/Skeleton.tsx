/**
 * Skeleton components for loading states.
 * Using CSS animation instead of a library to keep deps lean.
 */
import { cn } from "@/lib/utils";

function Skeleton({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-white/5",
        className
      )}
      style={style}
    />
  );
}

export function KpiCardSkeleton() {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
      <Skeleton className="mt-4 h-8 w-20" />
      <Skeleton className="mt-2 h-3 w-36" />
    </div>
  );
}

export function TableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 rounded-lg border border-white/5 bg-white/3 p-4">
          <Skeleton className="h-4 w-24 flex-shrink-0" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
}

export function ChartSkeleton({ height = "h-64" }: { height?: string }) {
  return (
    <div className={cn("flex items-end gap-2 px-4 pb-4", height)}>
      {Array.from({ length: 20 }).map((_, i) => (
        <Skeleton
          key={i}
          className="flex-1 rounded-t-sm"
          style={{ height: `${20 + Math.random() * 80}%` }}
        />
      ))}
    </div>
  );
}

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm space-y-3", className)}>
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );
}

export { Skeleton };
