import type { OrderStatus, TableStatus } from "@/lib/types";
import { OrderStatusLabel, TableStatusLabel } from "@/lib/types";

const orderColors: Record<OrderStatus, string> = {
  0: "bg-stone-100 text-stone-700 ring-stone-200",
  1: "bg-sky-100 text-sky-800 ring-sky-200",
  2: "bg-amber-100 text-amber-900 ring-amber-200",
  3: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  4: "bg-stone-200 text-stone-600 ring-stone-300",
  5: "bg-red-100 text-red-800 ring-red-200",
};

const tableColors: Record<TableStatus, string> = {
  0: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  1: "bg-red-100 text-red-800 ring-red-200",
  2: "bg-amber-100 text-amber-900 ring-amber-200",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ring-1 ring-inset ${orderColors[status]}`}>
      {OrderStatusLabel[status]}
    </span>
  );
}

export function TableStatusBadge({ status }: { status: TableStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ring-1 ring-inset ${tableColors[status]}`}>
      {TableStatusLabel[status]}
    </span>
  );
}
