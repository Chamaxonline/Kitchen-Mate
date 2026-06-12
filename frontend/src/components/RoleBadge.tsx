import type { UserRole } from "@/lib/types";

const roleColors: Record<UserRole, string> = {
  Waiter: "bg-sky-100 text-sky-800 ring-sky-200",
  Kitchen: "bg-amber-100 text-amber-900 ring-amber-200",
  Manager: "bg-violet-100 text-violet-800 ring-violet-200",
  Admin: "bg-stone-200 text-stone-700 ring-stone-300",
};

export function RoleBadge({ role }: { role: UserRole }) {
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ring-1 ring-inset ${roleColors[role]}`}>
      {role}
    </span>
  );
}
