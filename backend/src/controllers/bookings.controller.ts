/**
 * Bookings controller — list, detail, status update.
 */
import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { BookingStatus } from "@prisma/client";
import * as bookingsService from "../services/bookings.service";

const listQuerySchema = z.object({
  search: z.string().optional(),
  status: z.nativeEnum(BookingStatus).optional(),
  serviceCategory: z.string().optional(),
  dateFrom: z.string().datetime({ offset: true }).optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()),
  dateTo: z.string().datetime({ offset: true }).optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()),
  sortBy: z.enum(["scheduledAt", "amount", "status", "createdAt"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

const updateStatusSchema = z.object({
  status: z.nativeEnum(BookingStatus),
  note: z.string().optional(),
});

export async function listBookings(req: Request, res: Response, next: NextFunction) {
  try {
    const filters = listQuerySchema.parse(req.query);
    const result = await bookingsService.getBookings(filters);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

export async function getBooking(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const booking = await bookingsService.getBookingById(id);
    res.json({ success: true, data: booking });
  } catch (err) {
    next(err);
  }
}

export async function updateBookingStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const { status, note } = updateStatusSchema.parse(req.body);
    const booking = await bookingsService.updateBookingStatus(id, status, note);
    // The Socket.io emission happens in the route layer (it has access to io)
    res.json({ success: true, data: booking });
  } catch (err) {
    next(err);
  }
}
