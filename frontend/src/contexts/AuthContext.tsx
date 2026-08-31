/**
 * Auth context — stores the JWT token, current user, and exposes login/logout.
 * The token is persisted to localStorage so it survives page refreshes.
 */
"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  email: string;
  role: string;
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // On mount, check if there's an existing token and validate it
  useEffect(() => {
    const stored = localStorage.getItem("im_token");
    if (stored) {
      setToken(stored);
      api.auth
        .me()
        .then((res) => setUser(res.data))
        .catch(() => {
          localStorage.removeItem("im_token");
          setToken(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  async function login(email: string, password: string) {
    const res = await api.auth.login(email, password);
    const { token: jwt, user: u } = res.data;
    localStorage.setItem("im_token", jwt);
    setToken(jwt);
    setUser(u);
    router.push("/");
  }

  function logout() {
    localStorage.removeItem("im_token");
    setToken(null);
    setUser(null);
    router.push("/login");
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
