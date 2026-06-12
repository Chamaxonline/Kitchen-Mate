import { getToken } from "./auth";
import type { AuthUser } from "./auth";
import type { MenuCategory, MenuItem, Order, OrderStatus, OrderType, Table } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://localhost:7067";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    cache: "no-store",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });

  if (res.status === 401 && typeof window !== "undefined") {
    window.location.href = "/login";
    throw new Error("Session expired. Please sign in again.");
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? `Request failed (${res.status})`);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export async function login(email: string, password: string): Promise<AuthUser> {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? "Login failed.");
  }

  const data = await res.json();
  return mapAuthResponse(data);
}

function mapAuthResponse(data: Record<string, string>): AuthUser {
  return {
    token: data.token,
    userId: data.userId,
    email: data.email,
    fullName: data.fullName,
    role: data.role,
    expiresAt: data.expiresAt,
    tenantId: data.tenantId,
    tenantName: data.tenantName,
    tenantSlug: data.tenantSlug,
  };
}

export async function registerTenant(body: {
  restaurantName: string;
  slug: string;
  adminEmail: string;
  adminPassword: string;
  adminFullName: string;
}): Promise<AuthUser> {
  const res = await fetch(`${API_URL}/api/tenants/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      restaurantName: body.restaurantName,
      slug: body.slug,
      adminEmail: body.adminEmail,
      adminPassword: body.adminPassword,
      adminFullName: body.adminFullName,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? "Registration failed.");
  }

  const data = await res.json();
  return mapAuthResponse(data);
}

export function getMenu() {
  return request<MenuCategory[]>("/api/menu");
}

export function getTables() {
  return request<Table[]>("/api/tables");
}

export function getOrders(params?: {
  status?: OrderStatus;
  type?: OrderType;
  tableId?: string;
  kitchenQueue?: boolean;
}) {
  const search = new URLSearchParams();
  if (params?.status !== undefined) search.set("status", String(params.status));
  if (params?.type !== undefined) search.set("type", String(params.type));
  if (params?.tableId) search.set("tableId", params.tableId);
  if (params?.kitchenQueue) search.set("kitchenQueue", "true");
  const qs = search.toString();
  return request<Order[]>(`/api/orders${qs ? `?${qs}` : ""}`);
}

export function createOrder(body: {
  type: OrderType;
  tableId?: string | null;
  notes?: string | null;
  items: { menuItemId: string; quantity: number; notes?: string | null }[];
}) {
  return request<Order>("/api/orders", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function updateOrderStatus(id: string, status: OrderStatus) {
  return request<Order>(`/api/orders/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export function createCategory(name: string, sortOrder: number) {
  return request<{ id: string; name: string; sortOrder: number }>("/api/menu/categories", {
    method: "POST",
    body: JSON.stringify({ name, sortOrder }),
  });
}

export function createMenuItem(body: {
  categoryId: string;
  name: string;
  description?: string;
  price: number;
}) {
  return request<MenuItem>("/api/menu/items", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function updateMenuItem(
  id: string,
  body: { name: string; description?: string; price: number; isAvailable: boolean },
) {
  return request<MenuItem>(`/api/menu/items/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}
