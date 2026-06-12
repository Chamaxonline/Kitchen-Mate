"use client";

import { useCallback, useEffect, useState } from "react";
import { getOrders, updateOrderStatus } from "@/lib/api";
import { OrderStatusBadge } from "@/components/StatusBadge";
import type { Order } from "@/lib/types";
import { OrderTypeLabel } from "@/lib/types";

export default function KitchenPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    getOrders({ kitchenQueue: true })
      .then(setOrders)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, 10000);
    return () => clearInterval(timer);
  }, [load]);

  async function advance(order: Order, status: 2 | 3) {
    try {
      await updateOrderStatus(order.id, status);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed.");
    }
  }

  if (loading) return <p className="text-zinc-500">Loading kitchen queue...</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Kitchen Board</h1>
        <p className="text-zinc-600">Orders waiting or in progress. Refreshes every 10 seconds.</p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {orders.length === 0 ? (
        <p className="rounded-2xl border bg-white p-8 text-center text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
          No orders in the kitchen queue.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {orders.map((order) => (
            <article key={order.id} className="rounded-2xl border bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">{order.orderNumber}</h2>
                  <p className="text-sm text-zinc-500">
                    {OrderTypeLabel[order.type]}
                    {order.tableNumber ? ` · Table ${order.tableNumber}` : ""}
                  </p>
                </div>
                <OrderStatusBadge status={order.status} />
              </div>

              <ul className="mb-4 space-y-1 text-sm">
                {order.items.map((item) => (
                  <li key={item.id}>
                    {item.quantity}× {item.menuItemName}
                  </li>
                ))}
              </ul>

              <div className="flex gap-2">
                {order.status === 1 && (
                  <button
                    type="button"
                    onClick={() => advance(order, 2)}
                    className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600"
                  >
                    Start Cooking
                  </button>
                )}
                {order.status === 2 && (
                  <button
                    type="button"
                    onClick={() => advance(order, 3)}
                    className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
                  >
                    Mark Ready
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
