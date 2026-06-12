import Link from "next/link";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/orders/new", label: "New Order" },
  { href: "/orders", label: "Active Orders" },
  { href: "/kitchen", label: "Kitchen" },
  { href: "/tables", label: "Tables" },
];

export function Nav() {
  return (
    <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
        <Link href="/" className="text-lg font-semibold text-orange-600">
          Kitchen Mate
        </Link>
        <nav className="flex flex-wrap gap-2">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-orange-50 hover:text-orange-700 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-orange-400"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
