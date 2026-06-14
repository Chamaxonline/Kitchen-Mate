"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, ClipboardList, QrCode, Send } from "lucide-react";
import { getOrders, updateOrderStatus } from "@/lib/api";
import { OrderCookEta } from "@/components/CookTimeBadge";
import { OrderStatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingState } from "@/components/ui/LoadingState";
import { PageHeader } from "@/components/ui/PageHeader";
import type { Order, OrderStatus } from "@/lib/types";
import { OrderTypeLabel, PaymentStatusLabel } from "@/lib/types";

const activeStatuses: OrderStatus[] = [1, 2, 3];

export default function ActiveOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [guestAwaiting, setGuestAwaiting] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    Promise.all([
      ...activeStatuses.map((status) => getOrders({ status })),
      getOrders({ status: 0 }),
    ])
      .then((groups) => {
        const placed = groups.pop() ?? [];
        const guestPlaced = placed.filter((o) => o.isGuestOrder);
        const active = groups.flat().sort((a, b) => a.createdAt.localeCompare(b.createdAt));
        setGuestAwaiting(guestPlaced.sort((a, b) => a.createdAt.localeCompare(b.createdAt)));
        setOrders(active);
      })
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

  async function sendToKitchen(orderId: string) {
    try {
      await updateOrderStatus(orderId, 1);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed.");
    }
  }

  if (loading) return <LoadingState label="Loading active orders..." />;

  const ready = orders.filter((o) => o.status === 3);

  return (
    <div>
      <PageHeader
        title="Active Orders"
        description="Review guest QR orders, send to kitchen, and serve when ready."
        action={
          ready.length > 0 ? (
            <span className="rounded-xl bg-emerald-100 px-4 py-2 text-sm font-bold text-emerald-800">
              {ready.length} ready now
            </span>
          ) : undefined
        }
      />

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {guestAwaiting.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-stone-900">
            <QrCode className="h-5 w-5 text-brand" />
            Guest orders — send to kitchen
          </h2>
          <div className="space-y-4">
            {guestAwaiting.map((order) => (
              <Card key={order.id} className="border-brand/30 bg-brand-light/30">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-stone-900">{order.orderNumber}</h3>
                    <p className="mt-1 text-sm text-muted">
                      QR order · Table {order.tableNumber} · ${order.total.toFixed(2)} ·{" "}
                      {PaymentStatusLabel[order.paymentStatus]}
                    </p>
                  </div>
                  <OrderStatusBadge status={order.status} />
                </div>
                <ul className="mt-3 space-y-1 rounded-xl bg-white/80 p-3 text-sm">
                  {order.items.map((item) => (
                    <li key={item.id}>
                      <span className="font-bold text-brand">{item.quantity}×</span> {item.menuItemName}
                    </li>
                  ))}
                </ul>
                <Button className="mt-4" onClick={() => sendToKitchen(order.id)}>
                  <Send className="h-4 w-4" />
                  Send to kitchen
                </Button>
              </Card>
            ))}
          </div>
        </section>
      )}

      {orders.length === 0 && guestAwaiting.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No active orders" description="Orders in progress will show up here." />
      ) : orders.length > 0 ? (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card
              key={order.id}
              className={order.status === 3 ? "border-emerald-300 bg-emerald-50/40" : ""}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-stone-900">{order.orderNumber}</h2>
                  <p className="mt-1 text-sm text-muted">
                    {order.isGuestOrder ? "QR order · " : ""}
                    {OrderTypeLabel[order.type]}
                    {order.tableNumber ? ` · Table ${order.tableNumber}` : ""} · ${order.total.toFixed(2)}
                  </p>
                  {order.estimatedCookMinutes > 0 && order.status !== 3 && (
                    <div className="mt-1">
                      <OrderCookEta
                        estimatedMinutes={order.estimatedCookMinutes}
                        createdAt={order.createdAt}
                        compact
                      />
                    </div>
                  )}
                </div>
                <OrderStatusBadge status={order.status} />
              </div>

              <ul className="mt-4 space-y-1 rounded-xl bg-white/70 p-3 text-sm">
                {order.items.map((item) => (
                  <li key={item.id}>
                    <span className="font-bold text-brand">{item.quantity}×</span> {item.menuItemName}
                  </li>
                ))}
              </ul>

              {order.status === 3 && (
                <Button variant="success" className="mt-4" onClick={() => complete(order.id)}>
                  <CheckCircle2 className="h-4 w-4" />
                  Complete order
                </Button>
              )}
            </Card>
          ))}
        </div>
      ) : null}
    </div>
  );
}
