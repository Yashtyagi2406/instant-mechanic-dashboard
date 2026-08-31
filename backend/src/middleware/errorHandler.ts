/**
 * Global error-handling middleware.
 * Catches any error thrown in route handlers and formats a consistent JSON response.
 */
import { Request, Response, NextFunction } from "express";

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string
  ) {
    super(message);
    this.name = "AppError";
    Error.captureStackTrace(this, this.constructor);
  }
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ success: false, error: err.message });
    return;
  }

  // Prisma known errors — e.g. unique constraint violations
  if (err.constructor?.name === "PrismaClientKnownRequestError") {
    const prismaErr = err as unknown as { code: string; meta?: { target?: string[] } };
    if (prismaErr.code === "P2002") {
      res.status(409).json({
        success: false,
        error: `Duplicate value for: ${prismaErr.meta?.target?.join(", ")}`,
      });
      return;
    }
    if (prismaErr.code === "P2025") {
      res.status(404).json({ success: false, error: "Record not found" });
      return;
    }
  }

  // Zod validation errors
  if (err.name === "ZodError") {
    res.status(422).json({ success: false, error: "Validation failed", details: JSON.parse(err.message) });
    return;
  }

  console.error("[ErrorHandler]", err);
  res.status(500).json({ success: false, error: "Internal server error" });
}
