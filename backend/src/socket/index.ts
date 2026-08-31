/**
 * Socket.io server setup.
 *
 * The io instance is created once and stored as a module singleton so any
 * route handler (e.g. the booking status PATCH) can call getSocketIO() to emit.
 *
 * Events emitted by the server:
 *   - booking:updated  { booking }  — whenever any booking status changes
 *   - dashboard:stats-updated { stats } — after stats-affecting changes
 */
import { Server as IOServer } from "socket.io";
import { Server as HttpServer } from "http";

let io: IOServer;

export function initSocketIO(httpServer: HttpServer, corsOrigin: string): IOServer {
  io = new IOServer(httpServer, {
    cors: {
      origin: corsOrigin,
      methods: ["GET", "POST"],
      credentials: true,
    },
    // Reconnection is handled by the client; keep server settings straightforward
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  io.on("connection", (socket) => {
    console.log(`[Socket.io] Client connected: ${socket.id}`);

    socket.on("disconnect", () => {
      console.log(`[Socket.io] Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

/** Returns the singleton io instance. Throws if initSocketIO was not called yet. */
export function getSocketIO(): IOServer {
  if (!io) throw new Error("Socket.io not initialised — call initSocketIO first");
  return io;
}
