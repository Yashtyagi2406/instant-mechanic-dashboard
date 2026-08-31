/**
 * Socket.io client context.
 * Creates a single socket connection at the app root and provides it to all
 * children via useSocket(). Components subscribe to events and patch local
 * state without triggering a full re-fetch.
 */
"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { io, Socket } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:4000";

interface SocketContextValue {
  socket: Socket | null;
  connected: boolean;
}

const SocketContext = createContext<SocketContextValue>({ socket: null, connected: false });

export function SocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Only connect when a token exists (i.e. user is logged in)
    const token = localStorage.getItem("im_token");
    if (!token) return;

    const s = io(SOCKET_URL, {
      transports: ["websocket"],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    s.on("connect", () => {
      console.log("[Socket.io] Connected:", s.id);
      setConnected(true);
    });

    s.on("disconnect", () => {
      console.log("[Socket.io] Disconnected");
      setConnected(false);
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
