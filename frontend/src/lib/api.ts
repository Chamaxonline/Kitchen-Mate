import type { MenuCategory, Order, OrderStatus, OrderType, Table } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5257";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? `Request failed (${res.status})`);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
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
  kitchenQueue?: boolean;
}) {
  const search = new URLSearchParams();
  if (params?.status !== undefined) search.set("status", String(params.status));
  if (params?.type !== undefined) search.set("type", String(params.type));
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
