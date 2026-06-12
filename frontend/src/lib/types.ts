export type OrderType = 0 | 1;
export type OrderStatus = 0 | 1 | 2 | 3 | 4 | 5;
export type TableStatus = 0 | 1 | 2;

export const OrderTypeLabel: Record<OrderType, string> = {
  0: "Dine-In",
  1: "Takeaway",
};

export const OrderStatusLabel: Record<OrderStatus, string> = {
  0: "Placed",
  1: "Sent to Kitchen",
  2: "In Kitchen",
  3: "Ready",
  4: "Completed",
  5: "Cancelled",
};

export const TableStatusLabel: Record<TableStatus, string> = {
  0: "Available",
  1: "Occupied",
  2: "Reserved",
};

export interface MenuItem {
  id: string;
  categoryId: string;
  name: string;
  description: string | null;
  price: number;
  isAvailable: boolean;
}

export interface MenuCategory {
  id: string;
  name: string;
  sortOrder: number;
  items: MenuItem[];
}

export interface Table {
  id: string;
  number: string;
  capacity: number;
  status: TableStatus;
}

export interface OrderItem {
  id: string;
  menuItemId: string;
  menuItemName: string;
  quantity: number;
  unitPrice: number;
  notes: string | null;
  lineTotal: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  type: OrderType;
  status: OrderStatus;
  tableId: string | null;
  tableNumber: string | null;
  notes: string | null;
  total: number;
  createdAt: string;
  updatedAt: string | null;
  items: OrderItem[];
}

export type UserRole = "Waiter" | "Kitchen" | "Manager" | "Admin";

export interface TeamUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
}

export interface CartLine {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
}
