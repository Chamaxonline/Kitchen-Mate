"use client";

import { useCallback, useEffect, useState } from "react";
import { Clock, Flame } from "lucide-react";
import { getOrders, updateOrderStatus } from "@/lib/api";
import { OrderStatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingState } from "@/components/ui/LoadingState";
import { PageHeader } from "@/components/ui/PageHeader";
import type { Order } from "@/lib/types";
import { OrderTypeLabel } from "@/lib/types";

function OrderTicket({
  order,
  onAdvance,
}: {
  order: Order;
  onAdvance: (order: Order, status: 2 | 3) => void;
}) {
  return (
    <Card className="border-l-4 border-l-brand">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-bold text-stone-900">{order.orderNumber}</h3>
          <p className="mt-1 text-sm text-muted">
            {OrderTypeLabel[order.type]}
            {order.tableNumber ? ` · Table ${order.tableNumber}` : ""}
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <ul className="mb-4 space-y-2 rounded-xl bg-stone-50 p-3 text-sm">
        {order.items.map((item) => (
          <li key={item.id} className="flex justify-between gap-2">
            <span>
              <span className="font-bold text-brand">{item.quantity}×</span> {item.menuItemName}
            </span>
          </li>
        ))}
      </ul>

      {order.notes && <p className="mb-3 text-xs italic text-muted">Note: {order.notes}</p>}

      {order.status === 1 && (
        <Button variant="warning" fullWidth onClick={() => onAdvance(order, 2)}>
          <Flame className="h-4 w-4" />
          Start cooking
        </Button>
      )}
      {order.status === 2 && (
        <Button variant="success" fullWidth onClick={() => onAdvance(order, 3)}>
          Mark ready
        </Button>
      )}
    </Card>
  );
}

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

  const newOrders = orders.filter((o) => o.status === 1);
  const cooking = orders.filter((o) => o.status === 2);

  if (loading) return <LoadingState label="Loading kitchen queue..." />;

  return (
    <div>
      <PageHeader
        title="Kitchen Board"
        description="Large-touch workflow for kitchen staff. Auto-refreshes every 10 seconds."
        action={
          <div className="flex items-center gap-2 rounded-xl bg-stone-100 px-4 py-2 text-sm text-muted">
            <Clock className="h-4 w-4" />
            Live queue
          </div>
        }
      />

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {orders.length === 0 ? (
        <EmptyState icon={Flame} title="Kitchen is clear" description="New orders will appear here as soon as waiters place them." />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <section>
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-stone-900">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100 text-sky-700">{newOrders.length}</span>
              New tickets
            </h2>
            <div className="space-y-4">
              {newOrders.length === 0 ? (
                <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted">No new tickets</p>
              ) : (
                newOrders.map((order) => <OrderTicket key={order.id} order={order} onAdvance={advance} />)
              )}
            </div>
          </section>

          <section>
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-stone-900">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-800">{cooking.length}</span>
              Cooking now
            </h2>
            <div className="space-y-4">
              {cooking.length === 0 ? (
                <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted">Nothing on the stove</p>
              ) : (
                cooking.map((order) => <OrderTicket key={order.id} order={order} onAdvance={advance} />)
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
