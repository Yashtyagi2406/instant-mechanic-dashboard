"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  BarChart3,
  Calendar,
  Wrench,
  LogOut,
  ChevronLeft,
  Zap,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { useSocket } from "@/contexts/SocketContext";

const NAV_ITEMS = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/bookings", label: "Bookings", icon: Calendar },
  { href: "/mechanics", label: "Mechanics", icon: Wrench },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { connected } = useSocket();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "relative flex h-screen flex-col border-r border-white/10 bg-slate-900/80 backdrop-blur-xl transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className={cn("flex items-center gap-3 border-b border-white/10 px-4 py-5", collapsed && "justify-center px-0")}>
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 shadow-lg shadow-sky-500/25">
          <Wrench className="h-4 w-4 text-white" />
        </div>
        {!collapsed && (
          <div>
            <p className="text-sm font-bold text-white">Instant Mechanic</p>
            <p className="text-xs text-slate-400">Operations Dashboard</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                active
                  ? "bg-sky-500/15 text-sky-400"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-100",
                collapsed && "justify-center px-0"
              )}
              title={collapsed ? label : undefined}
            >
              <Icon className={cn("h-5 w-5 flex-shrink-0", active ? "text-sky-400" : "text-slate-400 group-hover:text-slate-100")} />
              {!collapsed && label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-white/10 p-3 space-y-2">
        {/* Live indicator */}
        {!collapsed && (
          <div className={cn(
            "flex items-center gap-2 rounded-lg px-3 py-2 text-xs",
            connected ? "text-emerald-400" : "text-slate-500"
          )}>
            <Zap className={cn("h-3 w-3", connected && "animate-pulse")} />
            {connected ? "Live updates active" : "Disconnected"}
          </div>
        )}

        {/* User */}
        {!collapsed && user && (
          <div className="flex items-center gap-2 rounded-lg px-3 py-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-sky-500/20 text-xs font-bold text-sky-400">
              {user.email[0].toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-slate-200">{user.email}</p>
              <p className="text-xs text-slate-500 capitalize">{user.role.toLowerCase()}</p>
            </div>
          </div>
        )}

        <button
          onClick={logout}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-400 transition-colors hover:bg-red-500/10 hover:text-red-400",
            collapsed && "justify-center px-0"
          )}
          title="Logout"
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          {!collapsed && "Logout"}
        </button>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-8 flex h-6 w-6 items-center justify-center rounded-full border border-white/20 bg-slate-800 text-slate-400 shadow-md transition-all hover:text-white"
      >
        <ChevronLeft className={cn("h-3.5 w-3.5 transition-transform", collapsed && "rotate-180")} />
      </button>
    </aside>
  );
}
