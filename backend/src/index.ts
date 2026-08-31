/**
 * Instant Mechanic — Backend API Entry Point
 *
 * Sets up Express, Socket.io, all middleware, and all route groups,
 * then starts the HTTP server and the live booking simulator.
 */
import "dotenv/config";
import express from "express";
import http from "http";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import swaggerUi from "swagger-ui-express";

import { initSocketIO } from "./socket";
import { startSimulator } from "./simulator";
import { swaggerSpec } from "./lib/swagger";
import { errorHandler } from "./middleware/errorHandler";

import authRoutes from "./routes/auth.routes";
import dashboardRoutes from "./routes/dashboard.routes";
import bookingsRoutes from "./routes/bookings.routes";
import mechanicsRoutes from "./routes/mechanics.routes";
import customersRoutes from "./routes/customers.routes";
import analyticsRoutes from "./routes/analytics.routes";

const app = express();
const httpServer = http.createServer(app);

// ── CORS ─────────────────────────────────────────────────────────────────────
const corsOrigin = process.env.CORS_ORIGIN ?? "http://localhost:3000";
app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  })
);

// ── Security & Perf middleware ────────────────────────────────────────────────
app.use(
  helmet({
    // Relax CSP for Swagger UI
    contentSecurityPolicy: false,
  })
);
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Rate limiting ─────────────────────────────────────────────────────────────
// Global: 200 requests per minute per IP
app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: "Too many requests — slow down" },
  })
);

// Stricter limit for auth routes to prevent brute force
app.use(
  "/api/auth",
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20,
    message: { success: false, error: "Too many auth attempts" },
  })
);

// ── Swagger docs ──────────────────────────────────────────────────────────────
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/bookings", bookingsRoutes);
app.use("/api/mechanics", mechanicsRoutes);
app.use("/api/customers", customersRoutes);
app.use("/api/analytics", analyticsRoutes);

// Health check — useful for Docker/EC2 ALB health checks
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── Error handler ─────────────────────────────────────────────────────────────
// Must be registered AFTER all routes
app.use(errorHandler);

// ── Socket.io ─────────────────────────────────────────────────────────────────
initSocketIO(httpServer, corsOrigin);

// ── Start server ──────────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT ?? "4000", 10);

httpServer.listen(PORT, () => {
  console.log(`🚀 Instant Mechanic API running on http://localhost:${PORT}`);
  console.log(`📖 Swagger docs: http://localhost:${PORT}/api/docs`);

  // Start the live demo simulator (can be disabled by setting DISABLE_SIMULATOR=true)
  if (process.env.DISABLE_SIMULATOR !== "true") {
    startSimulator();
  }
});

export { app, httpServer };
