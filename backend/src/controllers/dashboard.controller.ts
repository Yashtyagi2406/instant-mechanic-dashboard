/**
 * Dashboard controller — aggregated KPI stats for the Overview page.
 */
import { Request, Response, NextFunction } from "express";
import * as dashboardService from "../services/dashboard.service";

export async function getStats(req: Request, res: Response, next: NextFunction) {
  try {
    const stats = await dashboardService.getDashboardStats();
    res.json({ success: true, data: stats });
  } catch (err) {
    next(err);
  }
}
