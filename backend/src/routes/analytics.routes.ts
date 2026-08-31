/**
 * @swagger
 * tags:
 *   name: Analytics
 *   description: Chart data for the Analytics page
 *
 * /api/analytics/bookings-over-time:
 *   get:
 *     summary: Bookings count per day (line chart data)
 *     tags: [Analytics]
 *     parameters:
 *       - in: query
 *         name: days
 *         schema: { type: integer, default: 30 }
 *     responses:
 *       200:
 *         description: Array of { date, bookings }
 *
 * /api/analytics/revenue-over-time:
 *   get:
 *     summary: Revenue per day from completed bookings (line chart data)
 *     tags: [Analytics]
 *     parameters:
 *       - in: query
 *         name: days
 *         schema: { type: integer, default: 30 }
 *     responses:
 *       200:
 *         description: Array of { date, revenue }
 *
 * /api/analytics/status-breakdown:
 *   get:
 *     summary: Count per booking status (donut chart data)
 *     tags: [Analytics]
 *     responses:
 *       200:
 *         description: Array of { status, count }
 *
 * /api/analytics/category-breakdown:
 *   get:
 *     summary: Count and revenue per service category (bar chart data)
 *     tags: [Analytics]
 *     responses:
 *       200:
 *         description: Array of { category, count, revenue }
 */
import { Router } from "express";
import { authenticate } from "../middleware/auth";
import * as analyticsController from "../controllers/analytics.controller";

const router = Router();

router.get("/bookings-over-time", authenticate, analyticsController.bookingsOverTime);
router.get("/revenue-over-time", authenticate, analyticsController.revenueOverTime);
router.get("/status-breakdown", authenticate, analyticsController.statusBreakdown);
router.get("/category-breakdown", authenticate, analyticsController.categoryBreakdown);

export default router;
