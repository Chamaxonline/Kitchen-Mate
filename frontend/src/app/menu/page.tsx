"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Settings2, Clock } from "lucide-react";
import { createCategory, createMenuItem, getMenu, updateMenuItem } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { CookTimeBadge } from "@/components/CookTimeBadge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import type { MenuCategory } from "@/lib/types";

export default function MenuAdminPage() {
  const { isManager } = useAuth();
  const router = useRouter();
  const [menu, setMenu] = useState<MenuCategory[]>([]);
  const [categoryName, setCategoryName] = useState("");
  const [itemName, setItemName] = useState("");
  const [itemPrice, setItemPrice] = useState("");
  const [itemCookTime, setItemCookTime] = useState("10");
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
        cookTimeMinutes: Number(itemCookTime) || 10,
      });
      setItemName("");
      setItemPrice("");
      setItemCookTime("10");
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
        cookTimeMinutes: item.cookTimeMinutes,
        isAvailable: !item.isAvailable,
      });
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed.");
    }
  }

  if (!isManager) return null;

  return (
    <div>
      <PageHeader title="Menu Admin" description="Manage categories, items, and availability for managers." />

      <Card className="mb-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-3">
            <h2 className="flex items-center gap-2 font-bold text-stone-900">
              <Plus className="h-4 w-4 text-brand" />
              New category
            </h2>
            <input
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              placeholder="e.g. Desserts"
              className="w-full rounded-xl border border-border bg-stone-50 px-4 py-3 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
            <Button onClick={addCategory}>Add category</Button>
          </div>

          <div className="space-y-3">
            <h2 className="flex items-center gap-2 font-bold text-stone-900">
              <Settings2 className="h-4 w-4 text-brand" />
              New item
            </h2>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full rounded-xl border border-border bg-stone-50 px-4 py-3 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
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
              className="w-full rounded-xl border border-border bg-stone-50 px-4 py-3 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
            <input
              value={itemPrice}
              onChange={(e) => setItemPrice(e.target.value)}
              placeholder="Price"
              type="number"
              step="0.01"
              className="w-full rounded-xl border border-border bg-stone-50 px-4 py-3 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
            <label className="block space-y-2">
              <span className="flex items-center gap-1.5 text-sm font-semibold text-stone-700">
                <Clock className="h-4 w-4" />
                Cook time (minutes)
              </span>
              <input
                value={itemCookTime}
                onChange={(e) => setItemCookTime(e.target.value)}
                placeholder="10"
                type="number"
                min={1}
                max={240}
                className="w-full rounded-xl border border-border bg-stone-50 px-4 py-3 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
            </label>
            <Button onClick={addItem}>Add item</Button>
          </div>
        </div>
      </Card>

      {message && (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</div>
      )}
      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="space-y-4">
        {menu.map((category) => (
          <Card key={category.id}>
            <h2 className="mb-4 text-lg font-bold text-stone-900">{category.name}</h2>
            <ul className="space-y-2">
              {category.items.map((item, index) => (
                <li
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-stone-50 px-4 py-3"
                >
                  <span className="font-medium text-stone-900">
                    {item.name}
                    <span className="ml-2 font-bold text-brand">${item.price.toFixed(2)}</span>
                    <span className="ml-2">
                      <CookTimeBadge minutes={item.cookTimeMinutes} />
                    </span>
                    {!item.isAvailable && (
                      <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700">
                        Unavailable
                      </span>
                    )}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleAvailability(item.id, category, index)}
                  >
                    {item.isAvailable ? "Mark unavailable" : "Mark available"}
                  </Button>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </div>
  );
}
