import Link from "next/link";

const cards = [
  {
    title: "New Order",
    description: "Take dine-in or takeaway orders from the menu.",
    href: "/orders/new",
    color: "border-orange-200 bg-orange-50",
  },
  {
    title: "Kitchen Board",
    description: "View and progress orders in the kitchen queue.",
    href: "/kitchen",
    color: "border-amber-200 bg-amber-50",
  },
  {
    title: "Active Orders",
    description: "Serve ready orders and complete pickups.",
    href: "/orders",
    color: "border-green-200 bg-green-50",
  },
  {
    title: "Tables",
    description: "See table availability and occupancy.",
    href: "/tables",
    color: "border-blue-200 bg-blue-50",
  },
];

export default function HomePage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">Dashboard</h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Restaurant order flow: place orders → kitchen prepares → ready to serve or pickup.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className={`rounded-2xl border p-6 shadow-sm transition hover:shadow-md ${card.color} dark:border-zinc-700 dark:bg-zinc-900`}
          >
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">{card.title}</h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{card.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
