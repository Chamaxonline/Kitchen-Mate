"use client";

import { useEffect, useState } from "react";
import { getOrders } from "@/lib/api";
import { OrderStatusBadge } from "@/components/StatusBadge";
import type { Order } from "@/lib/types";
import { OrderTypeLabel } from "@/lib/types";

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getOrders({ status: 4 })
      .then((completed) =>
        getOrders({ status: 5 }).then((cancelled) => {
          const all = [...completed, ...cancelled].sort(
            (a, b) => b.createdAt.localeCompare(a.createdAt),
          );
          setOrders(all);
        }),
      )
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-zinc-500">Loading history...</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Order History</h1>
        <p className="text-zinc-600">Completed and cancelled orders.</p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {orders.length === 0 ? (
        <p className="rounded-2xl border bg-white p-8 text-center text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
          No historical orders yet.
        </p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <article key={order.id} className="rounded-2xl border bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">{order.orderNumber}</h2>
                  <p className="text-sm text-zinc-500">
                    {OrderTypeLabel[order.type]}
                    {order.tableNumber ? ` · Table ${order.tableNumber}` : ""} ·{" "}
                    {new Date(order.createdAt).toLocaleString()} · ${order.total.toFixed(2)}
                  </p>
                </div>
                <OrderStatusBadge status={order.status} />
              </div>
              <ul className="mt-3 space-y-1 text-sm">
                {order.items.map((item) => (
                  <li key={item.id}>
                    {item.quantity}× {item.menuItemName}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
