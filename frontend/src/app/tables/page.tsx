"use client";

import { useEffect, useState } from "react";
import { getTables } from "@/lib/api";
import { TableStatusBadge } from "@/components/StatusBadge";
import type { Table } from "@/lib/types";

export default function TablesPage() {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getTables()
      .then(setTables)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-zinc-500">Loading tables...</p>;
  if (error) return <p className="text-sm text-red-600">{error}</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Tables</h1>
        <p className="text-zinc-600">Dine-in table availability.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tables.map((table) => (
          <article
            key={table.id}
            className="rounded-2xl border bg-white p-6 text-center dark:border-zinc-800 dark:bg-zinc-900"
          >
            <p className="text-3xl font-bold">Table {table.number}</p>
            <p className="mt-1 text-sm text-zinc-500">{table.capacity} seats</p>
            <div className="mt-4 flex justify-center">
              <TableStatusBadge status={table.status} />
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
