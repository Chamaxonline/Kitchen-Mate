"use client";

import { useEffect, useState } from "react";
import { Users, UtensilsCrossed } from "lucide-react";
import { getTables } from "@/lib/api";
import { TableStatusBadge } from "@/components/StatusBadge";
import { Card } from "@/components/ui/Card";
import { LoadingState } from "@/components/ui/LoadingState";
import { PageHeader } from "@/components/ui/PageHeader";
import type { Table, TableStatus } from "@/lib/types";
import { TableStatusLabel } from "@/lib/types";

const statusStyles: Record<TableStatus, string> = {
  0: "border-emerald-200 bg-emerald-50",
  1: "border-red-200 bg-red-50",
  2: "border-amber-200 bg-amber-50",
};

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

  if (loading) return <LoadingState label="Loading tables..." />;
  if (error) return <p className="text-sm text-red-600">{error}</p>;

  const available = tables.filter((t) => t.status === 0).length;

  return (
    <div>
      <PageHeader
        title="Tables"
        description="Quick floor overview for dine-in seating."
        action={
          <span className="rounded-xl bg-emerald-100 px-4 py-2 text-sm font-bold text-emerald-800">
            {available} available
          </span>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {tables.map((table) => (
          <Card
            key={table.id}
            className={`text-center transition hover:shadow-md ${statusStyles[table.status]}`}
          >
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm">
              <UtensilsCrossed className="h-6 w-6 text-stone-700" />
            </div>
            <p className="text-3xl font-black text-stone-900">{table.number}</p>
            <p className="mt-1 flex items-center justify-center gap-1 text-sm text-muted">
              <Users className="h-3.5 w-3.5" />
              {table.capacity} seats
            </p>
            <div className="mt-4 flex justify-center">
              <TableStatusBadge status={table.status} />
            </div>
            <p className="mt-2 text-xs text-muted">{TableStatusLabel[table.status]}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
