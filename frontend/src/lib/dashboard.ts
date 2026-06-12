import { formatTime as formatTimeFromDate, isToday, localDateKey, parseApiDate } from "./dates";
import type { Order, Table } from "./types";

const HOURS_24_MS = 24 * 60 * 60 * 1000;

export interface DashboardStats {
  todayOrders: number;
  todayCompleted: number;
  todayRevenue: number;
  todayOpenValue: number;
  todayDineIn: number;
  todayTakeaway: number;
  todayCancelled: number;
  avgOrderValue: number;
  last24hOrders: number;
  last24hRevenue: number;
  last24hCompleted: number;
  kitchenQueue: number;
  inKitchen: number;
  readyToServe: number;
  activeOrders: number;
  tablesOccupied: number;
  tablesAvailable: number;
  tablesReserved: number;
  tablesTotal: number;
  recentToday: Order[];
  recentOrders: Order[];
}

function isWithinLast24Hours(iso: string): boolean {
  return Date.now() - parseApiDate(iso).getTime() <= HOURS_24_MS;
}

function completedWithinLast24Hours(order: Order): boolean {
  if (order.status !== 4) return false;
  const completedAt = order.updatedAt ?? order.createdAt;
  return isWithinLast24Hours(completedAt);
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

  const last24h = orders.filter((o) => isWithinLast24Hours(o.createdAt));
  const completedLast24h = orders.filter(completedWithinLast24Hours);
  const last24hRevenue = completedLast24h.reduce((sum, o) => sum + o.total, 0);

  const recentToday = [...today]
    .sort((a, b) => parseApiDate(b.createdAt).getTime() - parseApiDate(a.createdAt).getTime())
    .slice(0, 6);

  const recentOrders = [...last24h]
    .sort((a, b) => parseApiDate(b.createdAt).getTime() - parseApiDate(a.createdAt).getTime())
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
    last24hOrders: last24h.length,
    last24hRevenue,
    last24hCompleted: completedLast24h.length,
    kitchenQueue,
    inKitchen,
    readyToServe,
    activeOrders,
    tablesOccupied: tables.filter((t) => t.status === 1).length,
    tablesAvailable: tables.filter((t) => t.status === 0).length,
    tablesReserved: tables.filter((t) => t.status === 2).length,
    tablesTotal: tables.length,
    recentToday,
    recentOrders,
  };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

export { formatTimeFromDate as formatTime };

export function todayLabel(): string {
  return new Date().toLocaleDateString([], {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function todayDateKey(): string {
  return localDateKey(new Date());
}
