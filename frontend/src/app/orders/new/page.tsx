"use client";

import { useEffect, useState } from "react";
import { Minus, Plus, ShoppingBag, Utensils } from "lucide-react";
import { createOrder, getMenu, getTables } from "@/lib/api";
import { CookTimeBadge } from "@/components/CookTimeBadge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { LoadingState } from "@/components/ui/LoadingState";
import { PageHeader } from "@/components/ui/PageHeader";
import { estimateOrderCookMinutes, formatCookTime } from "@/lib/cookTime";
import type { CartLine, MenuCategory, OrderType, Table } from "@/lib/types";

export default function NewOrderPage() {
  const [menu, setMenu] = useState<MenuCategory[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [orderType, setOrderType] = useState<OrderType>(0);
  const [tableId, setTableId] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getMenu(), getTables()])
      .then(([menuData, tableData]) => {
        setMenu(menuData);
        setTables(tableData.filter((t) => t.status === 0));
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  function addItem(item: { id: string; name: string; price: number; cookTimeMinutes: number }) {
    setCart((prev) => {
      const existing = prev.find((line) => line.menuItemId === item.id);
      if (existing) {
        return prev.map((line) =>
          line.menuItemId === item.id ? { ...line, quantity: line.quantity + 1 } : line,
        );
      }
      return [
        ...prev,
        {
          menuItemId: item.id,
          name: item.name,
          price: item.price,
          cookTimeMinutes: item.cookTimeMinutes,
          quantity: 1,
        },
      ];
    });
  }

  const total = cart.reduce((sum, line) => sum + line.price * line.quantity, 0);
  const estCookMinutes = estimateOrderCookMinutes(cart);

  function updateQty(menuItemId: string, delta: number) {
    setCart((prev) =>
      prev
        .map((line) =>
          line.menuItemId === menuItemId ? { ...line, quantity: line.quantity + delta } : line,
        )
        .filter((line) => line.quantity > 0),
    );
  }

  async function placeOrder() {
    setError(null);
    setMessage(null);

    if (cart.length === 0) {
      setError("Add at least one item to the order.");
      return;
    }
    if (orderType === 0 && !tableId) {
      setError("Select a table for dine-in orders.");
      return;
    }

    setSubmitting(true);
    try {
      const order = await createOrder({
        type: orderType,
        tableId: orderType === 0 ? tableId : null,
        notes: notes || null,
        items: cart.map((line) => ({ menuItemId: line.menuItemId, quantity: line.quantity })),
      });
      setMessage(`Order ${order.orderNumber} sent to kitchen (~${formatCookTime(order.estimatedCookMinutes)}).`);
      setCart([]);
      setNotes("");
      setTableId("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to place order.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <LoadingState label="Loading menu..." />;

  return (
    <div>
      <PageHeader title="New Order" description="Tap items to add them. Review the cart, then send to kitchen." />

      <div className="grid gap-6 xl:grid-cols-5">
        <div className="space-y-4 xl:col-span-3">
          <Card>
            <div className="grid grid-cols-2 gap-3">
              {(["Dine-In", "Takeaway"] as const).map((label, index) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setOrderType(index as OrderType)}
                  className={`flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-4 text-sm font-bold transition ${
                    orderType === index
                      ? "border-brand bg-brand-light text-brand"
                      : "border-border bg-stone-50 text-stone-600 hover:border-stone-300"
                  }`}
                >
                  {index === 0 ? <Utensils className="h-4 w-4" /> : <ShoppingBag className="h-4 w-4" />}
                  {label}
                </button>
              ))}
            </div>

            {orderType === 0 && (
              <label className="mt-4 block space-y-2">
                <span className="text-sm font-semibold text-stone-700">Table</span>
                <select
                  value={tableId}
                  onChange={(e) => setTableId(e.target.value)}
                  className="w-full rounded-xl border border-border bg-stone-50 px-4 py-3 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                >
                  <option value="">Select an available table</option>
                  {tables.map((table) => (
                    <option key={table.id} value={table.id}>
                      Table {table.number} · {table.capacity} seats
                    </option>
                  ))}
                </select>
              </label>
            )}
          </Card>

          {menu.map((category) => (
            <Card key={category.id}>
              <h2 className="mb-4 text-lg font-bold text-stone-900">{category.name}</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {category.items
                  .filter((item) => item.isAvailable)
                  .map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => addItem(item)}
                      className="rounded-xl border border-border bg-stone-50 p-4 text-left transition hover:border-brand hover:bg-brand-light"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-semibold text-stone-900">{item.name}</span>
                        <span className="shrink-0 rounded-lg bg-white px-2 py-1 text-sm font-bold text-brand">
                          ${item.price.toFixed(2)}
                        </span>
                      </div>
                      {item.description && <p className="mt-1 text-xs text-muted">{item.description}</p>}
                      <div className="mt-2">
                        <CookTimeBadge minutes={item.cookTimeMinutes} />
                      </div>
                    </button>
                  ))}
              </div>
            </Card>
          ))}
        </div>

        <Card className="sticky top-6 h-fit xl:col-span-2">
          <h2 className="mb-4 text-xl font-bold text-stone-900">Order summary</h2>

          {cart.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted">
              Tap menu items to build the order
            </p>
          ) : (
            <ul className="space-y-3">
              {cart.map((line) => (
                <li key={line.menuItemId} className="flex items-center justify-between gap-3 rounded-xl bg-stone-50 p-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-stone-900">{line.name}</p>
                    <p className="text-xs text-muted">
                      ${line.price.toFixed(2)} each · {formatCookTime(line.cookTimeMinutes)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => updateQty(line.menuItemId, -1)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-stone-700 shadow-sm"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-6 text-center font-bold">{line.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateQty(line.menuItemId, 1)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-white shadow-sm"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <label className="mt-4 block space-y-2">
            <span className="text-sm font-semibold text-stone-700">Special notes</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl border border-border bg-stone-50 px-4 py-3 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              rows={3}
              placeholder="Allergies, spice level, etc."
            />
          </label>

          {estCookMinutes > 0 && cart.length > 0 && (
            <div className="mt-3 flex items-center justify-between rounded-xl bg-amber-50 px-4 py-3 text-sm">
              <span className="font-medium text-amber-900">Est. kitchen time</span>
              <span className="font-bold text-amber-900">{formatCookTime(estCookMinutes)}</span>
            </div>
          )}

          <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
            <span className="text-muted">Total</span>
            <span className="text-2xl font-bold text-stone-900">${total.toFixed(2)}</span>
          </div>

          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          {message && (
            <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {message}
            </div>
          )}

          <Button className="mt-4" onClick={placeOrder} disabled={submitting} fullWidth size="lg">
            {submitting ? "Sending..." : "Send to kitchen"}
          </Button>
        </Card>
      </div>
    </div>
  );
}
