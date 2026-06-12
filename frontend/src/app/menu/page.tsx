"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createCategory, createMenuItem, getMenu, updateMenuItem } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import type { MenuCategory } from "@/lib/types";

export default function MenuAdminPage() {
  const { isManager } = useAuth();
  const router = useRouter();
  const [menu, setMenu] = useState<MenuCategory[]>([]);
  const [categoryName, setCategoryName] = useState("");
  const [itemName, setItemName] = useState("");
  const [itemPrice, setItemPrice] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isManager) {
      router.replace("/");
      return;
    }
    load();
  }, [isManager, router]);

  function load() {
    getMenu().then(setMenu).catch((e: Error) => setError(e.message));
  }

  async function addCategory() {
    try {
      await createCategory(categoryName, menu.length + 1);
      setCategoryName("");
      setMessage("Category created.");
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed.");
    }
  }

  async function addItem() {
    try {
      await createMenuItem({
        categoryId,
        name: itemName,
        price: Number(itemPrice),
      });
      setItemName("");
      setItemPrice("");
      setMessage("Item created.");
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed.");
    }
  }

  async function toggleAvailability(itemId: string, category: MenuCategory, itemIndex: number) {
    const item = category.items[itemIndex];
    try {
      await updateMenuItem(itemId, {
        name: item.name,
        description: item.description ?? undefined,
        price: item.price,
        isAvailable: !item.isAvailable,
      });
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed.");
    }
  }

  if (!isManager) return null;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Menu Admin</h1>

      <section className="grid gap-4 rounded-2xl border bg-white p-6 md:grid-cols-2 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="space-y-2">
          <h2 className="font-semibold">New category</h2>
          <input
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            placeholder="Category name"
            className="w-full rounded-lg border px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
          />
          <button type="button" onClick={addCategory} className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white">
            Add Category
          </button>
        </div>

        <div className="space-y-2">
          <h2 className="font-semibold">New item</h2>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
          >
            <option value="">Select category</option>
            {menu.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <input
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            placeholder="Item name"
            className="w-full rounded-lg border px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
          />
          <input
            value={itemPrice}
            onChange={(e) => setItemPrice(e.target.value)}
            placeholder="Price"
            type="number"
            step="0.01"
            className="w-full rounded-lg border px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
          />
          <button type="button" onClick={addItem} className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white">
            Add Item
          </button>
        </div>
      </section>

      {message && <p className="text-sm text-green-600">{message}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {menu.map((category) => (
        <section key={category.id} className="rounded-2xl border bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-3 text-lg font-semibold">{category.name}</h2>
          <ul className="space-y-2">
            {category.items.map((item, index) => (
              <li key={item.id} className="flex items-center justify-between rounded-lg border px-4 py-3 dark:border-zinc-700">
                <span>
                  {item.name} — ${item.price.toFixed(2)}
                  {!item.isAvailable && <span className="ml-2 text-xs text-red-500">Unavailable</span>}
                </span>
                <button
                  type="button"
                  onClick={() => toggleAvailability(item.id, category, index)}
                  className="text-sm text-orange-600 hover:underline"
                >
                  {item.isAvailable ? "Mark unavailable" : "Mark available"}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
