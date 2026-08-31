"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, Filter, Download, ChevronLeft, ChevronRight, ArrowUpDown } from "lucide-react";
import Link from "next/link";
import { api, Booking } from "@/lib/api";
import { useSocket } from "@/contexts/SocketContext";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { formatCurrency, formatDate, cn } from "@/lib/utils";

const STATUS_OPTIONS = ["", "PENDING", "ASSIGNED", "MECHANIC_ON_THE_WAY", "COMPLETED", "CANCELLED"];
const CATEGORY_OPTIONS = ["", "Maintenance", "Repair", "Electrical", "HVAC", "Inspection"];

const SORT_COLUMNS = [
  { key: "scheduledAt", label: "Scheduled" },
  { key: "amount", label: "Amount" },
  { key: "status", label: "Status" },
  { key: "createdAt", label: "Created" },
];

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");
  const [sortBy, setSortBy] = useState("scheduledAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [page, setPage] = useState(1);
  const { socket } = useSocket();

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.bookings.list({
        search: search || undefined,
        status: status || undefined,
        serviceCategory: category || undefined,
        sortBy,
        sortOrder,
        page,
        limit: 20,
      });
      setBookings(res.bookings);
      setPagination(res.pagination);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [search, status, category, sortBy, sortOrder, page]);

  useEffect(() => {
    const t = setTimeout(fetchBookings, 300);
    return () => clearTimeout(t);
  }, [fetchBookings]);

  // Patch booking in-place on live update
  useEffect(() => {
    if (!socket) return;
    socket.on("booking:updated", (updated: Booking) => {
      setBookings((prev) =>
        prev.map((b) => (b.id === updated.id ? { ...b, ...updated } : b))
      );
    });
    return () => { socket.off("booking:updated"); };
  }, [socket]);

  function toggleSort(col: string) {
    if (sortBy === col) {
      setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(col);
      setSortOrder("desc");
    }
    setPage(1);
  }

  function exportCsv() {
    const headers = ["ID", "Customer", "Vehicle", "Service", "Mechanic", "Status", "Amount", "Scheduled"];
    const rows = bookings.map((b) => [
      b.id,
      b.customer?.name ?? "",
      `${b.vehicleYear} ${b.vehicleMake} ${b.vehicleModel}`,
      b.service?.name ?? "",
      b.mechanic?.name ?? "",
      b.status,
      b.amount,
      b.scheduledAt,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bookings-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-100">Bookings</h2>
          <p className="text-sm text-slate-400">
            {pagination.total.toLocaleString()} total bookings
          </p>
        </div>
        <button
          onClick={exportCsv}
          id="export-csv-btn"
          className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-slate-300 transition-colors hover:bg-white/10"
        >
          <Download className="h-3.5 w-3.5" />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            id="bookings-search"
            type="text"
            placeholder="Search customer, vehicle, mechanic…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-9 pr-3 text-sm text-slate-200 placeholder-slate-500 focus:border-sky-500/50 focus:outline-none focus:ring-1 focus:ring-sky-500/30"
          />
        </div>

        <select
          id="bookings-status-filter"
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="rounded-lg border border-white/10 bg-slate-900 py-2 pl-3 pr-8 text-sm text-slate-300 focus:border-sky-500/50 focus:outline-none"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s ? s.replace(/_/g, " ") : "All Statuses"}</option>
          ))}
        </select>

        <select
          id="bookings-category-filter"
          value={category}
          onChange={(e) => { setCategory(e.target.value); setPage(1); }}
          className="rounded-lg border border-white/10 bg-slate-900 py-2 pl-3 pr-8 text-sm text-slate-300 focus:border-sky-500/50 focus:outline-none"
        >
          {CATEGORY_OPTIONS.map((c) => (
            <option key={c} value={c}>{c || "All Categories"}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                {[
                  { key: "id", label: "Booking ID" },
                  { key: "customer", label: "Customer" },
                  { key: "vehicle", label: "Vehicle" },
                  { key: "service", label: "Service" },
                  { key: "mechanic", label: "Mechanic" },
                  { key: "status", label: "Status" },
                  { key: "amount", label: "Amount" },
                  { key: "scheduledAt", label: "Scheduled" },
                ].map(({ key, label }) => (
                  <th
                    key={key}
                    className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500"
                  >
                    <button
                      className="flex items-center gap-1 hover:text-slate-300 transition-colors"
                      onClick={() => SORT_COLUMNS.some((c) => c.key === key) && toggleSort(key)}
                    >
                      {label}
                      {SORT_COLUMNS.some((c) => c.key === key) && (
                        <ArrowUpDown className="h-3 w-3 opacity-50" />
                      )}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-4">
                    <TableSkeleton rows={8} />
                  </td>
                </tr>
              ) : bookings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center">
                    <Filter className="mx-auto mb-3 h-8 w-8 text-slate-600" />
                    <p className="text-sm text-slate-500">No bookings match your filters.</p>
                    <button
                      onClick={() => { setSearch(""); setStatus(""); setCategory(""); }}
                      className="mt-2 text-xs text-sky-400 hover:text-sky-300"
                    >
                      Clear filters
                    </button>
                  </td>
                </tr>
              ) : (
                bookings.map((booking) => (
                  <tr
                    key={booking.id}
                    className="border-b border-white/5 transition-colors hover:bg-white/[0.03]"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/bookings/${booking.id}`}
                        className="font-mono text-xs text-sky-400 hover:text-sky-300 hover:underline"
                      >
                        {booking.id.slice(0, 8)}…
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-200">
                      {booking.customer?.name}
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {booking.vehicleYear} {booking.vehicleMake} {booking.vehicleModel}
                    </td>
                    <td className="px-4 py-3 text-slate-300">{booking.service?.name}</td>
                    <td className="px-4 py-3 text-slate-400">{booking.mechanic?.name ?? "—"}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={booking.status} />
                    </td>
                    <td className="px-4 py-3 font-medium text-emerald-400">
                      {formatCurrency(Number(booking.amount))}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {formatDate(booking.scheduledAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-white/10 px-4 py-3">
          <p className="text-xs text-slate-500">
            Showing {Math.min((page - 1) * 20 + 1, pagination.total)}–
            {Math.min(page * 20, pagination.total)} of {pagination.total}
          </p>
          <div className="flex items-center gap-2">
            <button
              id="bookings-prev-page"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-slate-400 disabled:opacity-30 hover:bg-white/5 hover:text-slate-200 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs text-slate-400">
              {page} / {pagination.totalPages}
            </span>
            <button
              id="bookings-next-page"
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page >= pagination.totalPages}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-slate-400 disabled:opacity-30 hover:bg-white/5 hover:text-slate-200 transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
