"use client";

import { useEffect, useState } from "react";
import { History } from "lucide-react";
import { getOrders } from "@/lib/api";
import { OrderStatusBadge } from "@/components/StatusBadge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingState } from "@/components/ui/LoadingState";
import { PageHeader } from "@/components/ui/PageHeader";
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

  if (loading) return <LoadingState label="Loading order history..." />;

  return (
    <div>
      <PageHeader title="Order History" description="Completed and cancelled orders for review." />

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {orders.length === 0 ? (
        <EmptyState icon={History} title="No history yet" description="Completed orders will appear here." />
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-stone-900">{order.orderNumber}</h2>
                  <p className="mt-1 text-sm text-muted">
                    {OrderTypeLabel[order.type]}
                    {order.tableNumber ? ` · Table ${order.tableNumber}` : ""} ·{" "}
                    {new Date(order.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <OrderStatusBadge status={order.status} />
                  <p className="mt-2 text-lg font-bold text-stone-900">${order.total.toFixed(2)}</p>
                </div>
              </div>
              <ul className="mt-4 space-y-1 rounded-xl bg-stone-50 p-3 text-sm">
                {order.items.map((item) => (
                  <li key={item.id}>
                    <span className="font-bold text-brand">{item.quantity}×</span> {item.menuItemName}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
