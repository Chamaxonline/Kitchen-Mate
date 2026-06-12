import type { Order, Table } from "./types";

export interface DashboardStats {
  todayOrders: number;
  todayCompleted: number;
  todayRevenue: number;
  todayOpenValue: number;
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

function localDateKey(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-CA");
}

function isToday(iso: string): boolean {
  return localDateKey(iso) === localDateKey(new Date());
}

function completedToday(order: Order): boolean {
  if (order.status !== 4) return false;
  const completedAt = order.updatedAt ?? order.createdAt;
  return isToday(completedAt);
}

export function buildDashboardStats(orders: Order[], tables: Table[]): DashboardStats {
  const today = orders.filter((o) => isToday(o.createdAt));
  const completedTodayOrders = orders.filter(completedToday);
  const todayRevenue = completedTodayOrders.reduce((sum, o) => sum + o.total, 0);
  const todayOpenValue = today
    .filter((o) => o.status >= 1 && o.status <= 3)
    .reduce((sum, o) => sum + o.total, 0);

  const kitchenQueue = orders.filter((o) => o.status === 1).length;
  const inKitchen = orders.filter((o) => o.status === 2).length;
  const readyToServe = orders.filter((o) => o.status === 3).length;
  const activeOrders = orders.filter((o) => o.status >= 1 && o.status <= 3).length;

  const recentToday = [...today]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 6);

  return {
    todayOrders: today.length,
    todayCompleted: completedTodayOrders.length,
    todayRevenue,
    todayOpenValue,
    todayDineIn: today.filter((o) => o.type === 0).length,
    todayTakeaway: today.filter((o) => o.type === 1).length,
    todayCancelled: today.filter((o) => o.status === 5 && isToday(o.updatedAt ?? o.createdAt)).length,
    avgOrderValue: completedTodayOrders.length ? todayRevenue / completedTodayOrders.length : 0,
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
