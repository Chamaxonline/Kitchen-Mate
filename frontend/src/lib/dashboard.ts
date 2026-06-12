import type { Order, Table } from "./types";

export interface DashboardStats {
  todayOrders: number;
  todayCompleted: number;
  todayRevenue: number;
  todayDineIn: number;
  todayTakeaway: number;
  todayCancelled: number;
  avgOrderValue: number;
  kitchenQueue: number;
  inKitchen: number;
  readyToServe: number;
  activeOrders: number;
  tablesOccupied: number;
  tablesAvailable: number;
  tablesReserved: number;
  tablesTotal: number;
  recentToday: Order[];
}

function isToday(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

export function buildDashboardStats(orders: Order[], tables: Table[]): DashboardStats {
  const today = orders.filter((o) => isToday(o.createdAt));
  const completedToday = today.filter((o) => o.status === 4);
  const todayRevenue = completedToday.reduce((sum, o) => sum + o.total, 0);

  const kitchenQueue = orders.filter((o) => o.status === 1).length;
  const inKitchen = orders.filter((o) => o.status === 2).length;
  const readyToServe = orders.filter((o) => o.status === 3).length;
  const activeOrders = orders.filter((o) => o.status >= 1 && o.status <= 3).length;

  const recentToday = [...today]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 6);

  return {
    todayOrders: today.length,
    todayCompleted: completedToday.length,
    todayRevenue,
    todayDineIn: today.filter((o) => o.type === 0).length,
    todayTakeaway: today.filter((o) => o.type === 1).length,
    todayCancelled: today.filter((o) => o.status === 5).length,
    avgOrderValue: completedToday.length ? todayRevenue / completedToday.length : 0,
    kitchenQueue,
    inKitchen,
    readyToServe,
    activeOrders,
    tablesOccupied: tables.filter((t) => t.status === 1).length,
    tablesAvailable: tables.filter((t) => t.status === 0).length,
    tablesReserved: tables.filter((t) => t.status === 2).length,
    tablesTotal: tables.length,
    recentToday,
  };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function todayLabel(): string {
  return new Date().toLocaleDateString([], {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}
