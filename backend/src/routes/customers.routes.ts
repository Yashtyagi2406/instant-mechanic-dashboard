/**
 * @swagger
 * tags:
 *   name: Customers
 *   description: Customer management
 *
 * /api/customers:
 *   get:
 *     summary: List customers (paginated)
 *     tags: [Customers]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Paginated customers
 *
 * /api/customers/{id}:
 *   get:
 *     summary: Get customer detail with booking history
 *     tags: [Customers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Customer detail
 *       404:
 *         description: Not found
 */
import { Router } from "express";
import { authenticate } from "../middleware/auth";
import * as customersController from "../controllers/customers.controller";

const router = Router();

router.get("/", authenticate, customersController.listCustomers);
router.get("/:id", authenticate, customersController.getCustomer);

export default router;
