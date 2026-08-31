/**
 * @swagger
 * tags:
 *   name: Bookings
 *   description: Booking management
 *
 * /api/bookings:
 *   get:
 *     summary: List bookings (paginated, filterable, sortable)
 *     tags: [Bookings]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Free-text search on customer name, mechanic name, vehicle
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [PENDING, ASSIGNED, MECHANIC_ON_THE_WAY, COMPLETED, CANCELLED] }
 *       - in: query
 *         name: serviceCategory
 *         schema: { type: string }
 *       - in: query
 *         name: dateFrom
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: dateTo
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, enum: [scheduledAt, amount, status, createdAt] }
 *       - in: query
 *         name: sortOrder
 *         schema: { type: string, enum: [asc, desc] }
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Paginated bookings array
 *
 * /api/bookings/{id}:
 *   get:
 *     summary: Get full booking detail including status history
 *     tags: [Bookings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Booking with status history
 *       404:
 *         description: Not found
 *
 * /api/bookings/{id}/status:
 *   patch:
 *     summary: Update booking status
 *     tags: [Bookings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [PENDING, ASSIGNED, MECHANIC_ON_THE_WAY, COMPLETED, CANCELLED]
 *               note:
 *                 type: string
 *     responses:
 *       200:
 *         description: Updated booking
 */
import { Router } from "express";
import { authenticate } from "../middleware/auth";
import * as bookingsController from "../controllers/bookings.controller";
import { getSocketIO } from "../socket";
import { getDashboardStats } from "../services/dashboard.service";

const router = Router();

router.get("/", authenticate, bookingsController.listBookings);
router.get("/:id", authenticate, bookingsController.getBooking);

// PATCH status — also emits Socket.io events for real-time updates
router.patch("/:id/status", authenticate, async (req, res, next) => {
  const originalJson = res.json.bind(res);

  // Intercept the json response to emit socket events after a successful update
  res.json = (body) => {
    if (body?.success && body?.data) {
      const io = getSocketIO();
      io.emit("booking:updated", body.data);
      // Also push fresh dashboard stats so the overview cards update
      getDashboardStats()
        .then((stats) => io.emit("dashboard:stats-updated", stats))
        .catch(console.error);
    }
    return originalJson(body);
  };

  return bookingsController.updateBookingStatus(req, res, next);
});

export default router;
