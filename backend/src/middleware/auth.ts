/**
 * JWT authentication middleware.
 * Validates the Bearer token from the Authorization header,
 * attaches the decoded payload to req.user.
 */
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "./errorHandler";

export interface AuthPayload {
  userId: string;
  email: string;
  role: string;
}

// Extend Express Request type to carry our auth payload
declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return next(new AppError(401, "Authentication required"));
  }

  const token = authHeader.slice(7);
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET env var not set");

  try {
    const payload = jwt.verify(token, secret) as AuthPayload;
    req.user = payload;
    next();
  } catch {
    next(new AppError(401, "Invalid or expired token"));
  }
}

/** Middleware that requires the ADMIN role. Apply after authenticate(). */
export function requireAdmin(req: Request, _res: Response, next: NextFunction): void {
  if (req.user?.role !== "ADMIN") {
    return next(new AppError(403, "Admin access required"));
  }
  next();
}
