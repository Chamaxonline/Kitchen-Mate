"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChefHat,
  ClipboardList,
  History,
  LayoutDashboard,
  LogOut,
  PlusCircle,
  Settings2,
  UtensilsCrossed,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/orders/new", label: "New Order", icon: PlusCircle },
  { href: "/orders", label: "Active Orders", icon: ClipboardList },
  { href: "/kitchen", label: "Kitchen", icon: ChefHat },
  { href: "/tables", label: "Tables", icon: UtensilsCrossed },
  { href: "/orders/history", label: "History", icon: History },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout, isManager } = useAuth();

  if (!user) return <>{children}</>;

  const links = isManager ? [...navItems, { href: "/menu", label: "Menu Admin", icon: Settings2 }] : navItems;

  return (
    <div className="min-h-screen lg:flex">
      <aside className="sticky top-0 z-20 flex h-auto flex-col border-b border-stone-800 bg-sidebar text-stone-100 lg:h-screen lg:w-64 lg:border-b-0 lg:border-r">
        <div className="flex items-center gap-3 px-5 py-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-white shadow-lg shadow-orange-900/30">
            <ChefHat className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-bold tracking-tight">{user.tenantName || "Kitchen Mate"}</p>
            <p className="truncate text-xs text-stone-400">
              {user.tenantSlug ? `${user.tenantSlug} · ` : ""}Restaurant POS
            </p>
          </div>
        </div>

        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-1 lg:flex-col lg:overflow-visible lg:pb-0">
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== "/" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={`flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors lg:px-4 ${
                  active
                    ? "bg-brand text-white shadow-md shadow-orange-900/20"
                    : "text-stone-300 hover:bg-stone-800 hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden border-t border-stone-800 p-4 lg:block">
          <div className="mb-3 rounded-xl bg-stone-800/80 px-4 py-3">
            <p className="truncate text-sm font-semibold">{user.fullName}</p>
            <p className="text-xs text-stone-400">{user.role}</p>
          </div>
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-stone-700 px-4 py-2.5 text-sm font-medium text-stone-300 transition hover:bg-stone-800 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="flex items-center justify-between border-b border-border bg-surface/80 px-4 py-3 backdrop-blur lg:hidden">
          <p className="font-semibold text-stone-900">{user.fullName}</p>
          <button type="button" onClick={logout} className="text-sm font-medium text-brand">
            Sign out
          </button>
        </header>
        <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
