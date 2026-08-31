/**
 * Analytics service — shapes data for the four chart components.
 * All queries return arrays of { date, value } or { label, value } tuples.
 */
import { prisma } from "../lib/prisma";

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Bookings count grouped by day for the past N days. */
export async function getBookingsOverTime(days = 30) {
  const from = daysAgo(days);

  // Use Prisma raw SQL for date_trunc grouping (more efficient than JS grouping)
  const rows = await prisma.$queryRaw<{ date: Date; count: bigint }[]>`
    SELECT date_trunc('day', scheduled_at) AS date, COUNT(*) AS count
    FROM bookings
    WHERE scheduled_at >= ${from}
    GROUP BY date
    ORDER BY date ASC
  `;

  return rows.map((r) => ({
    date: r.date.toISOString().slice(0, 10),
    bookings: Number(r.count),
  }));
}

/** Revenue (from completed bookings) grouped by day for the past N days. */
export async function getRevenueOverTime(days = 30) {
  const from = daysAgo(days);

  const rows = await prisma.$queryRaw<{ date: Date; revenue: number }[]>`
    SELECT date_trunc('day', scheduled_at) AS date, SUM(amount) AS revenue
    FROM bookings
    WHERE scheduled_at >= ${from} AND status = 'COMPLETED'
    GROUP BY date
    ORDER BY date ASC
  `;

  return rows.map((r) => ({
    date: r.date.toISOString().slice(0, 10),
    revenue: Number(r.revenue ?? 0),
  }));
}

/** Count of bookings per status (for a donut/pie chart). */
export async function getStatusBreakdown() {
  const rows = await prisma.booking.groupBy({
    by: ["status"],
    _count: { _all: true },
  });

  return rows.map((r) => ({
    status: r.status,
    count: r._count._all,
  }));
}

/** Count and revenue of bookings per service category (for a bar chart). */
export async function getCategoryBreakdown() {
  const rows = await prisma.$queryRaw<
    { category: string; count: bigint; revenue: number }[]
  >`
    SELECT s.category, COUNT(b.id) AS count, COALESCE(SUM(b.amount), 0) AS revenue
    FROM bookings b
    JOIN services s ON s.id = b.service_id
    GROUP BY s.category
    ORDER BY count DESC
  `;

  return rows.map((r) => ({
    category: r.category,
    count: Number(r.count),
    revenue: Number(r.revenue),
  }));
}
