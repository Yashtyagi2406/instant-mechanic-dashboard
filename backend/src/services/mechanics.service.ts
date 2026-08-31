/**
 * Mechanics service — list, detail, status update.
 */
import { MechanicStatus, Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { AppError } from "../middleware/errorHandler";

export async function getMechanics(status?: MechanicStatus) {
  const where: Prisma.MechanicWhereInput = status ? { status } : {};

  return prisma.mechanic.findMany({
    where,
    orderBy: [{ status: "asc" }, { name: "asc" }],
    include: {
      // Include most-recent booking for the "current/last booking" column
      bookings: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: {
          customer: { select: { name: true } },
          service: { select: { name: true, category: true } },
        },
      },
    },
  });
}

export async function getMechanicById(id: string) {
  const mechanic = await prisma.mechanic.findUnique({
    where: { id },
    include: {
      bookings: {
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          customer: { select: { name: true } },
          service: { select: { name: true, category: true } },
        },
      },
    },
  });
  if (!mechanic) throw new AppError(404, `Mechanic ${id} not found`);
  return mechanic;
}

export async function updateMechanicStatus(id: string, status: MechanicStatus) {
  const mechanic = await prisma.mechanic.findUnique({ where: { id } });
  if (!mechanic) throw new AppError(404, `Mechanic ${id} not found`);
  return prisma.mechanic.update({ where: { id }, data: { status } });
}
