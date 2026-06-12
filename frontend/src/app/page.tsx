"use client";

import Link from "next/link";
import { ChefHat, ClipboardList, PlusCircle, UtensilsCrossed } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";

const cards = [
  {
    title: "New Order",
    description: "Take dine-in or takeaway orders quickly from the menu.",
    href: "/orders/new",
    icon: PlusCircle,
    accent: "from-orange-500 to-amber-500",
  },
  {
    title: "Kitchen Board",
    description: "Track orders from new ticket to ready to serve.",
    href: "/kitchen",
    icon: ChefHat,
    accent: "from-amber-500 to-yellow-500",
  },
  {
    title: "Active Orders",
    description: "Serve ready dine-in meals and hand off takeaway pickups.",
    href: "/orders",
    icon: ClipboardList,
    accent: "from-emerald-500 to-teal-500",
  },
  {
    title: "Tables",
    description: "See which tables are free, occupied, or reserved.",
    href: "/tables",
    icon: UtensilsCrossed,
    accent: "from-sky-500 to-blue-500",
  },
];

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${user?.fullName?.split(" ").slice(-1)[0] ?? "there"}`}
        description="Place orders, run the kitchen, and keep service moving — all in one place."
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        {[
          { label: "Your role", value: user?.role ?? "—" },
          { label: "Workflow", value: "Order → Kitchen → Serve" },
          { label: "Tip", value: "Kitchen board auto-refreshes" },
        ].map((item) => (
          <Card key={item.label} className="!py-4">
            <p className="text-xs font-bold uppercase tracking-wider text-muted">{item.label}</p>
            <p className="mt-1 text-lg font-semibold text-stone-900">{item.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        {cards.map((card) => (
          <Link key={card.href} href={card.href} className="group">
            <Card className="h-full transition duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-stone-200/80">
              <div className={`mb-4 inline-flex rounded-xl bg-gradient-to-br ${card.accent} p-3 text-white shadow-md`}>
                <card.icon className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold text-stone-900 group-hover:text-brand">{card.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">{card.description}</p>
              <p className="mt-4 text-sm font-semibold text-brand">Open →</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
