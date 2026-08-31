/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Aggregated KPI stats
 *
 * /api/dashboard:
 *   get:
 *     summary: Get overview dashboard stats
 *     tags: [Dashboard]
 *     responses:
 *       200:
 *         description: KPI object with totalBookings, revenue, mechanic counts, etc.
 */
import { Router } from "express";
import { authenticate } from "../middleware/auth";
import * as dashboardController from "../controllers/dashboard.controller";

const router = Router();

router.get("/", authenticate, dashboardController.getStats);

export default router;
