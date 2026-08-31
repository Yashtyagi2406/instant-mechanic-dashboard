/**
 * Bookings service — paginated list, single booking detail, status update.
 */
import { BookingStatus, Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { AppError } from "../middleware/errorHandler";

export interface BookingFilters {
  search?: string;
  status?: BookingStatus;
  serviceCategory?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: "scheduledAt" | "amount" | "status" | "createdAt";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

// Full booking shape with relations — used for list and detail views
const bookingInclude = {
  customer: { select: { id: true, name: true, email: true, phone: true } },
  mechanic: { select: { id: true, name: true, status: true } },
  service: { select: { id: true, name: true, category: true } },
} satisfies Prisma.BookingInclude;

export async function getBookings(filters: BookingFilters) {
  const {
    search,
    status,
    serviceCategory,
    dateFrom,
    dateTo,
    sortBy = "scheduledAt",
    sortOrder = "desc",
    page = 1,
    limit = 20,
  } = filters;

  const where: Prisma.BookingWhereInput = {};

  if (status) where.status = status;

  if (serviceCategory) {
    where.service = { category: serviceCategory };
  }

  if (dateFrom || dateTo) {
    where.scheduledAt = {
      ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
      ...(dateTo ? { lte: new Date(dateTo) } : {}),
    };
  }

  if (search) {
    where.OR = [
      { customer: { name: { contains: search, mode: "insensitive" } } },
      { mechanic: { name: { contains: search, mode: "insensitive" } } },
      { vehicleMake: { contains: search, mode: "insensitive" } },
      { vehicleModel: { contains: search, mode: "insensitive" } },
      { vehiclePlate: { contains: search, mode: "insensitive" } },
    ];
  }

  const orderBy: Prisma.BookingOrderByWithRelationInput =
    sortBy === "status"
      ? { status: sortOrder }
      : { [sortBy]: sortOrder };

  const skip = (page - 1) * limit;

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      include: bookingInclude,
      orderBy,
      skip,
      take: limit,
    }),
    prisma.booking.count({ where }),
  ]);

  return {
    bookings,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getBookingById(id: string) {
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      ...bookingInclude,
      statusHistory: { orderBy: { changedAt: "asc" } },
    },
  });
  if (!booking) throw new AppError(404, `Booking ${id} not found`);
  return booking;
}

export async function updateBookingStatus(
  bookingId: string,
  newStatus: BookingStatus,
  note?: string
) {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) throw new AppError(404, `Booking ${bookingId} not found`);

  const oldStatus = booking.status;

  // Update booking + log the transition in a single transaction
  const [updated] = await prisma.$transaction([
    prisma.booking.update({
      where: { id: bookingId },
      data: { status: newStatus },
      include: bookingInclude,
    }),
    prisma.bookingStatusHistory.create({
      data: { bookingId, oldStatus, newStatus, note },
    }),
  ]);

  return updated;
}
