/**
 * Analytics controller
 */
import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import * as analyticsService from "../services/analytics.service";

const daysSchema = z.object({
  days: z.coerce.number().int().positive().max(365).optional().default(30),
});

export async function bookingsOverTime(req: Request, res: Response, next: NextFunction) {
  try {
    const { days } = daysSchema.parse(req.query);
    const data = await analyticsService.getBookingsOverTime(days);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function revenueOverTime(req: Request, res: Response, next: NextFunction) {
  try {
    const { days } = daysSchema.parse(req.query);
    const data = await analyticsService.getRevenueOverTime(days);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function statusBreakdown(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await analyticsService.getStatusBreakdown();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function categoryBreakdown(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await analyticsService.getCategoryBreakdown();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}
