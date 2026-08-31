/**
 * @swagger
 * tags:
 *   name: Mechanics
 *   description: Mechanic management
 *
 * /api/mechanics:
 *   get:
 *     summary: List mechanics with current status and last booking
 *     tags: [Mechanics]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [AVAILABLE, BUSY, OFF_DUTY] }
 *     responses:
 *       200:
 *         description: Array of mechanics
 *
 * /api/mechanics/{id}:
 *   get:
 *     summary: Get mechanic detail with booking history
 *     tags: [Mechanics]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Mechanic detail
 *       404:
 *         description: Not found
 */
import { Router } from "express";
import { authenticate } from "../middleware/auth";
import * as mechanicsController from "../controllers/mechanics.controller";

const router = Router();

router.get("/", authenticate, mechanicsController.listMechanics);
router.get("/:id", authenticate, mechanicsController.getMechanic);

export default router;
