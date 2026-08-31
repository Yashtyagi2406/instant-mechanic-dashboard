/**
 * API client utility.
 * All fetch calls go through here so we have a single place to set
 * the base URL, attach auth headers, and handle 401 redirects.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("im_token");
}

interface FetchOptions extends RequestInit {
  auth?: boolean; // default true — attach Bearer token
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiFetch<T>(
  path: string,
  options: FetchOptions = {}
): Promise<T> {
  const { auth = true, ...init } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string>),
  };

  if (auth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });

  if (!res.ok) {
    // 401 → clear token and redirect to login
    if (res.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("im_token");
      window.location.href = "/login";
    }
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new ApiError(res.status, body?.error ?? "Request failed");
  }

  return res.json() as Promise<T>;
}

// ── Typed API helpers ──────────────────────────────────────────────────────────

export const api = {
  auth: {
    login: (email: string, password: string) =>
      apiFetch<{ success: boolean; data: { token: string; user: { id: string; email: string; role: string } } }>(
        "/auth/login",
        { method: "POST", body: JSON.stringify({ email, password }), auth: false }
      ),
    me: () => apiFetch<{ success: boolean; data: { id: string; email: string; role: string } }>("/auth/me"),
  },

  dashboard: {
    stats: () => apiFetch<{ success: boolean; data: DashboardStats }>("/dashboard"),
  },

  bookings: {
    list: (params: Record<string, string | number | undefined>) => {
      const qs = new URLSearchParams(
        Object.entries(params)
          .filter(([, v]) => v !== undefined && v !== "")
          .map(([k, v]) => [k, String(v)])
      ).toString();
      return apiFetch<BookingsListResponse>(`/bookings${qs ? `?${qs}` : ""}`);
    },
    get: (id: string) => apiFetch<{ success: boolean; data: BookingDetail }>(`/bookings/${id}`),
    updateStatus: (id: string, status: string, note?: string) =>
      apiFetch<{ success: boolean; data: Booking }>(`/bookings/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status, note }),
      }),
  },

  mechanics: {
    list: (status?: string) =>
      apiFetch<{ success: boolean; data: Mechanic[] }>(`/mechanics${status ? `?status=${status}` : ""}`),
    get: (id: string) => apiFetch<{ success: boolean; data: MechanicDetail }>(`/mechanics/${id}`),
  },

  customers: {
    list: (params: Record<string, string | number | undefined>) => {
      const qs = new URLSearchParams(
        Object.entries(params)
          .filter(([, v]) => v !== undefined)
          .map(([k, v]) => [k, String(v)])
      ).toString();
      return apiFetch<CustomersListResponse>(`/customers${qs ? `?${qs}` : ""}`);
    },
    get: (id: string) => apiFetch<{ success: boolean; data: CustomerDetail }>(`/customers/${id}`),
  },

  analytics: {
    bookingsOverTime: (days = 30) =>
      apiFetch<{ success: boolean; data: Array<{ date: string; bookings: number }> }>(`/analytics/bookings-over-time?days=${days}`),
    revenueOverTime: (days = 30) =>
      apiFetch<{ success: boolean; data: Array<{ date: string; revenue: number }> }>(`/analytics/revenue-over-time?days=${days}`),
    statusBreakdown: () =>
      apiFetch<{ success: boolean; data: Array<{ status: string; count: number }> }>("/analytics/status-breakdown"),
    categoryBreakdown: () =>
      apiFetch<{ success: boolean; data: Array<{ category: string; count: number; revenue: number }> }>("/analytics/category-breakdown"),
  },
};

// ── Shared Types ───────────────────────────────────────────────────────────────

export interface DashboardStats {
  totalBookings: number;
  todaysBookings: number;
  completedBookings: number;
  pendingBookings: number;
  cancelledBookings: number;
  assignedBookings: number;
  onTheWayBookings: number;
  totalRevenue: number;
  activeMechanics: number;
  newCustomers: { last7Days: number; last30Days: number };
}

export interface Booking {
  id: string;
  status: string;
  amount: number;
  scheduledAt: string;
  createdAt: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: number;
  vehiclePlate: string;
  customer: { id: string; name: string; email: string; phone: string };
  mechanic: { id: string; name: string; status: string } | null;
  service: { id: string; name: string; category: string };
}

export interface BookingStatusHistoryEntry {
  id: string;
  oldStatus: string | null;
  newStatus: string;
  changedAt: string;
  note: string | null;
}

export interface BookingDetail extends Booking {
  statusHistory: BookingStatusHistoryEntry[];
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface BookingsListResponse {
  success: boolean;
  bookings: Booking[];
  pagination: Pagination;
}

export interface Mechanic {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  jobsCompleted: number;
  createdAt: string;
  bookings: Array<{
    id: string;
    status: string;
    vehicleMake: string;
    vehicleModel: string;
    customer: { name: string };
    service: { name: string; category: string };
  }>;
}

export interface MechanicDetail extends Mechanic {}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  createdAt: string;
  _count: { bookings: number };
}

export interface CustomerDetail extends Omit<Customer, "_count"> {
  bookings: Array<{
    id: string;
    status: string;
    amount: number;
    scheduledAt: string;
    service: { name: string; category: string };
    mechanic: { name: string } | null;
  }>;
}

export interface CustomersListResponse {
  success: boolean;
  customers: Customer[];
  pagination: Pagination;
}
