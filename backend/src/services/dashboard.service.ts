/**
 * Dashboard service — computes aggregated KPI stats for the Overview page.
 */
import { prisma } from "../lib/prisma";

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

export async function getDashboardStats() {
  const now = new Date();
  const todayStart = startOfDay(now);
  const last7Days = daysAgo(7);
  const last30Days = daysAgo(30);

  const [
    totalBookings,
    todaysBookings,
    completedBookings,
    pendingBookings,
    cancelledBookings,
    assignedBookings,
    onTheWayBookings,
    revenueResult,
    activeMechanics,
    newCustomers7d,
    newCustomers30d,
  ] = await Promise.all([
    prisma.booking.count(),
    prisma.booking.count({ where: { scheduledAt: { gte: todayStart } } }),
    prisma.booking.count({ where: { status: "COMPLETED" } }),
    prisma.booking.count({ where: { status: "PENDING" } }),
    prisma.booking.count({ where: { status: "CANCELLED" } }),
    prisma.booking.count({ where: { status: "ASSIGNED" } }),
    prisma.booking.count({ where: { status: "MECHANIC_ON_THE_WAY" } }),
    prisma.booking.aggregate({
      _sum: { amount: true },
      where: { status: "COMPLETED" },
    }),
    prisma.mechanic.count({ where: { status: { in: ["AVAILABLE", "BUSY"] } } }),
    prisma.customer.count({ where: { createdAt: { gte: last7Days } } }),
    prisma.customer.count({ where: { createdAt: { gte: last30Days } } }),
  ]);

  return {
    totalBookings,
    todaysBookings,
    completedBookings,
    pendingBookings,
    cancelledBookings,
    assignedBookings,
    onTheWayBookings,
    totalRevenue: Number(revenueResult._sum.amount ?? 0),
    activeMechanics,
    newCustomers: { last7Days: newCustomers7d, last30Days: newCustomers30d },
  };
}
