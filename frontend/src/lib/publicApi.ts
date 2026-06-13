import type { MenuCategory, OrderItem, PaymentStatus } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://localhost:7067";

export interface GuestMenu {
  restaurantName: string;
  tableNumber: string;
  categories: MenuCategory[];
}

export interface GuestOrder {
  id: string;
  orderNumber: string;
  tableNumber: string;
  restaurantName: string;
  status: number;
  paymentStatus: PaymentStatus;
  total: number;
  estimatedCookMinutes: number;
  notes: string | null;
  items: OrderItem[];
}

export interface GuestPaymentIntent {
  clientSecret: string;
  orderId: string;
  amount: number;
  demoMode: boolean;
}

async function publicRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    cache: "no-store",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (res.status === 204) return undefined as T;

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? `Request failed (${res.status})`);
  }

  return res.json() as Promise<T>;
}

export function getGuestMenu(tenantSlug: string, tableNumber: string) {
  return publicRequest<GuestMenu>(`/api/public/${tenantSlug}/tables/${tableNumber}/menu`);
}

export function getGuestOrder(tenantSlug: string, tableNumber: string) {
  return publicRequest<GuestOrder | null>(`/api/public/${tenantSlug}/tables/${tableNumber}/order`).catch(
    (e) => {
      if (String(e).includes("204")) return null;
      throw e;
    },
  );
}

export async function fetchGuestOrder(tenantSlug: string, tableNumber: string): Promise<GuestOrder | null> {
  const res = await fetch(`${API_URL}/api/public/${tenantSlug}/tables/${tableNumber}/order`, {
    cache: "no-store",
  });
  if (res.status === 204) return null;
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? "Could not load order.");
  }
  return res.json() as Promise<GuestOrder>;
}

export function syncGuestOrder(
  tenantSlug: string,
  tableNumber: string,
  body: { items: { menuItemId: string; quantity: number }[]; notes?: string | null },
) {
  return publicRequest<GuestOrder>(`/api/public/${tenantSlug}/tables/${tableNumber}/order`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export function createGuestPayment(tenantSlug: string, tableNumber: string) {
  return publicRequest<GuestPaymentIntent>(`/api/public/${tenantSlug}/tables/${tableNumber}/order/pay`, {
    method: "POST",
  });
}

export function confirmGuestPayment(
  tenantSlug: string,
  tableNumber: string,
  paymentIntentId: string,
) {
  return publicRequest<GuestOrder>(`/api/public/${tenantSlug}/tables/${tableNumber}/order/confirm-payment`, {
    method: "POST",
    body: JSON.stringify({ paymentIntentId }),
  });
}

export function demoGuestPay(tenantSlug: string, tableNumber: string) {
  return publicRequest<GuestOrder>(`/api/public/${tenantSlug}/tables/${tableNumber}/order/demo-pay`, {
    method: "POST",
  });
}

export function guestOrderUrl(tenantSlug: string, tableNumber: string): string {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/t/${tenantSlug}/table/${tableNumber}`;
  }
  return `/t/${tenantSlug}/table/${tableNumber}`;
}
