import type { OrderStatus, TableStatus } from "@/lib/types";
import { OrderStatusLabel, TableStatusLabel } from "@/lib/types";

const orderColors: Record<OrderStatus, string> = {
  0: "bg-zinc-100 text-zinc-700",
  1: "bg-blue-100 text-blue-800",
  2: "bg-amber-100 text-amber-800",
  3: "bg-green-100 text-green-800",
  4: "bg-zinc-200 text-zinc-600",
  5: "bg-red-100 text-red-800",
};

const tableColors: Record<TableStatus, string> = {
  0: "bg-green-100 text-green-800",
  1: "bg-red-100 text-red-800",
  2: "bg-amber-100 text-amber-800",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${orderColors[status]}`}>
      {OrderStatusLabel[status]}
    </span>
  );
}

export function TableStatusBadge({ status }: { status: TableStatus }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${tableColors[status]}`}>
      {TableStatusLabel[status]}
    </span>
  );
}
