/**
 * Live booking simulator.
 *
 * Runs as a setInterval inside the backend process.
 * Every 8 seconds it picks 1–3 random bookings that are NOT yet completed or
 * cancelled, advances each one by one step in the status pipeline, and emits
 * the Socket.io events that drive the live dashboard feel.
 *
 * This is intentionally simple and visible — it's a demo tool for interviews.
 */
import { BookingStatus } from "@prisma/client";
import { prisma } from "./lib/prisma";
import { getSocketIO } from "./socket/index";
import { getDashboardStats } from "./services/dashboard.service";

// The ordered progression pipeline
const PIPELINE: BookingStatus[] = [
  "PENDING",
  "ASSIGNED",
  "MECHANIC_ON_THE_WAY",
  "COMPLETED",
];

function nextStatus(current: BookingStatus): BookingStatus | null {
  const idx = PIPELINE.indexOf(current);
  if (idx === -1 || idx === PIPELINE.length - 1) return null;
  return PIPELINE[idx + 1];
}

async function tick() {
  try {
    // Pick up to 2 in-progress bookings (not completed/cancelled) at random
    const eligible = await prisma.booking.findMany({
      where: { status: { in: ["PENDING", "ASSIGNED", "MECHANIC_ON_THE_WAY"] } },
      take: 10,
      orderBy: { updatedAt: "asc" }, // oldest-updated first
      include: {
        customer: { select: { id: true, name: true, email: true, phone: true } },
        mechanic: { select: { id: true, name: true, status: true } },
        service: { select: { id: true, name: true, category: true } },
      },
    });

    if (eligible.length === 0) return;

    // Pick 1–2 random bookings to advance
    const shuffled = eligible.sort(() => Math.random() - 0.5).slice(0, 2);

    for (const booking of shuffled) {
      const next = nextStatus(booking.status);
      if (!next) continue;

      // Advance the booking and log the transition
      const [updated] = await prisma.$transaction([
        prisma.booking.update({
          where: { id: booking.id },
          data: { status: next },
          include: {
            customer: { select: { id: true, name: true, email: true, phone: true } },
            mechanic: { select: { id: true, name: true, status: true } },
            service: { select: { id: true, name: true, category: true } },
          },
        }),
        prisma.bookingStatusHistory.create({
          data: {
            bookingId: booking.id,
            oldStatus: booking.status,
            newStatus: next,
            note: "Auto-advanced by live simulator",
          },
        }),
      ]);

      // Emit the live update event
      const io = getSocketIO();
      io.emit("booking:updated", updated);
    }

    // Refresh dashboard stats so the KPI cards update too
    const stats = await getDashboardStats();
    const io = getSocketIO();
    io.emit("dashboard:stats-updated", stats);
  } catch (err) {
    // Don't crash the server if the simulator has a transient error
    console.error("[Simulator] tick error:", err);
  }
}

/** Call once after the server starts to kick off the simulation loop. */
export function startSimulator(intervalMs = 8000): NodeJS.Timeout {
  console.log(`[Simulator] Starting — advancing bookings every ${intervalMs / 1000}s`);
  return setInterval(tick, intervalMs);
}
