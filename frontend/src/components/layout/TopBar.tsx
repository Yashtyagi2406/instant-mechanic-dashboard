"use client";

import { Moon, Sun, Bell } from "lucide-react";
import { useTheme } from "next-themes";
import { usePathname } from "next/navigation";

const PAGE_TITLES: Record<string, string> = {
  "/": "Overview",
  "/analytics": "Analytics",
  "/bookings": "Bookings",
  "/mechanics": "Mechanics",
};

export function TopBar() {
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();

  // Match the longest prefix for dynamic routes like /bookings/[id]
  const title = Object.entries(PAGE_TITLES)
    .filter(([path]) => pathname.startsWith(path))
    .sort((a, b) => b[0].length - a[0].length)[0]?.[1] ?? "Dashboard";

  return (
    <header className="flex h-16 flex-shrink-0 items-center justify-between border-b border-white/10 bg-slate-900/50 px-6 backdrop-blur-sm">
      <div>
        <h1 className="text-lg font-semibold text-slate-100">{title}</h1>
        <p className="text-xs text-slate-500">
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </p>
      </div>

      <div className="flex items-center gap-2">
        {/* Notifications placeholder */}
        <button
          id="topbar-notifications"
          className="relative flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/5 hover:text-slate-200"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-sky-500" />
        </button>

        {/* Dark mode toggle */}
        <button
          id="topbar-theme-toggle"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/5 hover:text-slate-200"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
      </div>
    </header>
  );
}
