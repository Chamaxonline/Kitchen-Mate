"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

const baseLinks = [
  { href: "/", label: "Dashboard" },
  { href: "/orders/new", label: "New Order" },
  { href: "/orders", label: "Active Orders" },
  { href: "/kitchen", label: "Kitchen" },
  { href: "/tables", label: "Tables" },
  { href: "/orders/history", label: "History" },
];

export function Nav() {
  const { user, logout, isManager } = useAuth();

  if (!user) return null;

  const links = isManager ? [...baseLinks, { href: "/menu", label: "Menu Admin" }] : baseLinks;

  return (
    <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4">
        <Link href="/" className="text-lg font-semibold text-orange-600">
          Kitchen Mate
        </Link>
        <div className="flex flex-wrap items-center gap-2">
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
          <div className="flex items-center gap-2 border-l border-zinc-200 pl-2 dark:border-zinc-700">
            <span className="text-xs text-zinc-500">
              {user.fullName} ({user.role})
            </span>
            <button
              type="button"
              onClick={logout}
              className="rounded-lg bg-zinc-100 px-3 py-2 text-sm font-medium hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
