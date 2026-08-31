/**
 * Auth service — handles login and registration.
 */
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";
import { AppError } from "../middleware/errorHandler";

const SALT_ROUNDS = 10;
const JWT_EXPIRES_IN = "7d";

function signToken(userId: string, email: string, role: string): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET not configured");
  return jwt.sign({ userId, email, role }, secret, { expiresIn: JWT_EXPIRES_IN });
}

export async function loginUser(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new AppError(401, "Invalid credentials");

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new AppError(401, "Invalid credentials");

  const token = signToken(user.id, user.email, user.role);
  return { token, user: { id: user.id, email: user.email, role: user.role } };
}

export async function registerUser(email: string, password: string, role: "ADMIN" | "OPERATOR" = "OPERATOR") {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new AppError(409, "Email already in use");

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await prisma.user.create({ data: { email, passwordHash, role } });

  const token = signToken(user.id, user.email, user.role);
  return { token, user: { id: user.id, email: user.email, role: user.role } };
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, role: true, createdAt: true },
  });
  if (!user) throw new AppError(404, "User not found");
  return user;
}
