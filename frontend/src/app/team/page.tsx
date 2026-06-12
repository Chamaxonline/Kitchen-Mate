"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, User, UserPlus, Users } from "lucide-react";
import { createTeamUser, getTeamUsers } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { RoleBadge } from "@/components/RoleBadge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingState } from "@/components/ui/LoadingState";
import { PageHeader } from "@/components/ui/PageHeader";
import type { TeamUser, UserRole } from "@/lib/types";

const roleOptions: { value: UserRole; label: string; hint: string }[] = [
  { value: "Waiter", label: "Waiter", hint: "Take orders and serve tables" },
  { value: "Kitchen", label: "Kitchen", hint: "Prepare food and update order status" },
  { value: "Manager", label: "Manager", hint: "Manage menu, tables, and staff" },
  { value: "Admin", label: "Admin", hint: "Full access including team management" },
];

export default function TeamPage() {
  const { user, isManager, isAdmin } = useAuth();
  const router = useRouter();
  const [members, setMembers] = useState<TeamUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("Waiter");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const assignableRoles = isAdmin
    ? roleOptions
    : roleOptions.filter((r) => r.value === "Waiter" || r.value === "Kitchen");

  function load() {
    getTeamUsers()
      .then(setMembers)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (!isManager) {
      router.replace("/");
      return;
    }
    load();
  }, [isManager, router]);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setSubmitting(true);
    try {
      const invitedName = fullName;
      const invitedRole = role;
      await createTeamUser({ fullName, email, password, role });
      setFullName("");
      setEmail("");
      setPassword("");
      setRole("Waiter");
      setMessage(`${invitedName || email} invited as ${invitedRole}. They can sign in at the login page.`);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to invite user.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!isManager) return null;
  if (loading) return <LoadingState label="Loading team..." />;

  return (
    <div>
      <PageHeader
        title="Team"
        description="Invite staff to your restaurant. Each person signs in with their own email."
      />

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}
      {message && (
        <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {message}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-xl bg-brand-light p-2.5 text-brand">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-stone-900">Invite team member</h2>
              <p className="text-sm text-muted">Share login details with your new hire</p>
            </div>
          </div>

          <form onSubmit={handleInvite} className="space-y-4">
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-stone-700">Full name</span>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Maria Santos"
                  className="w-full rounded-xl border border-border bg-stone-50 py-3 pl-10 pr-4 text-stone-900 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
                  required
                />
              </div>
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-semibold text-stone-700">Email</span>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="maria@restaurant.com"
                  className="w-full rounded-xl border border-border bg-stone-50 py-3 pl-10 pr-4 text-stone-900 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
                  required
                />
              </div>
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-semibold text-stone-700">Temporary password</span>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password123!"
                  className="w-full rounded-xl border border-border bg-stone-50 py-3 pl-10 pr-4 font-mono text-sm text-stone-900 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
                  required
                  minLength={8}
                />
              </div>
              <p className="text-xs text-muted">At least 8 chars with upper, lower, and a number</p>
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-semibold text-stone-700">Role</span>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full rounded-xl border border-border bg-stone-50 px-4 py-3 text-stone-900 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
              >
                {assignableRoles.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label} — {opt.hint}
                  </option>
                ))}
              </select>
            </label>

            <Button type="submit" disabled={submitting} fullWidth>
              {submitting ? "Inviting..." : "Invite team member"}
            </Button>
          </form>
        </Card>

        <div>
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-muted">
            {members.length} team member{members.length === 1 ? "" : "s"}
          </h2>

          {members.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No team members yet"
              description="Invite your first waiter or kitchen staff member."
            />
          ) : (
            <div className="space-y-3">
              {members.map((member) => (
                <Card key={member.id} className="!py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-stone-900">
                        {member.fullName}
                        {member.id === user?.userId && (
                          <span className="ml-2 text-xs font-medium text-muted">(you)</span>
                        )}
                      </p>
                      <p className="truncate text-sm text-muted">{member.email}</p>
                    </div>
                    <RoleBadge role={member.role} />
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
