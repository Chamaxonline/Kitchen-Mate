"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowRight,
  ChefHat,
  ClipboardList,
  DollarSign,
  PlusCircle,
  Receipt,
  TrendingUp,
  UtensilsCrossed,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getOrders, getTables } from "@/lib/api";
import {
  buildDashboardStats,
  formatCurrency,
  formatTime,
  todayLabel,
  type DashboardStats,
} from "@/lib/dashboard";
import { OrderStatusBadge } from "@/components/StatusBadge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingState } from "@/components/ui/LoadingState";
import { PageHeader } from "@/components/ui/PageHeader";
import { OrderTypeLabel } from "@/lib/types";

const quickLinks = [
  {
    title: "New Order",
    description: "Take dine-in or takeaway orders.",
    href: "/orders/new",
    icon: PlusCircle,
    accent: "from-orange-500 to-amber-500",
  },
  {
    title: "Kitchen Board",
    description: "Track tickets from new to ready.",
    href: "/kitchen",
    icon: ChefHat,
    accent: "from-amber-500 to-yellow-500",
  },
  {
    title: "Active Orders",
    description: "Serve ready meals and pickups.",
    href: "/orders",
    icon: ClipboardList,
    accent: "from-emerald-500 to-teal-500",
  },
  {
    title: "Tables",
    description: "Free, occupied, and reserved tables.",
    href: "/tables",
    icon: UtensilsCrossed,
    accent: "from-sky-500 to-blue-500",
  },
];

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
}) {
  return (
    <Card className="!py-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-muted">{label}</p>
          <p className="mt-1 text-2xl font-bold text-stone-900">{value}</p>
          {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
        </div>
        <div className={`rounded-xl bg-gradient-to-br ${accent} p-2.5 text-white shadow-md`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}

function PipelineBar({ stats }: { stats: DashboardStats }) {
  const segments = [
    { label: "Queued", count: stats.kitchenQueue, color: "bg-sky-500" },
    { label: "Cooking", count: stats.inKitchen, color: "bg-amber-500" },
    { label: "Ready", count: stats.readyToServe, color: "bg-emerald-500" },
  ];
  const total = segments.reduce((sum, s) => sum + s.count, 0) || 1;

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-stone-900">Kitchen pipeline</h2>
          <p className="text-sm text-muted">{stats.activeOrders} active orders right now</p>
        </div>
        <Link href="/kitchen" className="text-sm font-semibold text-brand hover:underline">
          Open board →
        </Link>
      </div>

      <div className="mb-4 flex h-3 overflow-hidden rounded-full bg-stone-100">
        {segments.map((seg) =>
          seg.count > 0 ? (
            <div
              key={seg.label}
              className={`${seg.color} transition-all`}
              style={{ width: `${(seg.count / total) * 100}%` }}
              title={`${seg.label}: ${seg.count}`}
            />
          ) : null,
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        {segments.map((seg) => (
          <div key={seg.label} className="rounded-xl bg-stone-50 px-3 py-2 text-center">
            <p className="text-xs font-bold uppercase tracking-wider text-muted">{seg.label}</p>
            <p className="mt-0.5 text-xl font-bold text-stone-900">{seg.count}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

export default function HomePage() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const load = useCallback(() => {
    Promise.all([
      getOrders(),
      getTables(),
    ])
      .then(([orders, tables]) => {
        setStats(buildDashboardStats(orders, tables));
        setLastUpdated(new Date());
        setError(null);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (pathname !== "/") return;

    load();
    const timer = setInterval(load, 10000);

    function onVisible() {
      if (document.visibilityState === "visible") load();
    }

    window.addEventListener("focus", load);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", load);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [pathname, load]);

  if (loading) return <LoadingState label="Loading today's overview..." />;

  const firstName = user?.fullName?.split(" ")[0] ?? "there";

  return (
    <div>
      <PageHeader
        title={`Good day, ${firstName}`}
        description={
          lastUpdated
            ? `${todayLabel()} · Updated ${formatTime(lastUpdated.toISOString())}`
            : todayLabel()
        }
        action={
          stats && stats.readyToServe > 0 ? (
            <Link
              href="/orders"
              className="rounded-xl bg-emerald-100 px-4 py-2 text-sm font-bold text-emerald-800 transition hover:bg-emerald-200"
            >
              {stats.readyToServe} ready to serve
            </Link>
          ) : undefined
        }
      />

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {stats && (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Orders today"
              value={String(stats.todayOrders)}
              hint={`${stats.todayCompleted} completed · ${stats.todayDineIn} dine-in · ${stats.todayTakeaway} takeaway`}
              icon={Receipt}
              accent="from-orange-500 to-amber-500"
            />
            <StatCard
              label="Revenue today"
              value={formatCurrency(stats.todayRevenue)}
              hint={
                stats.todayCompleted > 0
                  ? `${stats.todayCompleted} completed · avg ${formatCurrency(stats.avgOrderValue)}`
                  : stats.todayOpenValue > 0
                    ? `${formatCurrency(stats.todayOpenValue)} in open orders`
                    : "Completes when orders are marked done"
              }
              icon={DollarSign}
              accent="from-emerald-500 to-teal-500"
            />
            <StatCard
              label="Tables in use"
              value={`${stats.tablesOccupied} / ${stats.tablesTotal}`}
              hint={`${stats.tablesAvailable} free · ${stats.tablesReserved} reserved`}
              icon={UtensilsCrossed}
              accent="from-sky-500 to-blue-500"
            />
            <StatCard
              label="Service load"
              value={String(stats.activeOrders)}
              hint={
                stats.readyToServe > 0
                  ? `${stats.readyToServe} waiting to be served`
                  : "No orders waiting on the floor"
              }
              icon={TrendingUp}
              accent="from-violet-500 to-purple-500"
            />
          </div>

          <div className="mb-8 grid gap-5 lg:grid-cols-2">
            <PipelineBar stats={stats} />

            <Card>
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-stone-900">Orders today</h2>
                  <p className="text-sm text-muted">Latest orders placed today</p>
                </div>
                <Link href="/orders/history" className="text-sm font-semibold text-brand hover:underline">
                  Full history →
                </Link>
              </div>

              {stats.recentToday.length === 0 ? (
                <EmptyState
                  icon={Receipt}
                  title="No orders yet today"
                  description="New orders will appear here as they come in."
                />
              ) : (
                <ul className="divide-y divide-border">
                  {stats.recentToday.map((order) => (
                    <li key={order.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                      <div className="min-w-0">
                        <p className="font-semibold text-stone-900">{order.orderNumber}</p>
                        <p className="truncate text-sm text-muted">
                          {OrderTypeLabel[order.type]}
                          {order.tableNumber ? ` · Table ${order.tableNumber}` : ""} · {formatTime(order.createdAt)}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <span className="text-sm font-bold text-stone-900">{formatCurrency(order.total)}</span>
                        <OrderStatusBadge status={order.status} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              {stats.todayCancelled > 0 && (
                <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
                  {stats.todayCancelled} cancelled order{stats.todayCancelled === 1 ? "" : "s"} today
                </p>
              )}
            </Card>
          </div>
        </>
      )}

      <div>
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-muted">Quick actions</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {quickLinks.map((card) => (
            <Link key={card.href} href={card.href} className="group">
              <Card className="h-full transition duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-stone-200/80">
                <div className="flex items-start gap-4">
                  <div className={`shrink-0 rounded-xl bg-gradient-to-br ${card.accent} p-3 text-white shadow-md`}>
                    <card.icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-stone-900 group-hover:text-brand">{card.title}</h3>
                    <p className="mt-1 text-sm text-muted">{card.description}</p>
                    <p className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-brand">
                      Open <ArrowRight className="h-3.5 w-3.5" />
                    </p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
