"use client";

import { useCallback, useEffect, useState } from "react";
import { getOrders, updateOrderStatus } from "@/lib/api";
import { OrderStatusBadge } from "@/components/StatusBadge";
import type { Order, OrderStatus } from "@/lib/types";
import { OrderTypeLabel } from "@/lib/types";

const activeStatuses: OrderStatus[] = [1, 2, 3];

export default function ActiveOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    Promise.all(activeStatuses.map((status) => getOrders({ status })))
      .then((groups) => setOrders(groups.flat().sort((a, b) => a.createdAt.localeCompare(b.createdAt))))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, 10000);
    return () => clearInterval(timer);
  }, [load]);

  async function complete(orderId: string) {
    try {
      await updateOrderStatus(orderId, 4);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed.");
    }
  }

  if (loading) return <p className="text-zinc-500">Loading orders...</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Active Orders</h1>
        <p className="text-zinc-600">Complete orders after serving or pickup.</p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {orders.length === 0 ? (
        <p className="rounded-2xl border bg-white p-8 text-center text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
          No active orders.
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
                    {order.tableNumber ? ` · Table ${order.tableNumber}` : ""} · ${order.total.toFixed(2)}
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

              {order.status === 3 && (
                <button
                  type="button"
                  onClick={() => complete(order.id)}
                  className="mt-4 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
                >
                  Complete Order
                </button>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
