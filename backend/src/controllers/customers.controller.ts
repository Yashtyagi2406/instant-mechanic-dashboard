/**
 * Customers controller
 */
import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import * as customersService from "../services/customers.service";

const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  search: z.string().optional(),
});

export async function listCustomers(req: Request, res: Response, next: NextFunction) {
  try {
    const { page, limit, search } = listQuerySchema.parse(req.query);
    const result = await customersService.getCustomers(page, limit, search);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

export async function getCustomer(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const customer = await customersService.getCustomerById(id);
    res.json({ success: true, data: customer });
  } catch (err) {
    next(err);
  }
}
