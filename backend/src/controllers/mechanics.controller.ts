/**
 * Mechanics controller
 */
import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { MechanicStatus } from "@prisma/client";
import * as mechanicsService from "../services/mechanics.service";

const listQuerySchema = z.object({
  status: z.nativeEnum(MechanicStatus).optional(),
});

export async function listMechanics(req: Request, res: Response, next: NextFunction) {
  try {
    const { status } = listQuerySchema.parse(req.query);
    const mechanics = await mechanicsService.getMechanics(status);
    res.json({ success: true, data: mechanics });
  } catch (err) {
    next(err);
  }
}

export async function getMechanic(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const mechanic = await mechanicsService.getMechanicById(id);
    res.json({ success: true, data: mechanic });
  } catch (err) {
    next(err);
  }
}
