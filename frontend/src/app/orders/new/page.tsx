"use client";

import { useEffect, useState } from "react";
import { createOrder, getMenu, getTables } from "@/lib/api";
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

  function addItem(item: { id: string; name: string; price: number }) {
    setCart((prev) => {
      const existing = prev.find((line) => line.menuItemId === item.id);
      if (existing) {
        return prev.map((line) =>
          line.menuItemId === item.id ? { ...line, quantity: line.quantity + 1 } : line,
        );
      }
      return [...prev, { menuItemId: item.id, name: item.name, price: item.price, quantity: 1 }];
    });
  }

  function updateQty(menuItemId: string, quantity: number) {
    if (quantity < 1) {
      setCart((prev) => prev.filter((line) => line.menuItemId !== menuItemId));
      return;
    }
    setCart((prev) => prev.map((line) => (line.menuItemId === menuItemId ? { ...line, quantity } : line)));
  }

  const total = cart.reduce((sum, line) => sum + line.price * line.quantity, 0);

  async function placeOrder() {
    setError(null);
    setMessage(null);

    if (cart.length === 0) {
      setError("Add at least one item.");
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
      setMessage(`Order ${order.orderNumber} sent to kitchen.`);
      setCart([]);
      setNotes("");
      setTableId("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to place order.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <p className="text-zinc-500">Loading menu...</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">New Order</h1>
        <p className="text-zinc-600">Pick order type, table (if dine-in), and menu items.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-4 rounded-2xl border bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex gap-2">
            {(["Dine-In", "Takeaway"] as const).map((label, index) => (
              <button
                key={label}
                type="button"
                onClick={() => setOrderType(index as OrderType)}
                className={`rounded-lg px-4 py-2 text-sm font-medium ${
                  orderType === index
                    ? "bg-orange-600 text-white"
                    : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {orderType === 0 && (
            <label className="block space-y-2">
              <span className="text-sm font-medium">Table</span>
              <select
                value={tableId}
                onChange={(e) => setTableId(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
              >
                <option value="">Select table</option>
                {tables.map((table) => (
                  <option key={table.id} value={table.id}>
                    Table {table.number} ({table.capacity} seats)
                  </option>
                ))}
              </select>
            </label>
          )}

          {menu.map((category) => (
            <div key={category.id}>
              <h2 className="mb-2 font-semibold">{category.name}</h2>
              <div className="space-y-2">
                {category.items
                  .filter((item) => item.isAvailable)
                  .map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => addItem(item)}
                      className="flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left hover:border-orange-300 hover:bg-orange-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
                    >
                      <span>
                        <span className="font-medium">{item.name}</span>
                        {item.description && (
                          <span className="mt-1 block text-sm text-zinc-500">{item.description}</span>
                        )}
                      </span>
                      <span className="font-semibold">${item.price.toFixed(2)}</span>
                    </button>
                  ))}
              </div>
            </div>
          ))}
        </section>

        <section className="space-y-4 rounded-2xl border bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-xl font-semibold">Cart</h2>
          {cart.length === 0 ? (
            <p className="text-sm text-zinc-500">No items yet.</p>
          ) : (
            <ul className="space-y-3">
              {cart.map((line) => (
                <li key={line.menuItemId} className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{line.name}</p>
                    <p className="text-sm text-zinc-500">${line.price.toFixed(2)} each</p>
                  </div>
                  <input
                    type="number"
                    min={1}
                    value={line.quantity}
                    onChange={(e) => updateQty(line.menuItemId, Number(e.target.value))}
                    className="w-16 rounded border px-2 py-1 text-center dark:border-zinc-700 dark:bg-zinc-950"
                  />
                </li>
              ))}
            </ul>
          )}

          <label className="block space-y-2">
            <span className="text-sm font-medium">Notes</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
              rows={3}
            />
          </label>

          <div className="flex items-center justify-between border-t pt-4 text-lg font-semibold">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {message && <p className="text-sm text-green-600">{message}</p>}

          <button
            type="button"
            onClick={placeOrder}
            disabled={submitting}
            className="w-full rounded-lg bg-orange-600 px-4 py-3 font-semibold text-white hover:bg-orange-700 disabled:opacity-50"
          >
            {submitting ? "Placing..." : "Place Order → Kitchen"}
          </button>
        </section>
      </div>
    </div>
  );
}
